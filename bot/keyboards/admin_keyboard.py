from __future__ import annotations

from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup


def campaign_approval_keyboard(campaign_id: int) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="\u2705 Tasdiqlash", callback_data=f"approve_campaign:{campaign_id}"
                )
            ]
        ]
    )


def broadcast_confirm_keyboard(broadcast_id: int) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text="\u2705 Yuborish", callback_data=f"broadcast_send:{broadcast_id}"),
                InlineKeyboardButton(text="\u274C Bekor qilish", callback_data=f"broadcast_cancel:{broadcast_id}"),
            ]
        ]
    )
