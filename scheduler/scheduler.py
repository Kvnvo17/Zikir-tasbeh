from __future__ import annotations

import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

from backend.config import settings
from scheduler.reminders import run_reminder_check
from scheduler.rewards import run_reward_campaign_check

logger = logging.getLogger("scheduler")

_scheduler: AsyncIOScheduler | None = None


def get_scheduler() -> AsyncIOScheduler:
    global _scheduler
    if _scheduler is None:
        _scheduler = AsyncIOScheduler(timezone=settings.TIMEZONE)
    return _scheduler


def start_scheduler() -> AsyncIOScheduler:
    sched = get_scheduler()

    sched.add_job(
        run_reminder_check,
        trigger=IntervalTrigger(minutes=1),
        id="reminder_check",
        replace_existing=True,
        max_instances=1,
        misfire_grace_time=30,
    )

    sched.add_job(
        run_reward_campaign_check,
        trigger=IntervalTrigger(hours=1),
        id="reward_campaign_check",
        replace_existing=True,
        max_instances=1,
        misfire_grace_time=300,
    )

    sched.start()
    logger.info("Scheduler started (timezone=%s)", settings.TIMEZONE)
    return sched
