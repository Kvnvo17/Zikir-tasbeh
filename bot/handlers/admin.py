from __future__ import annotations

import asyncio

from aiogram import F, Router
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import CallbackQuery, Message
from sqlalchemy import select

from admin.permissions import make_admin_token
from backend.config import settings
from backend.database import session_scope
from backend.models import Admin, Broadcast, RewardCampaign, User
from backend.services.notification_service import safe_send_message
from backend.services.reward_service import approve_campaign
from bot.keyboards.admin_keyboard import broadcast_confirm_keyboard

router = Router(name="admin")


class BroadcastStates(StatesGroup):
    waiting_content = State()


async def _is_admin(telegram_id: int) -> bool:
    if telegram_id in settings.super_admin_ids:
        return True
    async with session_scope() as session:
        result = await session.execute(select(Admin).where(Admin.telegram_id == telegram_id))
        return result.scalar_one_or_none() is not None


@router.message(Command("admin"))
async def cmd_admin(message: Message) -> None:
    telegram_id = message.from_user.id

    async with session_scope() as session:
        result = await session.execute(select(Admin).where(Admin.telegram_id == telegram_id))
        admin = result.scalar_one_or_none()

        if admin is None and telegram_id in settings.super_admin_ids:
            admin = Admin(telegram_id=telegram_id, is_super_admin=True, name=message.from_user.full_name)
            session.add(admin)
            await session.commit()

    if admin is None:
        await message.answer("\u26D4\uFE0F Sizda admin huquqi yo'q.")
        return

    token = make_admin_token(telegram_id)
    panel_url = f"{settings.API_BASE_URL.rstrip('/')}/admin/?token={token}"
    await message.answer(
        "\U0001F6E0\uFE0F <b>Admin panel</b>\n\n"
        f"Kirish havolasi (12 soat amal qiladi):\n{panel_url}\n\n"
        "Reklama (broadcast) yuborish uchun /broadcast buyrug'ini ishlating."
    )


@router.message(Command("broadcast"))
async def cmd_broadcast(message: Message, state: FSMContext) -> None:
    if not await _is_admin(message.from_user.id):
        await message.answer("\u26D4\uFE0F Sizda admin huquqi yo'q.")
        return
    await state.set_state(BroadcastStates.waiting_content)
    await message.answer(
        "\U0001F4E2 Reklama uchun matn, rasm, video yoki hujjat yuboring."
    )


@router.message(BroadcastStates.waiting_content)
async def receive_broadcast_content(message: Message, state: FSMContext) -> None:
    async with session_scope() as session:
        count_result = await session.execute(select(User).where(User.is_blocked_bot.is_(False)))
        total_users = len(count_result.scalars().all())

        if message.photo:
            broadcast = Broadcast(
                content_type="photo", file_id=message.photo[-1].file_id, text=message.caption, total_users=total_users
            )
        elif message.video:
            broadcast = Broadcast(
                content_type="video", file_id=message.video.file_id, text=message.caption, total_users=total_users
            )
        elif message.document:
            broadcast = Broadcast(
                content_type="document",
                file_id=message.document.file_id,
                text=message.caption,
                total_users=total_users,
            )
        else:
            broadcast = Broadcast(content_type="text", text=message.text, total_users=total_users)

        session.add(broadcast)
        await session.commit()
        await session.refresh(broadcast)

    await state.clear()
    await message.answer(
        f"\U0001F4E2 <b>Reklama</b>\n\n\U0001F465 {total_users} foydalanuvchi",
        reply_markup=broadcast_confirm_keyboard(broadcast.id),
    )


@router.callback_query(F.data.startswith("broadcast_cancel:"))
async def cancel_broadcast(callback: CallbackQuery) -> None:
    broadcast_id = int(callback.data.split(":")[1])
    async with session_scope() as session:
        result = await session.execute(select(Broadcast).where(Broadcast.id == broadcast_id))
        broadcast = result.scalar_one_or_none()
        if broadcast:
            broadcast.status = "failed"
            await session.commit()
    await callback.message.edit_text("\u274C Reklama bekor qilindi.")
    await callback.answer()


@router.callback_query(F.data.startswith("broadcast_send:"))
async def send_broadcast(callback: CallbackQuery) -> None:
    broadcast_id = int(callback.data.split(":")[1])

    async with session_scope() as session:
        result = await session.execute(select(Broadcast).where(Broadcast.id == broadcast_id))
        broadcast = result.scalar_one_or_none()
        if broadcast is None:
            await callback.answer("Topilmadi", show_alert=True)
            return
        broadcast.status = "sending"
        await session.commit()

        users_result = await session.execute(select(User).where(User.is_blocked_bot.is_(False)))
        users = list(users_result.scalars().all())

    await callback.message.edit_text("\u23F3 Yuborilmoqda...")

    from bot import bot as bot_instance

    sent, failed, blocked = 0, 0, 0
    for user in users:
        ok = True
        try:
            if broadcast.content_type == "text":
                ok = await safe_send_message(bot_instance, user.telegram_id, broadcast.text or "")
            elif broadcast.content_type == "photo":
                await bot_instance.send_photo(user.telegram_id, broadcast.file_id, caption=broadcast.text)
            elif broadcast.content_type == "video":
                await bot_instance.send_video(user.telegram_id, broadcast.file_id, caption=broadcast.text)
            elif broadcast.content_type == "document":
                await bot_instance.send_document(user.telegram_id, broadcast.file_id, caption=broadcast.text)
        except Exception:  # noqa: BLE001
            ok = False

        if ok:
            sent += 1
        else:
            failed += 1
            async with session_scope() as session:
                res = await session.execute(select(User).where(User.id == user.id))
                u = res.scalar_one_or_none()
                if u:
                    u.is_blocked_bot = True
                    blocked += 1
                    await session.commit()

        await asyncio.sleep(0.05)  # basic flood-control pacing

    async with session_scope() as session:
        result = await session.execute(select(Broadcast).where(Broadcast.id == broadcast_id))
        broadcast = result.scalar_one_or_none()
        broadcast.status = "done"
        broadcast.sent_count = sent
        broadcast.failed_count = failed
        broadcast.blocked_count = blocked
        await session.commit()

    await callback.message.edit_text(
        f"\u2705 Yuborildi: {sent}\n\u274C Xatolik: {failed}\n\U0001F6AB Bloklaganlar: {blocked}"
    )
    await callback.answer()


@router.callback_query(F.data.startswith("approve_campaign:"))
async def approve_campaign_callback(callback: CallbackQuery) -> None:
    campaign_id = int(callback.data.split(":")[1])
    async with session_scope() as session:
        result = await session.execute(select(RewardCampaign).where(RewardCampaign.id == campaign_id))
        campaign = result.scalar_one_or_none()
        if campaign is None:
            await callback.answer("Topilmadi", show_alert=True)
            return
        await approve_campaign(session, campaign)

    await callback.message.edit_text(f"\u2705 '{campaign.title}' kampaniyasi tasdiqlandi va yakunlandi.")
    await callback.answer()
