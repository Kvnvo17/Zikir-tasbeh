from __future__ import annotations

import datetime as dt
from typing import List, Optional

from pydantic import BaseModel, Field


# ---------- Users / Profile ----------

class UserOut(BaseModel):
    id: int
    telegram_id: int
    first_name: str
    username: Optional[str] = None
    photo_url: Optional[str] = None
    daily_goal: int
    total_count: int
    tasbeh_theme: str
    selected_zikr_id: Optional[int] = None

    class Config:
        from_attributes = True


class SetDailyGoal(BaseModel):
    daily_goal: int = Field(gt=0, le=1_000_000)


class SetTheme(BaseModel):
    theme: str


# ---------- Zikr ----------

class ZikrOut(BaseModel):
    id: int
    text: str
    is_default: bool

    class Config:
        from_attributes = True


class SelectZikr(BaseModel):
    zikr_id: int


class ZikrSubmissionIn(BaseModel):
    text: str = Field(min_length=2, max_length=2000)


class ZikrSubmissionOut(BaseModel):
    id: int
    original_text: str
    final_text: Optional[str] = None
    status: str
    created_at: dt.datetime

    class Config:
        from_attributes = True


# ---------- Tasbeh ----------

class TasbehIncrement(BaseModel):
    zikr_id: Optional[int] = None
    mode: str = Field(pattern="^(33|99|inf)$")
    increment: int = Field(default=1, ge=1, le=1)
    client_ts: Optional[dt.datetime] = None


class TasbehIncrementOut(BaseModel):
    today_count: int
    week_count: int
    total_count: int
    daily_goal: int


# ---------- Rating ----------

class RatingRow(BaseModel):
    rank: int
    first_name: str
    username: Optional[str] = None
    photo_url: Optional[str] = None
    count: int
    is_me: bool = False


class RatingResponse(BaseModel):
    period: str
    top: List[RatingRow]
    me: Optional[RatingRow] = None


# ---------- Rewards ----------

class RewardCardOut(BaseModel):
    id: int
    card_number: str
    holder_name: str
    card_type: Optional[str] = None
    extra_info: Optional[str] = None

    class Config:
        from_attributes = True


class RewardHelpResponse(BaseModel):
    enabled: bool
    warning: Optional[str] = None
    cards: List[RewardCardOut] = []


class RewardCampaignOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    start_date: dt.date
    end_date: dt.date
    winners_count: int
    status: str
    prize_breakdown: Optional[str] = None

    class Config:
        from_attributes = True


# ---------- Profile extras ----------

class HistoryPoint(BaseModel):
    label: str
    count: int


class AchievementOut(BaseModel):
    code: str
    title: str
    icon: str
    threshold: int
    unlocked: bool


class ReferralInfo(BaseModel):
    link: str
    invited_count: int


class ReminderSettings(BaseModel):
    time: str
    enabled: bool


# ---------- Admin ----------

class AdminLogin(BaseModel):
    telegram_id: int
    init_data: str


class AdminZikrCreate(BaseModel):
    text: str


class AdminZikrUpdate(BaseModel):
    text: Optional[str] = None
    is_active: Optional[bool] = None


class AdminSubmissionReview(BaseModel):
    action: str = Field(pattern="^(approve|reject)$")
    final_text: Optional[str] = None


class AdminRewardCardIn(BaseModel):
    card_number: str
    holder_name: str
    card_type: Optional[str] = None
    extra_info: Optional[str] = None


class AdminCampaignIn(BaseModel):
    title: str
    description: Optional[str] = None
    start_date: dt.date
    end_date: dt.date
    winners_count: int = Field(ge=1, le=10)
    warning: Optional[str] = None
    prize_breakdown: Optional[str] = None


class AdminBroadcastIn(BaseModel):
    content_type: str = Field(pattern="^(text|photo|video|document)$")
    text: Optional[str] = None
    file_id: Optional[str] = None


class AdminAdminIn(BaseModel):
    telegram_id: int
    name: Optional[str] = None
