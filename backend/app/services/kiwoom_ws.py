"""
키움 WebSocket 실시간 시세 클라이언트

프로토콜:
  1. 연결: wss://api.kiwoom.com:10000/api/dostk/websocket
  2. 로그인: {"trnm": "LOGIN", "token": "..."}
  3. 구독:  {"trnm": "REG", "grp_no": "1", "refresh": "1",
             "data": [{"item": ["005930"], "type": ["0B"]}]}
  4. 수신:  {"trnm": "REAL", "data": [{"type": "0B", "item": "005930",
             "values": {"10": "+74800", "11": "+100", "12": "+0.13"}}]}
  5. PING:  수신한 값 그대로 송신

실시간 항목:
  0B: 주식 현재가   (10=현재가, 11=전일대비, 12=등락율)
  0J: 업종지수      (10=현재가, 11=전일대비, 12=등락율)
"""
import asyncio
import json
import websockets

from app.services.kiwoom import get_access_token, invalidate_token

WS_URI         = "wss://api.kiwoom.com:10000/api/dostk/websocket"
RECONNECT_BASE = 5
RECONNECT_MAX  = 60


def _parse_price(raw: str) -> float:
    try:
        return float(str(raw).replace("+", "").replace(",", ""))
    except (ValueError, TypeError):
        return 0.0


async def stream_prices(stock_codes: list[str], on_price, real_type: str = "0B"):
    """
    실시간 가격 스트리밍. 연결 끊김 시 지수 백오프로 자동 재연결.

    Args:
        stock_codes: 구독할 종목/업종 코드 리스트
        on_price:    async callable(code: str, price: float, change_pct: str)
        real_type:   "0B"=주식현재가, "0J"=업종지수
    """
    attempt = 0

    while True:
        try:
            token = await get_access_token()

            async with websockets.connect(WS_URI) as ws:
                # 1. 로그인
                await ws.send(json.dumps({"trnm": "LOGIN", "token": token}))

                login_resp = json.loads(await asyncio.wait_for(ws.recv(), timeout=10.0))
                if login_resp.get("trnm") == "LOGIN":
                    if login_resp.get("return_code") != 0:
                        print(f"[kiwoom_ws] 로그인 실패: {login_resp.get('return_msg')}")
                        invalidate_token()
                        raise ValueError("login_failed")
                    print("[kiwoom_ws] 로그인 성공")

                # 2. 구독 등록
                await ws.send(json.dumps({
                    "trnm": "REG",
                    "grp_no": "1",
                    "refresh": "1",
                    "data": [{"item": stock_codes, "type": [real_type]}],
                }))
                print(f"[kiwoom_ws] 구독 완료: {stock_codes} ({real_type})")
                attempt = 0

                # 3. 메시지 수신 루프
                async for raw in ws:
                    try:
                        msg = json.loads(raw)

                        # PING → 그대로 반송
                        if msg.get("trnm") == "PING":
                            await ws.send(raw)
                            continue

                        # 실시간 데이터
                        if msg.get("trnm") == "REAL":
                            for item in msg.get("data", []):
                                code   = item.get("item")
                                values = item.get("values", {})
                                price  = _parse_price(values.get("10", "0"))
                                change = values.get("12", "0.00")
                                if code and price:
                                    await on_price(code, price, change)

                    except Exception as e:
                        print(f"[kiwoom_ws] 메시지 처리 오류: {e}")

        except Exception as e:
            delay = min(RECONNECT_BASE * (2 ** attempt), RECONNECT_MAX)
            attempt += 1
            print(f"[kiwoom_ws] 연결 오류: {e} → {delay}초 후 재연결 (시도 {attempt})")
            await asyncio.sleep(delay)
