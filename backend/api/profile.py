from __future__ import annotations

import datetime as dt
from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.api.users import current_user
from backend.database import get_session
from backend.models import Achievement, DailyStat, Streak, User, UserAchievement
from backend.schemas import AchievementOut, HistoryPoint

router = APIRouter(prefix="/api/profile", tags=["profile"])

WEEKDAY_LABELS_UZ = ["Dush", "Sesh", "Chor", "Pay", "Juma", "Shan", "Yak"]


@router.get("/history", response_model=List[HistoryPoint])
async def history(
    range: str = Query(default="7d", pattern="^(today|7d|30d|all)$"),
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> list:
    today = dt.date.today()

    if range == "today":
        result = await session.execute(
            select(DailyStat).where(DailyStat.user_id == user.id, DailyStat.date == today)
        )
        row = result.scalar_one_or_none()
        return [HistoryPoint(label="Bugun", count=row.count if row else 0)]

    if range in ("7d", "30d"):
        days = 7 if range == "7d" else 30
        start = today - dt.timedelta(days=days - 1)
        result = await session.execute(
            select(DailyStat).where(DailyStat.user_id == user.id, DailyStat.date >= start)
        )
        by_date = {row.date: row.count for row in result.scalars().all()}
        points = []
        for i in range_days(days):
            d = start + dt.timedelta(days=i)
            label = WEEKDAY_LABELS_UZ[d.weekday()] if days == 7 else d.strftime("%d.%m")
            points.append(HistoryPoint(label=label, count=by_date.get(d, 0)))
        return points

    # all
    result = await session.execute(select(DailyStat).where(DailyStat.user_id == user.id).order_by(DailyStat.date))
    return [HistoryPoint(label=row.date.strftime("%d.%m.%Y"), count=row.count) for row in result.scalars().all()]


def range_days(n: int):
    return range(n)


@router.get("/achievements", response_model=List[AchievementOut])
async def achievements(
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> list:
    all_ach = (await session.execute(select(Achievement).order_by(Achievement.threshold))).scalars().all()
    unlocked_ids = {
        ua.achievement_id
        for ua in (
            await session.execute(select(UserAchievement).where(UserAchievement.user_id == user.id))
        ).scalars()
    }
    return [
        AchievementOut(
            code=a.code, title=a.title, icon=a.icon, threshold=a.threshold, unlocked=a.id in unlocked_ids
        )
        for a in all_ach
    ]


@router.get("/streak")
async def streak(
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(Streak).where(Streak.user_id == user.id))
    s = result.scalar_one_or_none()
    if s is None:
        return {"current_streak": 0, "longest_streak": 0}
    return {"current_streak": s.current_streak, "longest_streak": s.longest_streak}
