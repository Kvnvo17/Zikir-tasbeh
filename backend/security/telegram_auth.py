"""Validation of Telegram WebApp initData.

Reference: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
"""
from __future__ import annotations

import hashlib
import hmac
import json
import time
from typing import Any, Dict
from urllib.parse import parse_qsl

from fastapi import Header, HTTPException, status

from backend.config import settings


class TelegramAuthError(Exception):
    pass


def parse_and_validate_init_data(init_data: str, max_age_seconds: int = 86400) -> Dict[str, Any]:
    """Parse Telegram WebApp initData and verify its HMAC signature.

    Never trust a client-supplied telegram_id without this check.
    """
    if not init_data:
        raise TelegramAuthError("empty init_data")

    pairs = dict(parse_qsl(init_data, strict_parsing=False, keep_blank_values=True))
    received_hash = pairs.pop("hash", None)
    if not received_hash:
        raise TelegramAuthError("missing hash")

    data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(pairs.items()))

    secret_key = hmac.new(b"WebAppData", settings.BOT_TOKEN.encode(), hashlib.sha256).digest()
    computed_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

    if not hmac.compare_digest(computed_hash, received_hash):
        raise TelegramAuthError("invalid signature")

    auth_date = int(pairs.get("auth_date", "0"))
    if max_age_seconds and (time.time() - auth_date) > max_age_seconds:
        raise TelegramAuthError("init_data expired")

    user_raw = pairs.get("user")
    user = json.loads(user_raw) if user_raw else {}

    return {
        "user": user,
        "auth_date": auth_date,
        "query_id": pairs.get("query_id"),
        "start_param": pairs.get("start_param"),
        "raw": pairs,
    }


async def get_verified_telegram_user(x_telegram_init_data: str = Header(default="")) -> Dict[str, Any]:
    """FastAPI dependency: verifies the X-Telegram-Init-Data header and returns the user dict."""
    try:
        data = parse_and_validate_init_data(x_telegram_init_data)
    except TelegramAuthError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Telegram auth failed: {exc}")

    user = data.get("user") or {}
    if not user.get("id"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No user in init_data")

    return user
