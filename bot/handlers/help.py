from __future__ import annotations

from aiogram import F, Router
from aiogram.types import CallbackQuery
from sqlalchemy import select

from backend.database import session_scope
from backend.models import HelpUser
from bot.keyboards.start_keyboard import back_to_menu_keyboard

router = Router(name="help")


@router.callback_query(F.data == "help_menu")
async def show_help(callback: CallbackQuery) -> None:
    async with session_scope() as session:
        result = await session.execute(
            select(HelpUser).where(HelpUser.is_active.is_(True)).order_by(HelpUser.order)
        )
        helpers = list(result.scalars().all())

    if not helpers:
        text = "\U0001F198 Hozircha yordamchi userlar biriktirilmagan."
    else:
        lines = ["\U0001F198 <b>Yordam uchun murojaat qiling:</b>\n"]
        for h in helpers:
            name = h.display_name or h.telegram_username
            lines.append(f"\u2022 {name} \u2014 @{h.telegram_username}")
        text = "\n".join(lines)

    await callback.message.edit_text(text, reply_markup=back_to_menu_keyboard())
    await callback.answer()
