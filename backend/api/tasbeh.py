from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.api.users import current_user
from backend.database import get_session
from backend.models import User
from backend.schemas import TasbehIncrement, TasbehIncrementOut
from backend.services.tasbeh_service import apply_increment

router = APIRouter(prefix="/api/tasbeh", tags=["tasbeh"])


@router.post("/increment", response_model=TasbehIncrementOut)
async def increment(
    payload: TasbehIncrement,
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> dict:
    return await apply_increment(session, user, payload.zikr_id, payload.mode)
