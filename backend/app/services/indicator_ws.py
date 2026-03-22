"""
실시간 기술적 지표 WebSocket 세션 관리

- 동일 (stock_code, candle_type) 세션을 여러 클라이언트가 공유
- 장중: 1분 주기로 새 캔들 수신 → 지표 재계산 → 전체 브로드캐스트
- 장외: 마지막 계산값 즉시 전송 후 유지
"""
import asyncio
import json
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import WebSocket

from app.services import kiwoom
from app.services.kiwoom_ws import _is_market_open, stream_prices
from app.services.indicators import calculate_indicators
from app.models.stock import StockCandle


# ─── 벤치마크 캐시 (KOSPI 일봉, 세션 간 공유) ────────────
_benchmark_cache: Optional[list[StockCandle]] = None
_benchmark_fetched_at: float = 0
_benchmark_lock: Optional[asyncio.Lock] = None

BENCHMARK_TTL = 3600  # 1시간


def _get_benchmark_lock() -> asyncio.Lock:
    global _benchmark_lock
    if _benchmark_lock is None:
        _benchmark_lock = asyncio.Lock()
    return _benchmark_lock


async def _get_benchmark() -> Optional[list[StockCandle]]:
    global _benchmark_cache, _benchmark_fetched_at
    now = datetime.now().timestamp()
    if _benchmark_cache and now - _benchmark_fetched_at < BENCHMARK_TTL:
        return _benchmark_cache
    async with _get_benchmark_lock():
        now = datetime.now().timestamp()
        if _benchmark_cache and now - _benchmark_fetched_at < BENCHMARK_TTL:
            return _benchmark_cache
        try:
            candles = await kiwoom.get_domestic_index_candles("001", "D", 300)  # KOSPI 지수
            if candles:
                _benchmark_cache = candles
                _benchmark_fetched_at = now
        except Exception as e:
            print(f"[indicator_ws] KOSPI 벤치마크 조회 실패: {e}")
    return _benchmark_cache


# ─── 세션 ────────────────────────────────────────────────

class IndicatorSession:
    """(stock_code, candle_type) 한 쌍에 대한 지표 계산 세션"""

    def __init__(self, code: str, candle_type: str):
        self.code = code
        self.candle_type = candle_type  # "1", "5", "60", "D", "W", "M"
        self.clients: list[WebSocket] = []
        self._last_payload: Optional[str] = None
        self._task: Optional[asyncio.Task] = None
        self._running = False

    def is_realtime(self) -> bool:
        """분봉 + 장중일 때만 실시간 WS 업데이트"""
        return self.candle_type in ("1", "5", "60") and _is_market_open()

    async def add_client(self, ws: WebSocket):
        self.clients.append(ws)
        # 이전 데이터 즉시 전송 (깜빡임 방지)
        if self._last_payload:
            try:
                await ws.send_text(self._last_payload)
            except Exception:
                pass
        # 세션 루프 시작
        if not self._running:
            self._running = True
            self._task = asyncio.create_task(self._run())

    def remove_client(self, ws: WebSocket):
        if ws in self.clients:
            self.clients.remove(ws)

    async def _broadcast(self, payload: str):
        self._last_payload = payload
        dead = []
        for ws in list(self.clients):
            try:
                await ws.send_text(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.remove_client(ws)

    async def _fetch_and_calc(self) -> Optional[dict]:
        """캔들 조회 + 지표 계산"""
        try:
            candle_type = self.candle_type
            if candle_type == "D":
                candles = await kiwoom.get_daily_candles(self.code, count=300)
            elif candle_type == "W":
                candles = await kiwoom.get_weekly_candles(self.code, count=150)
            elif candle_type == "M":
                candles = await kiwoom.get_monthly_candles(self.code, count=120)
            else:
                interval = int(candle_type)
                candles = await kiwoom.get_minute_candles(self.code, interval=interval, count=300)

            if not candles:
                return None

            benchmark = await _get_benchmark() if candle_type == "D" else None
            result = await calculate_indicators(candles, benchmark)
            result["code"] = self.code
            result["candle_type"] = candle_type
            return result
        except Exception as e:
            print(f"[indicator_ws] {self.code}/{self.candle_type} 계산 오류: {e}")
            return None

    async def _run(self):
        """초기 계산 후 1분 주기 업데이트 (장중 분봉만)"""
        try:
            # 초기 계산
            result = await self._fetch_and_calc()
            if result:
                await self._broadcast(json.dumps(result, ensure_ascii=False))

            # 분봉만 실시간 갱신
            while self.clients and self.candle_type in ("1", "5", "60"):
                await asyncio.sleep(60)
                if not self.clients:
                    break
                if not _is_market_open():
                    continue
                result = await self._fetch_and_calc()
                if result:
                    await self._broadcast(json.dumps(result, ensure_ascii=False))
        except asyncio.CancelledError:
            pass
        except Exception as e:
            print(f"[indicator_ws] session error {self.code}: {e}")
        finally:
            self._running = False


# ─── 세션 레지스트리 ──────────────────────────────────────

_sessions: dict[str, IndicatorSession] = {}


def _session_key(code: str, candle_type: str) -> str:
    return f"{code}:{candle_type}"


def get_or_create_session(code: str, candle_type: str) -> IndicatorSession:
    key = _session_key(code, candle_type)
    if key not in _sessions:
        _sessions[key] = IndicatorSession(code, candle_type)
    return _sessions[key]


def cleanup_empty_sessions():
    for key in list(_sessions.keys()):
        s = _sessions[key]
        if not s.clients and not s._running:
            del _sessions[key]
