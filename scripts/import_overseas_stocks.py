"""
해외주식 종목 목록 갱신 스크립트
- 기존 NASDAQ/NYSE/AMEX 종목 삭제
- NASMST.COD / NYSMST.COD / AMSMST.COD 파싱 후 INSERT
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from supabase import create_client
from app.config import settings


def get_supabase():
    key = settings.supabase_service_key or settings.supabase_key
    return create_client(settings.supabase_url, key)

COD_FILES = [
    ("NASMST.COD", "NASDAQ"),
    ("NYSMST.COD", "NYSE"),
    ("AMSMST.COD", "AMEX"),
]

ROOT = os.path.join(os.path.dirname(__file__), "..")


def parse_cod(filepath: str, market: str) -> list[dict]:
    records = []
    with open(filepath, encoding="cp949", errors="replace") as f:
        for line in f:
            parts = line.strip().split("\t")
            if len(parts) < 8:
                continue
            code = parts[4].strip()
            name_kr = parts[6].strip()
            name_en = parts[7].strip()
            if not code:
                continue
            records.append({
                "code": code,
                "name": name_kr or name_en,
                "full_name": name_en,
                "market": market,
            })
    return records


def main():
    db = get_supabase()

    # 1. 기존 해외주식 삭제
    print("기존 해외주식 삭제 중...")
    for market in ["NASDAQ", "NYSE", "AMEX"]:
        res = db.table("stock_list").delete().eq("market", market).execute()
        print(f"  {market} 삭제 완료")

    # 2. cod 파싱 + INSERT (1000개씩 배치)
    for fname, market in COD_FILES:
        filepath = os.path.join(ROOT, fname)
        records = parse_cod(filepath, market)
        print(f"\n{fname}: {len(records)}개 파싱 완료")

        batch_size = 1000
        for i in range(0, len(records), batch_size):
            batch = records[i:i + batch_size]
            db.table("stock_list").insert(batch).execute()
            print(f"  {market} {i + len(batch)}/{len(records)} INSERT 완료")

    print("\n완료!")


if __name__ == "__main__":
    main()
