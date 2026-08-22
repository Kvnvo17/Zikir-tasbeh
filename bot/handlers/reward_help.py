from __future__ import annotations

from aiogram import F, Router
from aiogram.types import CallbackQuery
from sqlalchemy import select

from backend.database import session_scope
from backend.models import RewardCard, Setting
from bot.keyboards.start_keyboard import back_to_menu_keyboard

router = Router(name="reward_help")

DEFAULT_WARNING = (
    "\u26A0\uFE0F Muhim:\n"
    "Kiritilgan mablag' mukofot fondiga yo'naltiriladi.\n"
    "Belgilangan shartlar va foizlar sababli mukofot summasi kamayishi mumkin.\n"
    "Kiritilgan mablag' qaytarilmaydi."
)


@router.callback_query(F.data == "reward_help")
async def show_reward_help(callback: CallbackQuery) -> None:
    async with session_scope() as session:
        cards_result = await session.execute(
            select(RewardCard).where(RewardCard.is_active.is_(True)).order_by(RewardCard.order)
        )
        cards = list(cards_result.scalars().all())

        warning_setting = await session.execute(select(Setting).where(Setting.key == "reward_help_warning"))
        warning_row = warning_setting.scalar_one_or_none()
        warning = warning_row.value if warning_row and warning_row.value else DEFAULT_WARNING

    if not cards:
        text = "\U0001F381 <b>Mukofot uchun yordam</b>\n\n\u26A0\uFE0F Mukofot tizimi hali ishga tushmagan."
    else:
        lines = ["\U0001F381 <b>Mukofot uchun yordam</b>\n"]
        for c in cards:
            lines.append(f"\U0001F4B3 {c.card_number}\n\U0001F464 {c.holder_name}")
            if c.card_type:
                lines.append(f"\U0001F3E6 {c.card_type}")
            lines.append("")
        lines.append(warning)
        text = "\n".join(lines)

    await callback.message.edit_text(text, reply_markup=back_to_menu_keyboard())
    await callback.answer()
