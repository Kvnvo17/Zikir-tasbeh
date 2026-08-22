from __future__ import annotations

from aiogram import F, Router
from aiogram.types import CallbackQuery

router = Router(name="public_chat")


@router.callback_query(F.data == "public_chat_missing")
async def public_chat_missing(callback: CallbackQuery) -> None:
    await callback.answer(
        "\u26A0\uFE0F Ommaviy chat hali sozlanmagan.", show_alert=True
    )
