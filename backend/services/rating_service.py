from __future__ import annotations

import datetime as dt
from typing import List

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import DailyStat, Rating, User, WeeklyStat
from backend.schemas import RatingResponse, RatingRow


def _week_start(d: dt.date) -> dt.date:
    return d - dt.timedelta(days=d.weekday())


async def get_rating(session: AsyncSession, period: str, requesting_user: User, limit: int = 50) -> RatingResponse:
    today = dt.date.today()

    if period == "daily":
        stmt = (
            select(User, DailyStat.count)
            .join(DailyStat, DailyStat.user_id == User.id)
            .where(DailyStat.date == today, User.is_banned.is_(False))
            .order_by(DailyStat.count.desc())
        )
    elif period == "weekly":
        stmt = (
            select(User, WeeklyStat.count)
            .join(WeeklyStat, WeeklyStat.user_id == User.id)
            .where(WeeklyStat.week_start == _week_start(today), User.is_banned.is_(False))
            .order_by(WeeklyStat.count.desc())
        )
    else:  # all-time
        stmt = (
            select(User, Rating.all_time_count)
            .join(Rating, Rating.user_id == User.id)
            .where(User.is_banned.is_(False))
            .order_by(Rating.all_time_count.desc())
        )

    result = await session.execute(stmt)
    rows = result.all()

    top: List[RatingRow] = []
    me_row = None
    for idx, (u, count) in enumerate(rows, start=1):
        row = RatingRow(
            rank=idx,
            first_name=u.first_name,
            username=u.username,
            photo_url=u.photo_url,
            count=count or 0,
            is_me=(u.id == requesting_user.id),
        )
        if u.id == requesting_user.id:
            me_row = row
        if idx <= limit:
            top.append(row)

    return RatingResponse(period=period, top=top, me=me_row)
