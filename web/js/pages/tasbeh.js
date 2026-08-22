window.TasbehPage = (function () {
  let state = {
    mode: "33",
    value: 0,
    zikr: null,
    todayCount: 0,
    weekCount: 0,
    dailyGoal: 1000,
    busy: false,
  };

  async function render(root) {
    root = root || document.getElementById("page-root");
    root.innerHTML = `<div class="theme-tasbeh animate-in">
      <div class="mini-stats">
        <div class="mini-stat"><div class="v" id="todayVal">0</div><div class="l">Bugun</div></div>
        <div class="mini-stat"><div class="v" id="weekVal">0</div><div class="l">Hafta</div></div>
      </div>

      <div class="goal-row" id="goalRow" style="cursor:pointer">
        <span>\u{1F3AF}</span>
        <div class="goal-bar"><div class="goal-fill" id="goalFill" style="width:0%"></div></div>
        <span id="goalText">0 / 1000</span>
      </div>

      <div class="zikr-select-row">
        <span class="zikr-name" id="zikrName">Yuklanmoqda...</span>
        <button class="zikr-change-btn" id="changeZikrBtn">O'zgartirish</button>
      </div>

      <div class="mode-tabs">
        <button class="mode-tab" data-mode="33">33</button>
        <button class="mode-tab" data-mode="99">99</button>
        <button class="mode-tab" data-mode="inf">\u221E</button>
      </div>

      <div class="tasbeh-wrap">
        <button class="tasbeh-btn" id="tasbehBtn">
          <div class="tasbeh-progress-ring"><div class="fill" id="ringFill"></div></div>
          <span class="tasbeh-count" id="tasbehCount">0</span>
        </button>
        <div class="tasbeh-hint">Tasbehni bosib zikr sanang</div>
      </div>
    </div>`;

    await loadInitialData();
    bindEvents(root);
    updateModeUI(root);
    updateCountUI(root);
  }

  async function loadInitialData() {
    try {
      const [me, zikrs] = await Promise.all([API.get("/users/me"), API.get("/zikr")]);
      state.dailyGoal = me.daily_goal;
      state.zikr = zikrs.find((z) => z.id === me.selected_zikr_id) || zikrs[0] || null;

      const today = await API.get("/profile/history?range=today");
      state.todayCount = today[0] ? today[0].count : 0;

      updateStatsUI();
    } catch (e) {
      Toast.show(e.message);
    }
  }

  function updateStatsUI() {
    const todayEl = document.getElementById("todayVal");
    const weekEl = document.getElementById("weekVal");
    const goalFill = document.getElementById("goalFill");
    const goalText = document.getElementById("goalText");
    const zikrName = document.getElementById("zikrName");

    if (todayEl) todayEl.textContent = state.todayCount;
    if (weekEl) weekEl.textContent = state.weekCount;
    if (goalFill) goalFill.style.width = `${Math.min(100, (state.todayCount / state.dailyGoal) * 100)}%`;
    if (goalText) goalText.textContent = `${state.todayCount} / ${state.dailyGoal}`;
    if (zikrName) zikrName.textContent = state.zikr ? state.zikr.text : "Zikr tanlanmagan";
  }

  function bindEvents(root) {
    root.querySelectorAll(".mode-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        state.mode = tab.dataset.mode;
        state.value = 0;
        TG.haptic("light");
        updateModeUI(root);
        updateCountUI(root);
      });
    });

    document.getElementById("changeZikrBtn").addEventListener("click", () => {
      ZikrSelector.openPicker((zikr) => {
        state.zikr = zikr;
        updateStatsUI();
      });
    });

    document.getElementById("goalRow").addEventListener("click", () => {
      Modal.open(`
        <p class="section-title">Kunlik maqsad</p>
        <input type="number" id="goalInput" min="1" value="${state.dailyGoal}" />
        <button class="btn block accent-tasbeh-bg" id="saveGoalBtn">Saqlash</button>
      `);
      document.getElementById("saveGoalBtn").addEventListener("click", async () => {
        const value = parseInt(document.getElementById("goalInput").value, 10);
        if (!value || value <= 0) {
          Toast.show("Noto'g'ri qiymat");
          return;
        }
        try {
          const updated = await Loader.wrap(API.post("/users/me/daily-goal", { daily_goal: value }));
          state.dailyGoal = updated.daily_goal;
          updateStatsUI();
          Modal.close();
          Toast.show("Saqlandi");
        } catch (e) {
          Toast.show(e.message);
        }
      });
    });

    const tasbehBtn = document.getElementById("tasbehBtn");
    tasbehBtn.addEventListener("click", () => onTap(tasbehBtn));
  }

  function updateModeUI(root) {
    root.querySelectorAll(".mode-tab").forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.mode === state.mode);
    });
  }

  function updateCountUI(root) {
    const countEl = document.getElementById("tasbehCount");
    const ringFill = document.getElementById("ringFill");
    if (countEl) countEl.textContent = state.value;
    if (ringFill) TasbehAnimation.setRing(ringFill, Counter.progressPct(state.value, state.mode));
  }

  async function onTap(btnEl) {
    const wasComplete = Counter.isComplete(state.value, state.mode);
    state.value = Counter.nextValue(state.value, state.mode);

    TasbehAnimation.pulse(btnEl);
    TG.haptic("light");
    updateCountUI(document.getElementById("page-root"));

    if (Counter.isComplete(state.value, state.mode)) {
      TasbehAnimation.complete(btnEl);
      TG.haptic("success");
    }

    // Fire-and-forget: never block subsequent taps on network latency, so a
    // user tapping quickly always sees an instant local response.
    API.post("/tasbeh/increment", { mode: state.mode, zikr_id: state.zikr ? state.zikr.id : null })
      .then((result) => {
        state.todayCount = result.today_count;
        state.weekCount = result.week_count;
        state.dailyGoal = result.daily_goal;
        updateStatsUI();
      })
      .catch(() => {
        // Transient network issue — local tasbeh count already advanced, so
        // nothing is lost from the user's perspective.
      });
  }

  return { render };
})();
