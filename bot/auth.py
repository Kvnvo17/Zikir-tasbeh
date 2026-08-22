from __future__ import annotations

from typing import Any, Awaitable, Callable, Dict

from aiogram import BaseMiddleware
from aiogram.types import TelegramObject, User as TgUser

from backend.database import session_scope
from backend.services.user_service import get_or_create_user


class UserSyncMiddleware(BaseMiddleware):
    """Makes sure every incoming update has a corresponding `User` row and
    injects it into handler data as `db_user`."""

    async def __call__(
        self,
        handler: Callable[[TelegramObject, Dict[str, Any]], Awaitable[Any]],
        event: TelegramObject,
        data: Dict[str, Any],
    ) -> Any:
        tg_user: TgUser | None = data.get("event_from_user")

        if tg_user is not None and not tg_user.is_bot:
            start_param = None
            message = getattr(event, "message", None) or event
            text = getattr(message, "text", None) if message else None
            if text and text.startswith("/start "):
                start_param = text.split(" ", 1)[1].strip()

            async with session_scope() as session:
                db_user = await get_or_create_user(
                    session,
                    {
                        "id": tg_user.id,
                        "first_name": tg_user.first_name,
                        "last_name": tg_user.last_name,
                        "username": tg_user.username,
                        "language_code": tg_user.language_code,
                    },
                    referred_by_code=start_param,
                )
                data["db_user_id"] = db_user.id

        return await handler(event, data)
