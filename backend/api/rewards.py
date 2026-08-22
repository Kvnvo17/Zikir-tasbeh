from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_session
from backend.models import RewardCard, Setting
from backend.schemas import RewardCampaignOut, RewardHelpResponse
from backend.services.reward_service import get_active_campaign

router = APIRouter(prefix="/api/rewards", tags=["rewards"])

DEFAULT_WARNING = (
    "\u26A0\uFE0F Muhim: Kiritilgan mablag' mukofot fondiga yo'naltiriladi. "
    "Belgilangan shartlar va foizlar sababli mukofot summasi kamayishi mumkin. "
    "Kiritilgan mablag' qaytarilmaydi."
)


@router.get("/help", response_model=RewardHelpResponse)
async def reward_help(session: AsyncSession = Depends(get_session)):
    cards_result = await session.execute(
        select(RewardCard).where(RewardCard.is_active.is_(True)).order_by(RewardCard.order)
    )
    cards = list(cards_result.scalars().all())

    warning_result = await session.execute(select(Setting).where(Setting.key == "reward_help_warning"))
    warning_row = warning_result.scalar_one_or_none()
    warning = warning_row.value if warning_row and warning_row.value else DEFAULT_WARNING

    return RewardHelpResponse(enabled=bool(cards), warning=warning, cards=cards)


@router.get("/campaign/active", response_model=Optional[RewardCampaignOut])
async def active_campaign(session: AsyncSession = Depends(get_session)):
    return await get_active_campaign(session)
