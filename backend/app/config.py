from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    supabase_url: str
    supabase_key: str

    kiwoom_app_key: str
    kiwoom_app_secret: str

    kis_app_key: Optional[str] = None
    kis_app_secret: Optional[str] = None

    telegram_bot_token: Optional[str] = None
    telegram_chat_id: Optional[str] = None

    class Config:
        env_file = ".env"


settings = Settings()
