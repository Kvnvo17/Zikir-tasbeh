window.Streak = (function () {
  async function fetchStreak() {
    return API.get("/profile/streak");
  }

  function renderBox(streak) {
    return `<div class="streak-box">
      <span class="streak-flame">\uD83D\uDD25</span>
      <div>
        <div style="font-size:18px;font-weight:700">${streak.current_streak} kun</div>
        <div style="font-size:11px;color:#8a90a3">Eng uzun: ${streak.longest_streak} kun</div>
      </div>
    </div>`;
  }

  return { fetchStreak, renderBox };
})();
