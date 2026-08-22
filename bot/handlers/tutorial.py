from __future__ import annotations

from aiogram import Router
from aiogram.filters import Command
from aiogram.types import Message

router = Router(name="tutorial")


@router.message(Command("tutorial"))
async def cmd_tutorial(message: Message) -> None:
    await message.answer(
        "\U0001F4DA O'rganish bo'limini asosiy menyudagi tugma orqali oching."
    )
