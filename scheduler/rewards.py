from __future__ import annotations

import logging

from sqlalchemy import select

from backend.config import settings
from backend.database import session_scope
from backend.models import Admin, RewardWinner, User
from backend.services.reward_service import close_expired_campaigns_and_compute_winners
from bot.keyboards.admin_keyboard import campaign_approval_keyboard

logger = logging.getLogger("scheduler.rewards")


async def run_reward_campaign_check() -> None:
    """Runs periodically (e.g. every hour). Closes campaigns whose end_date has
    passed, computes winners, and notifies admins for approval."""
    async with session_scope() as session:
        expired = await close_expired_campaigns_and_compute_winners(session)
        if not expired:
            return

        admins_result = await session.execute(select(Admin))
        admins = list(admins_result.scalars().all())

        for campaign in expired:
            winners_result = await session.execute(
                select(RewardWinner, User)
                .join(User, User.id == RewardWinner.user_id)
                .where(RewardWinner.campaign_id == campaign.id)
                .order_by(RewardWinner.place)
            )
            winners = winners_result.all()

            lines = [
                "\U0001F514 Mukofot davri tugadi.\n",
                f"\U0001F3C6 Kampaniya: {campaign.title}\n",
            ]
            for winner, user in winners:
                lines.append(f"\U0001F3C6 G'olib ({winner.place}-o'rin): {user.first_name}")
                lines.append(f"\U0001F4FF Zikr: {winner.count}")
                lines.append("")
            text = "\n".join(lines) if winners else f"\U0001F514 '{campaign.title}' tugadi, lekin g'olib topilmadi."

            from bot import bot as bot_instance

            for admin in admins:
                try:
                    await bot_instance.send_message(
                        admin.telegram_id, text, reply_markup=campaign_approval_keyboard(campaign.id)
                    )
                except Exception:  # noqa: BLE001
                    logger.exception("Failed to notify admin %s", admin.telegram_id)

            for admin_id in settings.super_admin_ids:
                if admin_id not in [a.telegram_id for a in admins]:
                    try:
                        await bot_instance.send_message(
                            admin_id, text, reply_markup=campaign_approval_keyboard(campaign.id)
                        )
                    except Exception:  # noqa: BLE001
                        pass
