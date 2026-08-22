import hmac
import hashlib
import json
from urllib.parse import parse_qsl, unquote
from fastapi import Header, HTTPException, status, Depends
from backend.config import settings


def verify_telegram_init_data(init_data: str) -> dict:
    if not init_data:
        # Development / Fallback mode
        return {"id": 123456789, "first_name": "Demo User", "username": "demo_user"}

    try:
        parsed_data = dict(parse_qsl(init_data))
        if "hash" not in parsed_data:
            raise ValueError("Hash missing")

        hash_str = parsed_data.pop("hash")
        data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(parsed_data.items()))

        secret_key = hmac.new(b"WebAppData", settings.BOT_TOKEN.encode(), hashlib.sha256).digest()
        calculated_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

        if calculated_hash != hash_str:
            raise ValueError("Invalid hash verification")

        user_data = json.loads(unquote(parsed_data.get("user", "{}")))
        return user_data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Telegram autentifikatsiya xatosi: {str(e)}"
        )


async def get_current_user_tg(x_telegram_init_data: str = Header(None, alias="X-Telegram-Init-Data")) -> dict:
    return verify_telegram_init_data(x_telegram_init_data or "")
async def get_current_user_tg(
    x_telegram_init_data: str = Header(
        None,
        alias="X-Telegram-Init-Data"
    )
) -> dict:
    return verify_telegram_init_data(x_telegram_init_data or "")


async def get_verified_telegram_user(
    x_telegram_init_data: str = Header(
        None,
        alias="X-Telegram-Init-Data"
    )
) -> dict:
    return verify_telegram_init_data(x_telegram_init_data or "")
