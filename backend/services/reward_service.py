from __future__ import annotations

import datetime as dt
from typing import List

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import RewardCampaign, RewardWinner, TasbehSession, User


async def get_active_campaign(session: AsyncSession) -> RewardCampaign | None:
    today = dt.date.today()
    result = await session.execute(
        select(RewardCampaign).where(
            RewardCampaign.status == "active",
            RewardCampaign.start_date <= today,
            RewardCampaign.end_date >= today,
        )
    )
    return result.scalar_one_or_none()


async def close_expired_campaigns_and_compute_winners(session: AsyncSession) -> List[RewardCampaign]:
    """Run periodically by the scheduler. For any active campaign whose end_date
    has passed, compute the top N users by non-suspicious taps within the
    campaign window and move the campaign to pending_approval."""
    today = dt.date.today()
    result = await session.execute(
        select(RewardCampaign).where(RewardCampaign.status == "active", RewardCampaign.end_date < today)
    )
    expired = list(result.scalars().all())

    for campaign in expired:
        start_dt = dt.datetime.combine(campaign.start_date, dt.time.min, tzinfo=dt.timezone.utc)
        end_dt = dt.datetime.combine(campaign.end_date + dt.timedelta(days=1), dt.time.min, tzinfo=dt.timezone.utc)

        from sqlalchemy import func

        stmt = (
            select(TasbehSession.user_id, func.count(TasbehSession.id).label("cnt"))
            .where(
                and_(
                    TasbehSession.server_ts >= start_dt,
                    TasbehSession.server_ts < end_dt,
                    TasbehSession.flagged_suspicious.is_(False),
                )
            )
            .group_by(TasbehSession.user_id)
            .order_by(func.count(TasbehSession.id).desc())
            .limit(campaign.winners_count)
        )
        rows = (await session.execute(stmt)).all()

        for place, (user_id, cnt) in enumerate(rows, start=1):
            session.add(
                RewardWinner(
                    campaign_id=campaign.id,
                    user_id=user_id,
                    place=place,
                    count=cnt,
                    approved=False,
                )
            )

        campaign.status = "pending_approval"

    if expired:
        await session.commit()

    return expired


async def approve_campaign(session: AsyncSession, campaign: RewardCampaign) -> None:
    campaign.status = "closed"
    result = await session.execute(select(RewardWinner).where(RewardWinner.campaign_id == campaign.id))
    for winner in result.scalars().all():
        winner.approved = True
    await session.commit()
