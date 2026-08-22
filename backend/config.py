from __future__ import annotations

from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    BOT_TOKEN: str
    BOT_USERNAME: str = ""

    DATABASE_URL: str = "sqlite+aiosqlite:///./local.db"

    WEBAPP_URL: str = ""
    TUTORIAL_URL: str = ""
    API_BASE_URL: str = ""

    SUPER_ADMIN_IDS: str = ""
    ADMIN_SECRET_KEY: str = "dev-secret-change-me"

    ENVIRONMENT: str = "development"
    TIMEZONE: str = "Asia/Tashkent"
    PORT: int = 8000

    BOT_MODE: str = "polling"  # polling | webhook
    WEBHOOK_BASE_URL: str = ""
    WEBHOOK_SECRET: str = "dev-webhook-secret"

    DAILY_MIN_ZIKR: int = 33

    @property
    def super_admin_ids(self) -> List[int]:
        ids: List[int] = []
        for part in self.SUPER_ADMIN_IDS.split(","):
            part = part.strip()
            if part.isdigit():
                ids.append(int(part))
        return ids

    @property
    def is_sqlite(self) -> bool:
        return self.DATABASE_URL.startswith("sqlite")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
