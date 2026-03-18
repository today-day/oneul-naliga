from fastapi import APIRouter, HTTPException, Query
from typing import Literal
from pydantic import BaseModel
import httpx

from app.services import kiwoom, kis
from app.services.peak_detector import find_peaks, find_valleys
from app.database import get_supabase
from app.data.stock_list import search_stocks

router = APIRouter(prefix="/stocks", tags=["stocks"])


# ─────────────────────────────────────────
# 종목 검색
# ─────────────────────────────────────────

@router.get("/search")
async def search(q: str = Query(default="", min_length=1)):
    """종목 이름 또는 코드로 검색"""
    return search_stocks(q, limit=10)


# ─────────────────────────────────────────
# 인기종목 랭킹
# ─────────────────────────────────────────

@router.get("/ranking")
async def get_ranking(type: str = Query(default="view")):
    """인기종목 랭킹 조회 (type: view|volume|amount|surge|rise|fall|foreign|institution|etf)"""
    try:
        return await kiwoom.get_ranking(type)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.get("/indices")
async def get_indices():
    """KOSPI / KOSDAQ 지수 조회"""
    try:
        return await kiwoom.get_indices()
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


_fx_cache: dict = {"data": None, "expires_at": 0.0}

@router.get("/fx")
async def get_fx():
    """주요 환율 조회 (USD/KRW, EUR/KRW, JPY/KRW, CNY/KRW) — 1시간 캐시"""
    import time
    now = time.time()
    if _fx_cache["data"] and now < _fx_cache["expires_at"]:
        return _fx_cache["data"]

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get("https://open.er-api.com/v6/latest/USD")
            r.raise_for_status()
            data = r.json()

        rates = data.get("rates", {})
        krw = rates.get("KRW", 1)

        pairs = [
            ("USD/KRW", "USD",  1),
            ("EUR/KRW", "EUR",  1),
            ("JPY/KRW", "JPY", 100),   # 한국 관행: 100엔 기준
            ("CNY/KRW", "CNY",  1),
            ("GBP/KRW", "GBP",  1),
        ]

        result = []
        for pair_name, currency, unit in pairs:
            rate = rates.get(currency, 1)
            value = krw if currency == "USD" else krw / rate * unit
            result.append({"pair": pair_name, "value": round(value, 2), "unit": unit})

        _fx_cache["data"] = result
        _fx_cache["expires_at"] = now + 3600  # 1시간
        return result
    except Exception as e:
        if _fx_cache["data"]:
            return _fx_cache["data"]  # 실패 시 이전 캐시 반환
        raise HTTPException(status_code=502, detail=str(e))


# ─────────────────────────────────────────
# 관심 종목 CRUD
# ─────────────────────────────────────────

class StockAdd(BaseModel):
    code: str
    name: str
    market: Literal["국내", "해외"]


@router.get("/")
async def get_watchlist():
    """관심 종목 목록 조회"""
    db = get_supabase()
    result = db.table("stocks").select("*").order("created_at", desc=False).execute()
    return result.data


@router.post("/")
async def add_stock(body: StockAdd):
    """관심 종목 추가"""
    db = get_supabase()
    # 중복 방지
    existing = db.table("stocks").select("id").eq("code", body.code).execute().data
    if existing:
        raise HTTPException(status_code=409, detail="이미 등록된 종목입니다")
    result = db.table("stocks").insert(body.model_dump()).execute()
    return result.data[0]


@router.delete("/{code}")
async def remove_stock(code: str):
    """관심 종목 삭제"""
    db = get_supabase()
    db.table("stocks").delete().eq("code", code).execute()
    return {"deleted": code}


# ─────────────────────────────────────────
# 차트 데이터
# ─────────────────────────────────────────

@router.get("/{market}/{symbol}/candles")
async def get_candles(
    market: Literal["KOSPI", "KOSDAQ", "US"],
    symbol: str,
    timeframe: str = Query(default="일봉"),
    count: int = Query(default=200, ge=1, le=500),
    exchange: str = Query(default="NAS", description="US 전용: NAS, NYS, AMS"),
):
    """캔들 데이터 조회 (timeframe: 일봉·주봉·월봉·60분·30분)"""
    try:
        if market in ("KOSPI", "KOSDAQ"):
            if timeframe == "주봉":
                candles = await kiwoom.get_weekly_candles(symbol, count)
            elif timeframe == "월봉":
                candles = await kiwoom.get_monthly_candles(symbol, count)
            elif timeframe in ("30분", "60분"):
                interval = int(timeframe.replace("분", ""))
                candles = await kiwoom.get_minute_candles(symbol, interval, count)
            else:  # 일봉 기본
                candles = await kiwoom.get_daily_candles(symbol, count)
        else:
            candles = await kis.get_daily_candles(symbol, count, exchange)
        return {"symbol": symbol, "market": market, "timeframe": timeframe, "candles": [c.model_dump() for c in candles]}
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.get("/{market}/{symbol}/price")
async def get_price(
    market: Literal["KOSPI", "KOSDAQ", "US"],
    symbol: str,
    exchange: str = Query(default="NAS"),
):
    """현재가 조회"""
    try:
        if market in ("KOSPI", "KOSDAQ"):
            price = await kiwoom.get_current_price(symbol)
        else:
            price = await kis.get_current_price(symbol, exchange)
        return {"symbol": symbol, "price": price}
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


# ─────────────────────────────────────────
# 고점 / 저점 자동 탐지
# ─────────────────────────────────────────

@router.get("/{market}/{symbol}/peaks")
async def get_peaks(
    market: Literal["KOSPI", "KOSDAQ", "US"],
    symbol: str,
    n: int = Query(default=10, ge=3, le=30, description="민감도 (낮을수록 더 많은 고점)"),
    exchange: str = Query(default="NAS"),
):
    """자동 고점 / 저점 탐지 (차트에 표시용)"""
    try:
        if market in ("KOSPI", "KOSDAQ"):
            candles = await kiwoom.get_daily_candles(symbol, 500)
        else:
            candles = await kis.get_daily_candles(symbol, 500, exchange)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

    highs  = [c.high  for c in candles]
    lows   = [c.low   for c in candles]
    dates  = [c.date  for c in candles]
    closes = [c.close for c in candles]

    peak_idx   = find_peaks(closes, n=n)
    valley_idx = find_valleys(closes, n=n)

    return {
        "peaks":   [{"date": dates[i], "price": highs[i]}  for i in peak_idx],
        "valleys": [{"date": dates[i], "price": lows[i]}   for i in valley_idx],
    }
