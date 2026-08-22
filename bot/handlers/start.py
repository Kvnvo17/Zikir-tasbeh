from __future__ import annotations

from aiogram import F, Router
from aiogram.filters import CommandStart
from aiogram.types import CallbackQuery, Message
from sqlalchemy import select

from backend.database import session_scope
from backend.models import PublicChat
from bot.keyboards.start_keyboard import main_menu_keyboard

router = Router(name="start")

WELCOME_TEXT = (
    "\U0001F4FF <b>Zikr &amp; Tasbeh</b>\n\n"
    "Zikrlaringizni qulay tarzda sanang, kunlik maqsadingizni kuzating, "
    "reytingda ishtirok eting va foydali zikrlarni bir joyda saqlang."
)


async def _get_public_chat_link() -> str | None:
    async with session_scope() as session:
        result = await session.execute(select(PublicChat).where(PublicChat.is_active.is_(True)))
        chat = result.scalars().first()
        return chat.link if chat else None


@router.message(CommandStart())
async def cmd_start(message: Message) -> None:
    link = await _get_public_chat_link()
    await message.answer(WELCOME_TEXT, reply_markup=main_menu_keyboard(link))


@router.callback_query(F.data == "back_to_menu")
async def back_to_menu(callback: CallbackQuery) -> None:
    link = await _get_public_chat_link()
    await callback.message.edit_text(WELCOME_TEXT, reply_markup=main_menu_keyboard(link))
    await callback.answer()
