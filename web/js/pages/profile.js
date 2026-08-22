window.ProfilePage = (function () {
  const THEMES = ["default", "emerald", "amber", "rose", "indigo", "graphite"];
  let historyRange = "7d";
  let me = null;

  async function render(root) {
    root = root || document.getElementById("page-root");
    root.innerHTML = `<div class="theme-profile animate-in">
      <div class="profile-header">
        <div class="profile-avatar" id="avatarBox">?</div>
        <div>
          <div class="profile-name" id="nameEl">...</div>
          <div class="profile-sub" id="usernameEl"></div>
        </div>
      </div>

      <div class="profile-stats-grid">
        <div class="profile-stat"><div class="v" id="totalCountEl">0</div><div class="l">Jami zikr</div></div>
        <div class="profile-stat"><div class="v" id="todayCountEl">0</div><div class="l">Bugungi zikr</div></div>
        <div class="profile-stat"><div class="v" id="weekCountEl">0</div><div class="l">Haftalik zikr</div></div>
        <div class="profile-stat"><div class="v" id="referralsEl">0</div><div class="l">Referallar</div></div>
      </div>

      <div class="glass-card" style="margin-bottom:14px">
        <p class="section-title">\u{1F525} Ketma-ket kunlar</p>
        <div id="streakBox"><div class="empty-state">Yuklanmoqda...</div></div>
      </div>

      <div class="glass-card" style="margin-bottom:14px">
        <p class="section-title">\u{1F4CA} Zikr tarixi</p>
        <div class="history-tabs">
          <button class="history-tab" data-range="today">Bugun</button>
          <button class="history-tab" data-range="7d">7 kun</button>
          <button class="history-tab" data-range="30d">30 kun</button>
          <button class="history-tab" data-range="all">Jami</button>
        </div>
        <div id="historyChart"><div class="empty-state">Yuklanmoqda...</div></div>
      </div>

      <div class="glass-card" style="margin-bottom:14px">
        <p class="section-title">\u{1F3C5} Yutuqlarim</p>
        <div id="achievementsBox"><div class="empty-state">Yuklanmoqda...</div></div>
      </div>

      <div class="glass-card" style="margin-bottom:14px">
        <p class="section-title">\u{1F3A8} Tasbeh ko'rinishi</p>
        <div class="theme-grid" id="themeGrid"></div>
      </div>

      <div class="glass-card">
        <div class="profile-list-item" id="referralItem"><span>\u{1F465} Do'stlarni taklif qilish</span><span class="chev">\u203A</span></div>
        <div class="profile-list-item" id="reminderItem"><span>\u{1F514} Eslatma</span><span class="chev">\u203A</span></div>
      </div>
    </div>`;

    bindEvents(root);
    await Promise.all([loadHeader(), loadStats(), loadStreak(), loadHistory(root), loadAchievements(), renderThemes(root)]);
  }

  function bindEvents(root) {
    root.querySelectorAll(".history-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        historyRange = tab.dataset.range;
        TG.haptic("light");
        loadHistory(root);
      });
    });

    document.getElementById("referralItem").addEventListener("click", async () => {
      try {
        const info = await Loader.wrap(Referrals.fetchInfo());
        Referrals.openModal(info);
      } catch (e) {
        Toast.show(e.message);
      }
    });

    document.getElementById("reminderItem").addEventListener("click", async () => {
      try {
        const current = await Loader.wrap(Reminders.fetchSettings());
        Reminders.openModal(current, () => {});
      } catch (e) {
        Toast.show(e.message);
      }
    });
  }

  async function loadHeader() {
    try {
      me = await API.get("/users/me");
      const tgUser = TG.user();
      document.getElementById("nameEl").textContent = me.first_name;
      document.getElementById("usernameEl").textContent = me.username ? "@" + me.username : "";
      const avatarBox = document.getElementById("avatarBox");
      const photo = (tgUser && tgUser.photo_url) || me.photo_url;
      if (photo) {
        avatarBox.innerHTML = `<img src="${photo}" />`;
      } else {
        avatarBox.textContent = (me.first_name || "?").charAt(0).toUpperCase();
      }
      document.getElementById("totalCountEl").textContent = me.total_count;
    } catch (e) {
      Toast.show(e.message);
    }
  }

  async function loadStats() {
    try {
      const [todayPts, weekHistory, referralInfo] = await Promise.all([
        API.get("/profile/history?range=today"),
        API.get("/profile/history?range=7d"),
        API.get("/referrals/me"),
      ]);
      document.getElementById("todayCountEl").textContent = todayPts[0] ? todayPts[0].count : 0;
      const weekTotal = weekHistory.reduce((sum, p) => sum + p.count, 0);
      document.getElementById("weekCountEl").textContent = weekTotal;
      document.getElementById("referralsEl").textContent = referralInfo.invited_count;
    } catch (e) {
      /* non-fatal */
    }
  }

  async function loadStreak() {
    const el = document.getElementById("streakBox");
    try {
      const streak = await Streak.fetchStreak();
      el.innerHTML = Streak.renderBox(streak);
    } catch (e) {
      el.innerHTML = `<div class="empty-state">${e.message}</div>`;
    }
  }

  async function loadHistory(root) {
    root.querySelectorAll(".history-tab").forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.range === historyRange);
    });
    const el = document.getElementById("historyChart");
    el.innerHTML = `<div class="empty-state">Yuklanmoqda...</div>`;
    try {
      const points = await Statistics.fetchHistory(historyRange);
      el.innerHTML = points.length ? Statistics.renderBarChart(points) : `<div class="empty-state">Ma'lumot yo'q</div>`;
    } catch (e) {
      el.innerHTML = `<div class="empty-state">${e.message}</div>`;
    }
  }

  async function loadAchievements() {
    const el = document.getElementById("achievementsBox");
    try {
      const achievements = await Achievements.fetchAll();
      el.innerHTML = Achievements.renderGrid(achievements);
    } catch (e) {
      el.innerHTML = `<div class="empty-state">${e.message}</div>`;
    }
  }

  function renderThemes(root) {
    const grid = document.getElementById("themeGrid");
    const gradients = {
      default: "linear-gradient(135deg,#4f7cff,#7a5cff)",
      emerald: "linear-gradient(135deg,#29c9a0,#12836c)",
      amber: "linear-gradient(135deg,#ffb03c,#c97a12)",
      rose: "linear-gradient(135deg,#ff6b90,#c73763)",
      indigo: "linear-gradient(135deg,#6a5cff,#3d2fb8)",
      graphite: "linear-gradient(135deg,#5a5f6e,#26282f)",
    };

    grid.innerHTML = THEMES.map(
      (t) => `<div class="theme-swatch ${me && me.tasbeh_theme === t ? "selected" : ""}" data-theme="${t}"
        style="background:${gradients[t]}"></div>`
    ).join("");

    grid.querySelectorAll(".theme-swatch").forEach((sw) => {
      sw.addEventListener("click", async () => {
        try {
          me = await API.post("/users/me/theme", { theme: sw.dataset.theme });
          grid.querySelectorAll(".theme-swatch").forEach((s) => s.classList.remove("selected"));
          sw.classList.add("selected");
          TG.haptic("light");
        } catch (e) {
          Toast.show(e.message);
        }
      });
    });
  }

  return { render };
})();
