from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.api.users import current_user
from backend.database import get_session
from backend.models import Setting, User, Zikr
from backend.schemas import SelectZikr, UserOut, ZikrOut, ZikrSubmissionIn, ZikrSubmissionOut
from backend.services.zikr_service import list_active_zikrs, list_user_submissions, submit_zikr

router = APIRouter(prefix="/api/zikr", tags=["zikr"])

DEFAULT_RULES = (
    "Zikr yoki duo matni aniq va tushunarli bo'lishi kerak. "
    "Diniy manbaga zid bo'lmasligi shart. Haqoratli yoki nomaqbul so'zlar taqiqlanadi. "
    "Yuborilgan zikr admin tomonidan ko'rib chiqiladi va tasdiqlangandan so'ng umumiy ro'yxatga qo'shiladi."
)


@router.get("/rules")
async def get_rules(session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Setting).where(Setting.key == "zikr_submission_rules"))
    setting = result.scalar_one_or_none()
    return {"text": setting.value if setting and setting.value else DEFAULT_RULES}


@router.get("", response_model=List[ZikrOut])
async def list_zikrs(session: AsyncSession = Depends(get_session)) -> list:
    return await list_active_zikrs(session)


@router.post("/select", response_model=UserOut)
async def select_zikr(
    payload: SelectZikr,
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> User:
    result = await session.execute(select(Zikr).where(Zikr.id == payload.zikr_id, Zikr.is_active.is_(True)))
    zikr = result.scalar_one_or_none()
    if zikr is None:
        raise HTTPException(status_code=404, detail="Zikr not found")
    user.selected_zikr_id = zikr.id
    await session.commit()
    await session.refresh(user)
    return user


@router.post("/submit", response_model=ZikrSubmissionOut)
async def submit(
    payload: ZikrSubmissionIn,
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
):
    return await submit_zikr(session, user, payload.text)


@router.get("/submissions/mine", response_model=List[ZikrSubmissionOut])
async def my_submissions(
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> list:
    return await list_user_submissions(session, user)
