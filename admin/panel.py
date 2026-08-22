from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter
from fastapi.responses import FileResponse

router = APIRouter()

ADMIN_DIR = Path(__file__).parent / "static"


@router.get("/", include_in_schema=False)
async def admin_index():
    return FileResponse(ADMIN_DIR / "index.html")
