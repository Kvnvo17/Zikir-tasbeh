from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from backend.api.users import current_user
from backend.database import get_session
from backend.models import User
from backend.schemas import RatingResponse
from backend.services.rating_service import get_rating
from backend.services.zikr_service import zikr_submitters_rating

router = APIRouter(prefix="/api/rating", tags=["rating"])


@router.get("", response_model=RatingResponse)
async def rating(
    period: str = Query(default="daily", pattern="^(daily|weekly|alltime)$"),
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> RatingResponse:
    return await get_rating(session, period, user)


@router.get("/zikr-submitters")
async def zikr_submitters(session: AsyncSession = Depends(get_session)):
    rows = await zikr_submitters_rating(session)
    return [
        {"first_name": r.first_name, "username": r.username, "approved_count": r.approved_count} for r in rows
    ]
