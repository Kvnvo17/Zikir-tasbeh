from __future__ import annotations

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.fsm.storage.memory import MemoryStorage

from backend.config import settings

bot = Bot(token=settings.BOT_TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
dp = Dispatcher(storage=MemoryStorage())


def register_all_handlers() -> None:
    from bot.handlers import admin, help, public_chat, reward_help, start, tutorial

    dp.include_router(start.router)
    dp.include_router(help.router)
    dp.include_router(public_chat.router)
    dp.include_router(reward_help.router)
    dp.include_router(tutorial.router)
    dp.include_router(admin.router)


def register_all_middlewares() -> None:
    from bot.middlewares.auth import UserSyncMiddleware

    dp.message.middleware(UserSyncMiddleware())
    dp.callback_query.middleware(UserSyncMiddleware())
