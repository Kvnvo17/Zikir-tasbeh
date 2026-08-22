from __future__ import annotations

import logging

from aiogram.exceptions import TelegramForbiddenError, TelegramRetryAfter, TelegramBadRequest

logger = logging.getLogger("notifications")


async def safe_send_message(bot, chat_id: int, text: str, **kwargs) -> bool:
    """Send a message, swallowing the common 'user blocked bot' / rate-limit cases.

    Returns True on success, False otherwise (caller can update block-state).
    """
    try:
        await bot.send_message(chat_id, text, **kwargs)
        return True
    except TelegramRetryAfter as exc:
        import asyncio

        await asyncio.sleep(exc.retry_after)
        try:
            await bot.send_message(chat_id, text, **kwargs)
            return True
        except Exception:  # noqa: BLE001
            return False
    except TelegramForbiddenError:
        logger.info("User %s blocked the bot", chat_id)
        return False
    except TelegramBadRequest as exc:
        logger.warning("Bad request sending to %s: %s", chat_id, exc)
        return False
    except Exception as exc:  # noqa: BLE001
        logger.exception("Unexpected error sending to %s: %s", chat_id, exc)
        return False
