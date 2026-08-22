from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_session
from backend.models import User
from backend.schemas import SetDailyGoal, SetTheme, UserOut
from backend.security.telegram_auth import get_verified_telegram_user
from backend.services.user_service import get_or_create_user

router = APIRouter(prefix="/api/users", tags=["users"])


async def current_user(
    tg_user: dict = Depends(get_verified_telegram_user),
    session: AsyncSession = Depends(get_session),
) -> User:
    return await get_or_create_user(session, tg_user)


@router.get("/me", response_model=UserOut)
async def get_me(user: User = Depends(current_user)) -> User:
    return user


@router.post("/me/daily-goal", response_model=UserOut)
async def set_daily_goal(
    payload: SetDailyGoal,
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> User:
    user.daily_goal = payload.daily_goal
    await session.commit()
    await session.refresh(user)
    return user


@router.post("/me/theme", response_model=UserOut)
async def set_theme(
    payload: SetTheme,
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> User:
    user.tasbeh_theme = payload.theme
    await session.commit()
    await session.refresh(user)
    return user
