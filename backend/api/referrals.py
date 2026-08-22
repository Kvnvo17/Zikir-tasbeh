from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.api.users import current_user
from backend.database import get_session
from backend.models import User
from backend.schemas import ReferralInfo
from backend.services.referral_service import get_referral_info

router = APIRouter(prefix="/api/referrals", tags=["referrals"])


@router.get("/me", response_model=ReferralInfo)
async def my_referrals(
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> dict:
    return await get_referral_info(session, user)
