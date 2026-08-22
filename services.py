from __future__ import annotations

import datetime as dt

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import (
    Broadcast,
    RewardCampaign,
    TasbehSession,
    User,
    ZikrSubmission,
)


async def dashboard_stats(session: AsyncSession) -> dict:
    total_users = (await session.execute(select(func.count()).select_from(User))).scalar_one()
    today = dt.date.today()
    today_taps = (
        await session.execute(
            select(func.count()).select_from(TasbehSession).where(
                func.date(TasbehSession.server_ts) == today
            )
        )
    ).scalar_one()
    pending_submissions = (
        await session.execute(
            select(func.count()).select_from(ZikrSubmission).where(ZikrSubmission.status == "pending")
        )
    ).scalar_one()
    pending_campaigns = (
        await session.execute(
            select(func.count()).select_from(RewardCampaign).where(RewardCampaign.status == "pending_approval")
        )
    ).scalar_one()
    broadcasts_sent = (
        await session.execute(select(func.count()).select_from(Broadcast).where(Broadcast.status == "done"))
    ).scalar_one()

    return {
        "total_users": total_users,
        "today_taps": today_taps,
        "pending_submissions": pending_submissions,
        "pending_campaigns": pending_campaigns,
        "broadcasts_sent": broadcasts_sent,
    }
