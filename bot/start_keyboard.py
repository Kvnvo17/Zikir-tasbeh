from __future__ import annotations

from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo

from backend.config import settings


def main_menu_keyboard(public_chat_link: str | None) -> InlineKeyboardMarkup:
    if public_chat_link:
        public_chat_button = InlineKeyboardButton(text="\U0001F4AC Ommaviy chat", url=public_chat_link)
    else:
        public_chat_button = InlineKeyboardButton(text="\U0001F4AC Ommaviy chat", callback_data="public_chat_missing")

    rows = [
        [InlineKeyboardButton(text="\U0001F4FF Tasbehni ochish", web_app=WebAppInfo(url=settings.WEBAPP_URL))],
        [public_chat_button],
        [InlineKeyboardButton(text="\U0001F381 Mukofot uchun yordam", callback_data="reward_help")],
        [InlineKeyboardButton(text="\U0001F198 Yordam", callback_data="help_menu")],
        [InlineKeyboardButton(text="\U0001F4DA O'rganish", web_app=WebAppInfo(url=settings.TUTORIAL_URL))],
    ]
    return InlineKeyboardMarkup(inline_keyboard=rows)


def back_to_menu_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[[InlineKeyboardButton(text="\u2B05\uFE0F Orqaga", callback_data="back_to_menu")]]
    )
