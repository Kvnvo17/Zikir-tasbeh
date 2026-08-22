from __future__ import annotations

import datetime as dt
import logging

from sqlalchemy import select

from backend.config import settings
from backend.database import session_scope
from backend.models import DailyStat, Reminder, User
from backend.services.notification_service import safe_send_message

logger = logging.getLogger("scheduler.reminders")

REMINDER_TEXT = (
    "\U0001F514 Bugungi zikringiz hali {min} taga yetmadi.\n"
    "Zikr qilishni unutmang."
)


async def run_reminder_check() -> None:
    """Runs every minute. For each user whose reminder time == current HH:MM
    (Asia/Tashkent) and who has NOT reached the daily minimum, send a reminder.
    Users who already hit the minimum get nothing, per spec."""
    now = dt.datetime.now(dt.timezone.utc).astimezone(_tz())
    hhmm = now.strftime("%H:%M")
    today = now.date()

    async with session_scope() as session:
        result = await session.execute(
            select(Reminder, User).join(User, User.id == Reminder.user_id).where(
                Reminder.enabled.is_(True),
                Reminder.time == hhmm,
                User.is_blocked_bot.is_(False),
            )
        )
        rows = result.all()

        for reminder, user in rows:
            if reminder.last_sent_date == today:
                continue

            daily_result = await session.execute(
                select(DailyStat).where(DailyStat.user_id == user.id, DailyStat.date == today)
            )
            daily = daily_result.scalar_one_or_none()
            count = daily.count if daily else 0

            if count >= settings.DAILY_MIN_ZIKR:
                reminder.last_sent_date = today
                continue

            from bot import bot as bot_instance

            ok = await safe_send_message(
                bot_instance, user.telegram_id, REMINDER_TEXT.format(min=settings.DAILY_MIN_ZIKR)
            )
            if not ok:
                user.is_blocked_bot = True
            reminder.last_sent_date = today

        await session.commit()


def _tz():
    try:
        from zoneinfo import ZoneInfo

        return ZoneInfo(settings.TIMEZONE)
    except Exception:  # noqa: BLE001
        return dt.timezone.utc
