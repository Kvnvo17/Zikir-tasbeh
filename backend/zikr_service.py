from __future__ import annotations

from typing import List

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import User, Zikr, ZikrSubmission

DEFAULT_ZIKRS = ["Subhanalloh", "Alhamdulillah", "Allohu Akbar"]


async def ensure_default_zikrs(session: AsyncSession) -> None:
    result = await session.execute(select(func.count()).select_from(Zikr).where(Zikr.is_default.is_(True)))
    if (result.scalar_one() or 0) > 0:
        return
    for i, text in enumerate(DEFAULT_ZIKRS):
        session.add(Zikr(text=text, is_default=True, is_active=True, order=i))
    await session.commit()


async def list_active_zikrs(session: AsyncSession) -> List[Zikr]:
    result = await session.execute(select(Zikr).where(Zikr.is_active.is_(True)).order_by(Zikr.order, Zikr.id))
    return list(result.scalars().all())


async def submit_zikr(session: AsyncSession, user: User, text: str) -> ZikrSubmission:
    submission = ZikrSubmission(user_id=user.id, original_text=text.strip(), status="pending")
    session.add(submission)
    await session.commit()
    await session.refresh(submission)
    return submission


async def list_user_submissions(session: AsyncSession, user: User) -> List[ZikrSubmission]:
    result = await session.execute(
        select(ZikrSubmission).where(ZikrSubmission.user_id == user.id).order_by(ZikrSubmission.created_at.desc())
    )
    return list(result.scalars().all())


async def zikr_submitters_rating(session: AsyncSession, limit: int = 50):
    """Ranking of users by number of APPROVED zikr submissions."""
    stmt = (
        select(User.first_name, User.username, func.count(ZikrSubmission.id).label("approved_count"))
        .join(ZikrSubmission, ZikrSubmission.user_id == User.id)
        .where(ZikrSubmission.status == "approved")
        .group_by(User.id)
        .order_by(func.count(ZikrSubmission.id).desc())
        .limit(limit)
    )
    result = await session.execute(stmt)
    return result.all()
