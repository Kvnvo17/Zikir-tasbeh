from __future__ import annotations

import datetime as dt

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.config import settings
from backend.models import Achievement, DailyStat, Rating, Streak, TasbehSession, User, UserAchievement, WeeklyStat
from backend.security.anti_cheat import register_tap


def _week_start(d: dt.date) -> dt.date:
    return d - dt.timedelta(days=d.weekday())


async def apply_increment(
    session: AsyncSession,
    user: User,
    zikr_id: int | None,
    mode: str,
) -> dict:
    now = dt.datetime.now(dt.timezone.utc)
    today = now.date()
    week_start = _week_start(today)

    suspicious = register_tap(user.id, now)

    tap = TasbehSession(
        user_id=user.id,
        zikr_id=zikr_id,
        mode=mode,
        increment=1,
        client_ts=now,
        server_ts=now,
        flagged_suspicious=suspicious,
    )
    session.add(tap)

    # Always credit the user's own personal counters - never block a real tap.
    user.total_count += 1

    daily_result = await session.execute(
        select(DailyStat).where(DailyStat.user_id == user.id, DailyStat.date == today)
    )
    daily = daily_result.scalar_one_or_none()
    if daily is None:
        daily = DailyStat(user_id=user.id, date=today, count=0)
        session.add(daily)
    daily.count += 1

    weekly_result = await session.execute(
        select(WeeklyStat).where(WeeklyStat.user_id == user.id, WeeklyStat.week_start == week_start)
    )
    weekly = weekly_result.scalar_one_or_none()
    if weekly is None:
        weekly = WeeklyStat(user_id=user.id, week_start=week_start, count=0)
        session.add(weekly)
    weekly.count += 1

    # Rating cache only counts non-suspicious taps toward the leaderboard/rewards.
    if not suspicious:
        rating_result = await session.execute(select(Rating).where(Rating.user_id == user.id))
        rating = rating_result.scalar_one_or_none()
        if rating is None:
            rating = Rating(user_id=user.id, all_time_count=0)
            session.add(rating)
        rating.all_time_count += 1
    else:
        rating_result = await session.execute(select(Rating).where(Rating.user_id == user.id))
        rating = rating_result.scalar_one_or_none()
        if rating:
            rating.is_suspicious = True

    await _update_streak(session, user, today)
    await _unlock_achievements(session, user)

    await session.commit()

    return {
        "today_count": daily.count,
        "week_count": weekly.count,
        "total_count": user.total_count,
        "daily_goal": user.daily_goal,
    }


async def _update_streak(session: AsyncSession, user: User, today: dt.date) -> None:
    result = await session.execute(select(Streak).where(Streak.user_id == user.id))
    streak = result.scalar_one_or_none()
    if streak is None:
        streak = Streak(user_id=user.id, current_streak=1, longest_streak=1, last_active_date=today)
        session.add(streak)
        return

    if streak.last_active_date == today:
        return  # already counted today

    if streak.last_active_date == today - dt.timedelta(days=1):
        streak.current_streak += 1
    else:
        streak.current_streak = 1

    streak.longest_streak = max(streak.longest_streak, streak.current_streak)
    streak.last_active_date = today


async def _unlock_achievements(session: AsyncSession, user: User) -> None:
    all_ach = (await session.execute(select(Achievement).where(Achievement.threshold <= user.total_count))).scalars().all()
    if not all_ach:
        return
    unlocked_ids = {
        ua.achievement_id
        for ua in (
            await session.execute(select(UserAchievement).where(UserAchievement.user_id == user.id))
        ).scalars()
    }
    for a in all_ach:
        if a.id not in unlocked_ids:
            session.add(UserAchievement(user_id=user.id, achievement_id=a.id))
