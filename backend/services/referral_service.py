from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.config import settings
from backend.models import Referral, User


async def get_referral_info(session: AsyncSession, user: User) -> dict:
    result = await session.execute(select(func.count()).select_from(Referral).where(Referral.referrer_id == user.id))
    invited_count = result.scalar_one() or 0

    bot_username = settings.BOT_USERNAME or "your_bot"
    link = f"https://t.me/{bot_username}?start=ref_{user.telegram_id}"

    return {"link": link, "invited_count": invited_count}
