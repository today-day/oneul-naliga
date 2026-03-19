from fastapi import APIRouter, Query
from typing import Optional
from app.database import get_supabase

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("/")
async def get_alerts(
    stock_code: Optional[str] = Query(default=None, description="종목 코드 필터"),
    user_id: Optional[str] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
):
    """알림 로그 조회 (최신순)"""
    db = get_supabase()
    query = db.table("alerts").select("*").order("created_at", desc=True).limit(limit)
    if stock_code:
        query = query.eq("stock_code", stock_code)
    if user_id:
        query = query.eq("user_id", user_id)
    return query.execute().data


@router.delete("/{alert_id}")
async def delete_alert(alert_id: str, user_id: Optional[str] = Query(default=None)):
    """알림 로그 삭제"""
    db = get_supabase()
    query = db.table("alerts").delete().eq("id", alert_id)
    if user_id:
        query = query.eq("user_id", user_id)
    query.execute()
    return {"deleted": alert_id}


@router.post("/test-telegram")
async def test_telegram():
    """텔레그램 봇 연결 테스트"""
    from app.services.telegram import send_alert
    try:
        await send_alert(
            line={"stock_code": "TEST", "signal_type": "attack", "timeframe": "-", "name": "연결 테스트"},
            current_price=0, target_price=0, diff_pct=0,
        )
        return {"ok": True, "message": "텔레그램 메시지 전송 성공"}
    except Exception as e:
        return {"ok": False, "message": str(e)}
