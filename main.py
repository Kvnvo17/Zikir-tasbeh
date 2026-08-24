from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.api import (
    admin as admin_api,
    profile,
    rating,
    referrals,
    reminders,
    rewards,
    tasbeh,
    users,
    zikr,
)
from backend.config import settings
from backend.database import init_db, session_scope
from backend.services.zikr_service import ensure_default_zikrs
from database.seed import seed_achievements

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("main")

_bot_task: asyncio.Task | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()

    async with session_scope() as session:
        await ensure_default_zikrs(session)
        await seed_achievements(session)

    from bot import bot, dp, register_all_handlers, register_all_middlewares
    from scheduler.scheduler import start_scheduler

    register_all_middlewares()
    register_all_handlers()

    global _bot_task
    if settings.BOT_MODE == "webhook" and settings.WEBHOOK_BASE_URL:
        webhook_url = f"{settings.WEBHOOK_BASE_URL.rstrip('/')}/webhook/{settings.WEBHOOK_SECRET}"
        await bot.set_webhook(webhook_url, drop_pending_updates=True)
        logger.info("Webhook set: %s", webhook_url)
    else:
        await bot.delete_webhook(drop_pending_updates=True)
        _bot_task = asyncio.create_task(dp.start_polling(bot))
        logger.info("Bot polling started")

    start_scheduler()

    yield

    if _bot_task:
        _bot_task.cancel()
    await bot.session.close()


app = FastAPI(title="Zikr & Tasbeh", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(tasbeh.router)
app.include_router(zikr.router)
app.include_router(rating.router)
app.include_router(profile.router)
app.include_router(referrals.router)
app.include_router(reminders.router)
app.include_router(rewards.router)
app.include_router(admin_api.router)

from admin.panel import router as admin_panel_router

app.include_router(admin_panel_router, prefix="/admin")

from fastapi.responses import RedirectResponse

@app.api_route("/", methods=["GET", "HEAD"])
async def home():
    return RedirectResponse("/web/")

app.mount("/web", StaticFiles(directory="web", html=True), name="web")
app.mount("/tutorial", StaticFiles(directory="tutorial", html=True), name="tutorial")
app.mount("/admin-static", StaticFiles(directory="admin/static"), name="admin-static")


@app.get("/health")
async def health():
    return {"ok": True}


@app.post("/webhook/{secret}")
async def telegram_webhook(secret: str, update: dict):
    if secret != settings.WEBHOOK_SECRET:
        return {"ok": False}
    from aiogram.types import Update

    from bot import bot, dp

    await dp.feed_update(bot, Update(**update))
    return {"ok": True}
