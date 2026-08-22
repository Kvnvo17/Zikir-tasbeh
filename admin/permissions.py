from __future__ import annotations

import hashlib
import hmac
import time
from typing import Optional

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.config import settings
from backend.database import get_session
from backend.models import Admin


def make_admin_token(telegram_id: int) -> str:
    """Simple signed token: telegram_id.expiry.signature — issued after the
    bot verifies the admin logged in via Telegram deep-link / initData."""
    expiry = int(time.time()) + 60 * 60 * 12  # 12h
    payload = f"{telegram_id}.{expiry}"
    sig = hmac.new(settings.ADMIN_SECRET_KEY.encode(), payload.encode(), hashlib.sha256).hexdigest()
    return f"{payload}.{sig}"


def verify_admin_token(token: str) -> Optional[int]:
    try:
        telegram_id_s, expiry_s, sig = token.split(".")
        payload = f"{telegram_id_s}.{expiry_s}"
        expected = hmac.new(settings.ADMIN_SECRET_KEY.encode(), payload.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, sig):
            return None
        if int(expiry_s) < int(time.time()):
            return None
        return int(telegram_id_s)
    except (ValueError, AttributeError):
        return None


async def require_admin(
    x_admin_token: str = Header(default=""),
    session: AsyncSession = Depends(get_session),
) -> Admin:
    telegram_id = verify_admin_token(x_admin_token)
    if telegram_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired admin token")

    result = await session.execute(select(Admin).where(Admin.telegram_id == telegram_id))
    admin = result.scalar_one_or_none()
    if admin is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not an admin")
    return admin


async def require_super_admin(
    admin: Admin = Depends(require_admin),
) -> Admin:
    if not admin.is_super_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super admin only")
    return admin
