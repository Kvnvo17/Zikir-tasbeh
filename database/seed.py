from __future__ import annotations

import asyncio
import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import SessionLocal, init_db
from backend.models import Achievement
from backend.services.zikr_service import ensure_default_zikrs

logger = logging.getLogger("seed")

DEFAULT_ACHIEVEMENTS = [
    ("seed_100", "Boshlang'ich", "\U0001F331", 100),
    ("star_1000", "Faol", "\u2B50", 1_000),
    ("fire_10000", "Ishtiyoqli", "\U0001F525", 10_000),
    ("diamond_100000", "Ustoz", "\U0001F48E", 100_000),
    ("crown_1000000", "Afzal", "\U0001F451", 1_000_000),
]


async def seed_achievements(session: AsyncSession) -> None:
    result = await session.execute(select(Achievement))
    existing_codes = {a.code for a in result.scalars().all()}
    for code, title, icon, threshold in DEFAULT_ACHIEVEMENTS:
        if code not in existing_codes:
            session.add(Achievement(code=code, title=title, icon=icon, threshold=threshold))
    await session.commit()


async def run_seed() -> None:
    await init_db()
    async with SessionLocal() as session:
        await seed_achievements(session)
        await ensure_default_zikrs(session)
    logger.info("Seed complete")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(run_seed())
