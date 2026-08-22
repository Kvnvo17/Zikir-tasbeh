from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from admin.permissions import require_admin, require_super_admin
from admin.services import dashboard_stats
from backend.database import get_session
from backend.models import (
    Admin,
    HelpUser,
    PublicChat,
    RewardCampaign,
    RewardCard,
    RewardWinner,
    Setting,
    User,
    Zikr,
    ZikrSubmission,
)
from backend.schemas import (
    AdminAdminIn,
    AdminBroadcastIn,
    AdminCampaignIn,
    AdminRewardCardIn,
    AdminSubmissionReview,
    AdminZikrCreate,
    AdminZikrUpdate,
)
from backend.services.reward_service import approve_campaign

router = APIRouter(prefix="/api/admin", tags=["admin"])


# ---------------- Dashboard ----------------

@router.get("/dashboard")
async def get_dashboard(session: AsyncSession = Depends(get_session), admin: Admin = Depends(require_admin)):
    return await dashboard_stats(session)


# ---------------- Users ----------------

@router.get("/users")
async def list_users(
    limit: int = 50,
    offset: int = 0,
    session: AsyncSession = Depends(get_session),
    admin: Admin = Depends(require_admin),
):
    result = await session.execute(select(User).order_by(User.created_at.desc()).limit(limit).offset(offset))
    users = result.scalars().all()
    return [
        {
            "id": u.id,
            "telegram_id": u.telegram_id,
            "first_name": u.first_name,
            "username": u.username,
            "total_count": u.total_count,
            "is_banned": u.is_banned,
            "is_blocked_bot": u.is_blocked_bot,
        }
        for u in users
    ]


@router.post("/users/{user_id}/ban")
async def ban_user(
    user_id: int, banned: bool = True, session: AsyncSession = Depends(get_session), admin: Admin = Depends(require_admin)
):
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_banned = banned
    await session.commit()
    return {"ok": True}


# ---------------- Admins ----------------

@router.get("/admins")
async def list_admins(session: AsyncSession = Depends(get_session), admin: Admin = Depends(require_admin)):
    result = await session.execute(select(Admin))
    return [
        {"id": a.id, "telegram_id": a.telegram_id, "name": a.name, "is_super_admin": a.is_super_admin}
        for a in result.scalars().all()
    ]


@router.post("/admins")
async def add_admin(
    payload: AdminAdminIn,
    session: AsyncSession = Depends(get_session),
    admin: Admin = Depends(require_super_admin),
):
    existing = await session.execute(select(Admin).where(Admin.telegram_id == payload.telegram_id))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already an admin")
    new_admin = Admin(telegram_id=payload.telegram_id, name=payload.name, added_by=admin.telegram_id)
    session.add(new_admin)
    await session.commit()
    return {"ok": True}


@router.delete("/admins/{admin_id}")
async def remove_admin(
    admin_id: int,
    session: AsyncSession = Depends(get_session),
    admin: Admin = Depends(require_super_admin),
):
    result = await session.execute(select(Admin).where(Admin.id == admin_id))
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="Not found")
    if target.is_super_admin:
        raise HTTPException(status_code=400, detail="Cannot remove a super admin")
    await session.delete(target)
    await session.commit()
    return {"ok": True}


# ---------------- Zikrlar ----------------

@router.get("/zikrs")
async def admin_list_zikrs(session: AsyncSession = Depends(get_session), admin: Admin = Depends(require_admin)):
    result = await session.execute(select(Zikr).order_by(Zikr.order, Zikr.id))
    return [
        {"id": z.id, "text": z.text, "is_default": z.is_default, "is_active": z.is_active}
        for z in result.scalars().all()
    ]


@router.post("/zikrs")
async def admin_create_zikr(
    payload: AdminZikrCreate, session: AsyncSession = Depends(get_session), admin: Admin = Depends(require_admin)
):
    zikr = Zikr(text=payload.text, is_default=False, is_active=True)
    session.add(zikr)
    await session.commit()
    return {"ok": True, "id": zikr.id}


@router.patch("/zikrs/{zikr_id}")
async def admin_update_zikr(
    zikr_id: int,
    payload: AdminZikrUpdate,
    session: AsyncSession = Depends(get_session),
    admin: Admin = Depends(require_admin),
):
    result = await session.execute(select(Zikr).where(Zikr.id == zikr_id))
    zikr = result.scalar_one_or_none()
    if not zikr:
        raise HTTPException(status_code=404, detail="Not found")
    if payload.text is not None:
        zikr.text = payload.text
    if payload.is_active is not None:
        zikr.is_active = payload.is_active
    await session.commit()
    return {"ok": True}


@router.delete("/zikrs/{zikr_id}")
async def admin_delete_zikr(
    zikr_id: int, session: AsyncSession = Depends(get_session), admin: Admin = Depends(require_admin)
):
    result = await session.execute(select(Zikr).where(Zikr.id == zikr_id))
    zikr = result.scalar_one_or_none()
    if not zikr:
        raise HTTPException(status_code=404, detail="Not found")
    if zikr.is_default:
        raise HTTPException(status_code=400, detail="Cannot delete a default zikr")
    await session.delete(zikr)
    await session.commit()
    return {"ok": True}


# ---------------- Zikr submissions ----------------

@router.get("/zikr-submissions")
async def admin_list_submissions(
    status: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
    admin: Admin = Depends(require_admin),
):
    stmt = select(ZikrSubmission).order_by(ZikrSubmission.created_at.desc())
    if status:
        stmt = stmt.where(ZikrSubmission.status == status)
    result = await session.execute(stmt)
    return [
        {
            "id": s.id,
            "user_id": s.user_id,
            "original_text": s.original_text,
            "final_text": s.final_text,
            "status": s.status,
        }
        for s in result.scalars().all()
    ]


@router.post("/zikr-submissions/{submission_id}/review")
async def review_submission(
    submission_id: int,
    payload: AdminSubmissionReview,
    session: AsyncSession = Depends(get_session),
    admin: Admin = Depends(require_admin),
):
    result = await session.execute(select(ZikrSubmission).where(ZikrSubmission.id == submission_id))
    submission = result.scalar_one_or_none()
    if not submission:
        raise HTTPException(status_code=404, detail="Not found")

    if payload.action == "approve":
        final_text = payload.final_text or submission.original_text
        submission.final_text = final_text
        submission.status = "approved"
        max_order = (await session.execute(select(Zikr.order).order_by(Zikr.order.desc()).limit(1))).scalar()
        zikr = Zikr(
            text=final_text,
            is_default=False,
            is_active=True,
            created_from_submission_id=submission.id,
            order=(max_order or 0) + 1,
        )
        session.add(zikr)
    else:
        submission.status = "rejected"
        if payload.final_text:
            submission.final_text = payload.final_text

    submission.reviewed_by = admin.telegram_id
    await session.commit()
    return {"ok": True}


# ---------------- Public chat ----------------

@router.get("/public-chat")
async def get_public_chat(session: AsyncSession = Depends(get_session), admin: Admin = Depends(require_admin)):
    result = await session.execute(select(PublicChat))
    chat = result.scalars().first()
    if not chat:
        return None
    return {"id": chat.id, "title": chat.title, "link": chat.link, "is_active": chat.is_active}


@router.post("/public-chat")
async def set_public_chat(
    title: str,
    link: str,
    session: AsyncSession = Depends(get_session),
    admin: Admin = Depends(require_admin),
):
    result = await session.execute(select(PublicChat))
    chat = result.scalars().first()
    if chat is None:
        chat = PublicChat(title=title, link=link, is_active=True)
        session.add(chat)
    else:
        chat.title = title
        chat.link = link
        chat.is_active = True
    await session.commit()
    return {"ok": True}


@router.delete("/public-chat")
async def delete_public_chat(session: AsyncSession = Depends(get_session), admin: Admin = Depends(require_admin)):
    result = await session.execute(select(PublicChat))
    chat = result.scalars().first()
    if chat:
        await session.delete(chat)
        await session.commit()
    return {"ok": True}


# ---------------- Help users ----------------

@router.get("/help-users")
async def list_help_users(session: AsyncSession = Depends(get_session), admin: Admin = Depends(require_admin)):
    result = await session.execute(select(HelpUser).order_by(HelpUser.order))
    return [
        {"id": h.id, "telegram_username": h.telegram_username, "display_name": h.display_name, "is_active": h.is_active}
        for h in result.scalars().all()
    ]


@router.post("/help-users")
async def add_help_user(
    telegram_username: str,
    display_name: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
    admin: Admin = Depends(require_admin),
):
    h = HelpUser(telegram_username=telegram_username.lstrip("@"), display_name=display_name, is_active=True)
    session.add(h)
    await session.commit()
    return {"ok": True, "id": h.id}


@router.delete("/help-users/{help_id}")
async def delete_help_user(
    help_id: int, session: AsyncSession = Depends(get_session), admin: Admin = Depends(require_admin)
):
    result = await session.execute(select(HelpUser).where(HelpUser.id == help_id))
    h = result.scalar_one_or_none()
    if h:
        await session.delete(h)
        await session.commit()
    return {"ok": True}


# ---------------- Reward cards ----------------

@router.get("/reward-cards")
async def list_reward_cards(session: AsyncSession = Depends(get_session), admin: Admin = Depends(require_admin)):
    result = await session.execute(select(RewardCard).order_by(RewardCard.order))
    return [
        {
            "id": c.id,
            "card_number": c.card_number,
            "holder_name": c.holder_name,
            "card_type": c.card_type,
            "extra_info": c.extra_info,
            "is_active": c.is_active,
        }
        for c in result.scalars().all()
    ]


@router.post("/reward-cards")
async def add_reward_card(
    payload: AdminRewardCardIn,
    session: AsyncSession = Depends(get_session),
    admin: Admin = Depends(require_admin),
):
    count = (await session.execute(select(RewardCard))).scalars().all()
    if len(count) >= 10:
        raise HTTPException(status_code=400, detail="Maksimal 10 ta karta")
    card = RewardCard(
        card_number=payload.card_number,
        holder_name=payload.holder_name,
        card_type=payload.card_type,
        extra_info=payload.extra_info,
        order=len(count),
        is_active=True,
    )
    session.add(card)
    await session.commit()
    return {"ok": True, "id": card.id}


@router.patch("/reward-cards/{card_id}")
async def update_reward_card(
    card_id: int,
    payload: AdminRewardCardIn,
    session: AsyncSession = Depends(get_session),
    admin: Admin = Depends(require_admin),
):
    result = await session.execute(select(RewardCard).where(RewardCard.id == card_id))
    card = result.scalar_one_or_none()
    if not card:
        raise HTTPException(status_code=404, detail="Not found")
    card.card_number = payload.card_number
    card.holder_name = payload.holder_name
    card.card_type = payload.card_type
    card.extra_info = payload.extra_info
    await session.commit()
    return {"ok": True}


@router.delete("/reward-cards/{card_id}")
async def delete_reward_card(
    card_id: int, session: AsyncSession = Depends(get_session), admin: Admin = Depends(require_admin)
):
    result = await session.execute(select(RewardCard).where(RewardCard.id == card_id))
    card = result.scalar_one_or_none()
    if card:
        await session.delete(card)
        await session.commit()
    return {"ok": True}


# ---------------- Reward campaigns ----------------

@router.get("/campaigns")
async def list_campaigns(session: AsyncSession = Depends(get_session), admin: Admin = Depends(require_admin)):
    result = await session.execute(select(RewardCampaign).order_by(RewardCampaign.created_at.desc()))
    return [
        {
            "id": c.id,
            "title": c.title,
            "start_date": c.start_date.isoformat(),
            "end_date": c.end_date.isoformat(),
            "winners_count": c.winners_count,
            "status": c.status,
        }
        for c in result.scalars().all()
    ]


@router.post("/campaigns")
async def create_campaign(
    payload: AdminCampaignIn,
    session: AsyncSession = Depends(get_session),
    admin: Admin = Depends(require_admin),
):
    campaign = RewardCampaign(
        title=payload.title,
        description=payload.description,
        start_date=payload.start_date,
        end_date=payload.end_date,
        winners_count=payload.winners_count,
        warning=payload.warning,
        prize_breakdown=payload.prize_breakdown,
        status="active",
        created_by=admin.telegram_id,
    )
    session.add(campaign)
    await session.commit()
    return {"ok": True, "id": campaign.id}


@router.get("/campaigns/{campaign_id}/winners")
async def campaign_winners(
    campaign_id: int, session: AsyncSession = Depends(get_session), admin: Admin = Depends(require_admin)
):
    result = await session.execute(
        select(RewardWinner, User).join(User, User.id == RewardWinner.user_id).where(
            RewardWinner.campaign_id == campaign_id
        ).order_by(RewardWinner.place)
    )
    return [
        {"place": w.place, "user": u.first_name, "count": w.count, "approved": w.approved}
        for w, u in result.all()
    ]


@router.post("/campaigns/{campaign_id}/approve")
async def approve_campaign_endpoint(
    campaign_id: int, session: AsyncSession = Depends(get_session), admin: Admin = Depends(require_admin)
):
    result = await session.execute(select(RewardCampaign).where(RewardCampaign.id == campaign_id))
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=404, detail="Not found")
    await approve_campaign(session, campaign)
    return {"ok": True}


# ---------------- Settings ----------------

@router.get("/settings/{key}")
async def get_setting(key: str, session: AsyncSession = Depends(get_session), admin: Admin = Depends(require_admin)):
    result = await session.execute(select(Setting).where(Setting.key == key))
    setting = result.scalar_one_or_none()
    return {"key": key, "value": setting.value if setting else None}


@router.post("/settings/{key}")
async def set_setting(
    key: str, value: str, session: AsyncSession = Depends(get_session), admin: Admin = Depends(require_admin)
):
    result = await session.execute(select(Setting).where(Setting.key == key))
    setting = result.scalar_one_or_none()
    if setting is None:
        setting = Setting(key=key, value=value)
        session.add(setting)
    else:
        setting.value = value
    await session.commit()
    return {"ok": True}
