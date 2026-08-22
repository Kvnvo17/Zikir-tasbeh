from __future__ import annotations

from typing import Any, Dict, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import Rating, Streak, User


async def get_or_create_user(session: AsyncSession, tg_user: Dict[str, Any], referred_by_code: Optional[str] = None) -> User:
    telegram_id = int(tg_user["id"])
    result = await session.execute(select(User).where(User.telegram_id == telegram_id))
    user = result.scalar_one_or_none()

    if user is None:
        user = User(
            telegram_id=telegram_id,
            first_name=tg_user.get("first_name") or "Foydalanuvchi",
            last_name=tg_user.get("last_name"),
            username=tg_user.get("username"),
            language_code=tg_user.get("language_code"),
            photo_url=tg_user.get("photo_url"),
        )

        if referred_by_code and referred_by_code.startswith("ref_"):
            ref_tg_id_raw = referred_by_code.removeprefix("ref_")
            if ref_tg_id_raw.isdigit():
                ref_result = await session.execute(select(User).where(User.telegram_id == int(ref_tg_id_raw)))
                referrer = ref_result.scalar_one_or_none()
                if referrer:
                    user.referred_by = referrer.id

        session.add(user)
        await session.flush()

        session.add(Rating(user_id=user.id, all_time_count=0))
        session.add(Streak(user_id=user.id, current_streak=0, longest_streak=0))
        await session.flush()

        if user.referred_by:
            from backend.models import Referral

            session.add(Referral(referrer_id=user.referred_by, referred_user_id=user.id))

        await session.commit()
    else:
        changed = False
        for field, value in (
            ("first_name", tg_user.get("first_name") or user.first_name),
            ("last_name", tg_user.get("last_name")),
            ("username", tg_user.get("username")),
            ("photo_url", tg_user.get("photo_url")),
        ):
            if getattr(user, field) != value:
                setattr(user, field, value)
                changed = True
        if changed:
            await session.commit()

    return user


async def get_user_by_telegram_id(session: AsyncSession, telegram_id: int) -> Optional[User]:
    result = await session.execute(select(User).where(User.telegram_id == telegram_id))
    return result.scalar_one_or_none()
