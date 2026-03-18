from pydantic import BaseModel
from typing import Literal, Optional


class Alert(BaseModel):
    """알림 로그 응답 모델"""
    id: str
    stock_code: str
    line_id: Optional[str] = None
    signal_type: Literal["attack", "loss"]
    current_price: float
    target_price: float
    distance_pct: float
    created_at: str
