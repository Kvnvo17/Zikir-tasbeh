"""Server-side anti-cheat for tasbeh increments and ratings.

Design goal (per spec): a normal user tapping quickly must NEVER be blocked.
Only clearly non-human, automated/spam patterns get flagged, and flagged
counts are excluded from the *rating*, not from the user's own counter.
"""
from __future__ import annotations

import datetime as dt
from collections import deque
from typing import Deque, Dict

# In-memory sliding window per user_id of recent tap timestamps (per-process).
# Good enough for a single Render web service instance running the bot+api together.
_TAP_WINDOWS: Dict[int, Deque[float]] = {}

WINDOW_SECONDS = 10.0
# A very fast, sustained human double-thumb tap tops out well under this.
# Only flag when a user exceeds this rate SUSTAINED over the window.
MAX_TAPS_PER_WINDOW = 40  # ~4 taps/sec sustained for 10s straight
MIN_INTERVAL_FOR_FLAG = 0.05  # 50ms - faster than humanly possible repeatedly


def register_tap(user_id: int, now: dt.datetime | None = None) -> bool:
    """Record a tap and return True if this tap looks suspicious (bot-like).

    This NEVER prevents the tap from counting for the user's own tasbeh -
    it only marks the tap so it can be excluded from rating/rewards.
    """
    ts = (now or dt.datetime.now(dt.timezone.utc)).timestamp()
    window = _TAP_WINDOWS.setdefault(user_id, deque())
    window.append(ts)

    while window and ts - window[0] > WINDOW_SECONDS:
        window.popleft()

    if len(window) < 5:
        return False

    intervals = [window[i] - window[i - 1] for i in range(1, len(window))]
    too_regular_and_fast = all(iv < MIN_INTERVAL_FOR_FLAG for iv in intervals[-5:])
    too_many_in_window = len(window) > MAX_TAPS_PER_WINDOW

    return bool(too_regular_and_fast or too_many_in_window)
