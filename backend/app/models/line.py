from pydantic import BaseModel
from typing import Literal, Optional


class LineCreate(BaseModel):
    """선 생성 요청 모델"""
    stock_code: str
    timeframe: Literal["일봉", "주봉", "월봉", "60분", "30분"]
    line_type: Literal["trend", "horizontal"]
    signal_type: Literal["attack", "loss"]
    name: Optional[str] = None

    # 추세선용 (두 고점)
    x1: Optional[int] = None   # Unix timestamp
    y1: Optional[float] = None
    x2: Optional[int] = None
    y2: Optional[float] = None
    slope: Optional[float] = None
    intercept: Optional[float] = None

    # 수평선용
    price: Optional[float] = None

    sensitivity: float = 0.5  # 알림 민감도 (±%)


class LineUpdate(BaseModel):
    """선 수정 요청 모델 (부분 업데이트)"""
    name: Optional[str] = None
    sensitivity: Optional[float] = None
    is_active: Optional[bool] = None
