from __future__ import annotations

import re

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.api.users import current_user
from backend.database import get_session
from backend.models import Reminder, User
from backend.schemas import ReminderSettings

router = APIRouter(prefix="/api/reminders", tags=["reminders"])

TIME_RE = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")


@router.get("/me", response_model=ReminderSettings)
async def get_reminder(
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(Reminder).where(Reminder.user_id == user.id))
    r = result.scalar_one_or_none()
    if r is None:
        return ReminderSettings(time="20:00", enabled=False)
    return ReminderSettings(time=r.time, enabled=r.enabled)


@router.post("/me", response_model=ReminderSettings)
async def set_reminder(
    payload: ReminderSettings,
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
):
    if not TIME_RE.match(payload.time):
        raise HTTPException(status_code=422, detail="time must be HH:MM")

    result = await session.execute(select(Reminder).where(Reminder.user_id == user.id))
    r = result.scalar_one_or_none()
    if r is None:
        r = Reminder(user_id=user.id, time=payload.time, enabled=payload.enabled)
        session.add(r)
    else:
        r.time = payload.time
        r.enabled = payload.enabled

    await session.commit()
    return ReminderSettings(time=r.time, enabled=r.enabled)
