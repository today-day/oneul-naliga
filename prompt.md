# oneul-naliga 프로젝트 전체 지시사항

## 프로젝트 개요

주식 차트에서 사용자가 직접 추세선/지지저항선을 설정하면,
서버가 24시간 현재가를 감시하다가 선에 닿으면 텔레그램으로 알림을 보내는 웹앱.

## 기술 스택

프론트엔드: React + Vite + Tailwind CSS + Lightweight Charts
백엔드: FastAPI (Python)
DB: Supabase (PostgreSQL)
서버: Railway
알림: 텔레그램 봇
국내 주식: 키움 REST API
해외 주식: 한국투자증권(KIS) REST API

## 프로젝트 폴더 구조
oneul-naliga/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI 앱 + startup 이벤트에서 monitor 실행
│   │   ├── config.py            # 환경변수 설정
│   │   ├── database.py          # Supabase 연결
│   │   ├── routers/
│   │   │   ├── stocks.py        # 종목 검색, 차트 데이터
│   │   │   ├── lines.py         # 선 CRUD
│   │   │   └── alerts.py        # 알림 로그
│   │   ├── services/
│   │   │   ├── kiwoom.py        # 키움 REST API 연동
│   │   │   ├── kis.py           # 한국투자증권 API 연동
│   │   │   ├── monitor.py       # 24시간 감시 로직
│   │   │   ├── telegram.py      # 텔레그램 알림 발송
│   │   │   └── peak_detector.py # 고점/저점 자동 탐지 알고리즘
│   │   ├── workers/
│   │   │   └── monitor.py       # asyncio background task (main.py startup에서 실행)
│   │   └── models/
│   │       ├── stock.py
│   │       ├── line.py
│   │       └── alert.py
│   ├── Dockerfile
│   ├── .env
│   ├── .env.example
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.jsx         # 관심 종목 리스트
│   │   │   └── ChartDetail.jsx  # 차트 상세 + 선 관리
│   │   ├── components/
│   │   │   ├── AddLineModal.jsx  # 선 추가 모달
│   │   │   ├── AutoDetectPanel.jsx # 자동 고점 탐지 (모바일)
│   │   │   └── ChartClickPanel.jsx # 차트 클릭 선 긋기 (PC)
│   │   └── api/
│   │       ├── stocks.js
│   │       ├── lines.js
│   │       └── alerts.js
│   ├── index.html
│   └── package.json
└── railway.json

## DB 테이블 구조 (Supabase PostgreSQL)

```
-- 관심 종목
CREATE TABLE stocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) NOT NULL,       -- 005930 or AAPL
    name VARCHAR(50) NOT NULL,
    market VARCHAR(10) NOT NULL,     -- 국내 / 해외
    created_at TIMESTAMP DEFAULT NOW()
);

-- 사용자가 그은 선
CREATE TABLE lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_code VARCHAR(20) NOT NULL,
    timeframe VARCHAR(10) NOT NULL,  -- 일봉 / 주봉 / 월봉 / 60분 / 30분
    line_type VARCHAR(20) NOT NULL,  -- trend(추세선) / horizontal(수평선)
    signal_type VARCHAR(10) NOT NULL,-- attack(공격) / loss(로스)
    name VARCHAR(50),
    x1 BIGINT,                       -- timestamp (추세선용)
    y1 FLOAT,
    x2 BIGINT,
    y2 FLOAT,
    slope FLOAT,                     -- 기울기 (추세선: y = slope * x + intercept)
    intercept FLOAT,
    price FLOAT,                     -- 수평선용 고정 가격
    sensitivity FLOAT DEFAULT 0.5,  -- 알림 민감도 (±%)
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 알림 로그
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_code VARCHAR(20) NOT NULL,
    line_id UUID REFERENCES lines(id),
    signal_type VARCHAR(10) NOT NULL,
    current_price FLOAT NOT NULL,
    target_price FLOAT NOT NULL,
    distance_pct FLOAT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 차트 데이터 캐시 (일봉/주봉/월봉만 저장, 분봉은 실시간 호출)
CREATE TABLE candles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_code VARCHAR(20) NOT NULL,
    timeframe VARCHAR(10) NOT NULL,
    dt DATE NOT NULL,
    open_price FLOAT,
    high_price FLOAT,
    low_price FLOAT,
    close_price FLOAT,
    volume BIGINT,
    UNIQUE(stock_code, timeframe, dt)
);
```

## 핵심 기능 상세
1. 주식 데이터 수집
국내 주식 (키움 REST API)

- 베이스 URL: https://api.kiwoom.com
- 토큰 발급: POST /oauth2/token (grant_type, appkey, secretkey)
- 일봉 데이터: POST /api/dostk/chart (api-id: ka10081)
- 주봉: ka10082 / 월봉: ka10083 / 분봉: ka10080 / 년봉: ka10094
- 실시간 시세: WebSocket

해외 주식 (한국투자증권 API)

- 베이스 URL: https://openapi.koreainvestment.com:9443
- 미국 주식 일봉, 실시간 시세

종목 자동구분
```
def get_client(stock_code: str):
    if stock_code.isdigit() and len(stock_code) == 6:
        return KiwoomClient()  # 국내
    else:
        return KISClient()     # 해외
```

분봉 데이터는 DB 저장 안 함

 일봉/주봉/월봉만 candles 테이블에 저장
- 분봉은 차트 조회 시 API 실시간 호출

2. 선 긋기 기능
선 종류

- 추세선: 고점 2개 연결 → 직선 방정식 (y = slope * x + intercept)
- 수평선: 특정 가격 고정
- 이동평균선: 5일 / 20일 / 60일 (백엔드에서 pandas로 계산)

반응형 UI

- 모바일 (md 미만): 자동 고점 탐지 + 날짜/가격 직접 입력
- PC (md 이상): 차트 직접 클릭 + 자동 탐지 + 날짜/가격 입력
- 로직은 공통, UI만 분리

3. 자동 고점 탐지 알고리즘

```
from scipy.signal import argrelextrema
import numpy as np

def find_peaks(prices: list, n: int = 10):
    arr = np.array(prices)
    peak_indices = argrelextrema(arr, np.greater, order=n)[0]
    return peak_indices

def find_valleys(prices: list, n: int = 10):
    arr = np.array(prices)
    valley_indices = argrelextrema(arr, np.less, order=n)[0]
    return valley_indices
```

봉별 기본 N값 (사용자가 슬라이더로 조절 가능)

- 분봉: N=20
- 일봉: N=10 (기본)
- 주봉: N=5
- 월봉: N=3

민감도 슬라이더

- 낮음(큰 고점만) N=30 ←→ 높음(작은 고점도) N=5
- 봉 종류 변경 시 자동으로 기본 N값으로 리셋

4. 24시간 감시 루프
핵심 원칙

- REST API 폴링(매초 호출) 절대 사용 금지 → 속도 제한 초과
- 실시간 감시는 WebSocket으로 키움이 먼저 푸시해주는 방식 사용
- 일봉/주봉/월봉은 장 마감 후 하루 1번만 REST 호출

REST API   → 과거 차트 데이터 (1회성)
WebSocket  → 실시간 현재가 (키움이 변동 시 자동 전송)

- 감시 방식 분리
선               |    종류감시       |   방식체크 주기
분봉/실시간 선     |  WebSocket      |   가격 변동 시 즉시 
일봉/주봉/월봉 선  | REST 1회 호출    |   장 마감 후 1회

```
# main.py startup에서 두 태스크 동시 실행

@app.on_event("startup")
async def startup():
    asyncio.create_task(realtime_monitor())   # 분봉용 WebSocket
    asyncio.create_task(daily_monitor())      # 일봉/주봉/월봉용


# ① 실시간 감시 (분봉/실시간 선) - WebSocket
async def realtime_monitor():
    uri = "wss://openapi.kiwoom.com/api/dostk/websocket"

    async with websockets.connect(uri) as ws:
        # 인증
        await ws.send(json.dumps({
            "token": TOKEN,
            "type": "auth"
        }))

        # 관심 종목 구독 (한 번만 등록)
        stocks = await db.get_active_stocks()
        await ws.send(json.dumps({
            "type": "subscribe",
            "stocks": [s.code for s in stocks]
        }))

        # 키움이 가격 변동 시 자동으로 보내줌
        async for msg in ws:
            data = json.loads(msg)
            stock_code = data["code"]
            current_price = float(data["price"])

            # 이 종목의 분봉 선만 비교
            lines = await db.get_realtime_lines(stock_code)
            for line in lines:
                await check_and_alert(line, current_price)


# ② 일봉/주봉/월봉 선 감시 - 장 마감 후 REST 1회
async def daily_monitor():
    while True:
        now = datetime.now(KST)

        # 장 마감 후 (15:30 ~ 16:00 사이 1회 실행)
        if now.hour == 15 and now.minute >= 30:
            lines = await db.get_daily_lines()  # 일봉/주봉/월봉 선만
            for line in lines:
                price = await kiwoom.get_close_price(line.stock_code)
                await check_and_alert(line, price)

        await asyncio.sleep(60)  # 1분마다 시간 체크 (API 호출 아님)


# 공통 알림 체크 함수
async def check_and_alert(line, current_price):
    # 추세선: 현재 시점의 선 위 가격 계산
    if line.line_type == "trend":
        now = time.time()
        target = line.slope * now + line.intercept
    else:
        target = line.price

    # 민감도 범위 진입 시 알림
    diff = abs(current_price - target) / target * 100
    if diff <= line.sensitivity:
        # 중복 알림 방지: 최근 1시간 내 동일 선 알림 있으면 스킵
        if not await db.recent_alert_exists(line.id):
            await telegram.send_alert(line, current_price, target, diff)
            await db.save_alert(line, current_price, target, diff)
```

중복 알림 방지 필수

- 같은 선에 대해 1시간 내 재알림 차단
- alerts 테이블에서 최근 알림 시각 확인 후 발송

5. 텔레그램 알림 메시지

```
📈 [삼성전자 005930] 공격 지점 도달!

봉 종류: 일봉
선 이름: 1월 고점 저항선
현재가:  72,400원
선 가격: 72,300원
거리:    0.1%

→ 설정한 지지선에 근접했습니다
```

6. 전략 프리셋 (개인화)

사용자가 자주 쓰는 선 조합을 프리셋으로 저장
새 종목에 원클릭으로 동일한 선 세트 적용
예: "정상영 기준" = 고점 추세선 + 20일선 + 수평 지지선

## 디자인 가이드
반응형

- 모바일 우선 설계
- md(768px) 기준으로 PC/모바일 분기

페이지 구성

- 홈: 관심 종목 리스트 + 현재가 + 선까지 거리% + 최근 알림
- 차트 상세: 캔들 차트 + 봉 종류 탭 + 선 관리 패널 + 알림 설정
- 설정: 키움/한투 API 키 + 텔레그램 봇 연동 + 기본 민감도