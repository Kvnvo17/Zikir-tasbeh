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

    root.innerHTML = `
      <div class="theme-tasbeh animate-in">

        <!-- STATISTIKA -->
        <div class="mini-stats">
          <div class="mini-stat">
            <div class="v" id="todayVal">0</div>
            <div class="l">Bugun</div>
          </div>

          <div class="mini-stat">
            <div class="v" id="weekVal">0</div>
            <div class="l">Hafta</div>
          </div>
        </div>

        <!-- KUNLIK MAQSAD -->
        <div class="goal-row" id="goalRow" style="cursor:pointer">
          <span>🎯</span>

          <div class="goal-bar">
            <div
              class="goal-fill"
              id="goalFill"
              style="width:0%"
            ></div>
          </div>

          <span id="goalText">0 / 1000</span>
        </div>

        <!-- ZIKR TANLASH -->
        <div class="zikr-select-row">

          <div class="zikr-display">
            <div class="zikr-small-label">
              Hozirgi zikr
            </div>

            <h2
              class="zikr-title"
              id="zikrName"
            >
              Yuklanmoqda...
            </h2>
          </div>

          <button
            class="zikr-change-btn"
            id="changeZikrBtn"
          >
            O'zgartirish
          </button>

        </div>

        <!-- SANASH REJIMI -->
        <div class="mode-tabs">

          <button
            class="mode-tab"
            data-mode="33"
          >
            33
          </button>

          <button
            class="mode-tab"
            data-mode="99"
          >
            99
          </button>

          <button
            class="mode-tab"
            data-mode="inf"
          >
            ∞
          </button>

        </div>

        <!-- TASBEH -->
        <div class="tasbeh-wrap">

          <button
            class="tasbeh-btn"
            id="tasbehBtn"
            aria-label="Tasbehni sanash"
          >

            <div class="tasbeh-progress-ring">
              <div
                class="fill"
                id="ringFill"
              ></div>
            </div>

            <span
              class="tasbeh-count"
              id="tasbehCount"
            >
              0
            </span>

          </button>

          <div class="tasbeh-hint">
            Tasbehni bosib zikr sanang
          </div>

        </div>

      </div>
    `;

    await loadInitialData();

    bindEvents(root);
    updateModeUI(root);
    updateCountUI(root);
  }

  async function loadInitialData() {
    try {
      const [me, zikrs] = await Promise.all([
        API.get("/users/me"),
        API.get("/zikr"),
      ]);

      state.dailyGoal = me.daily_goal || 1000;

      state.zikr =
        zikrs.find(
          (z) => z.id === me.selected_zikr_id
        ) ||
        zikrs[0] ||
        null;

      const today = await API.get(
        "/profile/history?range=today"
      );

      state.todayCount =
        today && today[0]
          ? today[0].count
          : 0;

      updateStatsUI();

    } catch (e) {
      console.error(
        "Tasbeh ma'lumot xatosi:",
        e
      );

      Toast.show(
        e.message ||
        "Ma'lumotlarni yuklashda xatolik"
      );
    }
  }

  function updateStatsUI() {
    const todayEl =
      document.getElementById("todayVal");

    const weekEl =
      document.getElementById("weekVal");

    const goalFill =
      document.getElementById("goalFill");

    const goalText =
      document.getElementById("goalText");

    const zikrName =
      document.getElementById("zikrName");

    if (todayEl) {
      todayEl.textContent =
        state.todayCount;
    }

    if (weekEl) {
      weekEl.textContent =
        state.weekCount;
    }

    if (goalFill) {
      const percent =
        state.dailyGoal > 0
          ? (
              state.todayCount /
              state.dailyGoal
            ) * 100
          : 0;

      goalFill.style.width =
        `${Math.min(100, percent)}%`;
    }

    if (goalText) {
      goalText.textContent =
        `${state.todayCount} / ${state.dailyGoal}`;
    }

    if (zikrName) {
      zikrName.textContent =
        state.zikr
          ? state.zikr.text
          : "Zikr tanlanmagan";
    }
  }

  function bindEvents(root) {

    // ==========================================
    // 33 / 99 / ∞
    // ==========================================

    root
      .querySelectorAll(".mode-tab")
      .forEach((tab) => {

        tab.addEventListener(
          "click",
          () => {

            state.mode =
              tab.dataset.mode;

            state.value = 0;

            TG.haptic("light");

            updateModeUI(root);
            updateCountUI(root);

          }
        );

      });


    // ==========================================
    // ZIKR O'ZGARTIRISH
    // ==========================================

    const changeZikrBtn =
      document.getElementById(
        "changeZikrBtn"
      );

    if (changeZikrBtn) {

      changeZikrBtn.addEventListener(
        "click",
        () => {

          ZikrSelector.openPicker(
            (zikr) => {

              state.zikr = zikr;

              // Zikr almashtirilganda
              // tasbehni 0 ga qaytarish
              state.value = 0;

              updateStatsUI();
              updateCountUI(root);

              TG.haptic("light");

            }
          );

        }
      );

    }


    // ==========================================
    // KUNLIK MAQSAD
    // ==========================================

    const goalRow =
      document.getElementById(
        "goalRow"
      );

    if (goalRow) {

      goalRow.addEventListener(
        "click",
        () => {

          Modal.open(`
            <p class="section-title">
              Kunlik maqsad
            </p>

            <input
              type="number"
              id="goalInput"
              min="1"
              value="${state.dailyGoal}"
            />

            <button
              class="btn block accent-tasbeh-bg"
              id="saveGoalBtn"
            >
              Saqlash
            </button>
          `);

          const saveGoalBtn =
            document.getElementById(
              "saveGoalBtn"
            );

          if (saveGoalBtn) {

            saveGoalBtn.addEventListener(
              "click",
              async () => {

                const input =
                  document.getElementById(
                    "goalInput"
                  );

                const value =
                  parseInt(
                    input.value,
                    10
                  );

                if (
                  !value ||
                  value <= 0
                ) {

                  Toast.show(
                    "Noto'g'ri qiymat"
                  );

                  return;
                }

                try {

                  const updated =
                    await Loader.wrap(
                      API.post(
                        "/users/me/daily-goal",
                        {
                          daily_goal: value,
                        }
                      )
                    );

                  state.dailyGoal =
                    updated.daily_goal;

                  updateStatsUI();

                  Modal.close();

                  Toast.show(
                    "Saqlandi"
                  );

                } catch (e) {

                  console.error(
                    "Maqsad xatosi:",
                    e
                  );

                  Toast.show(
                    e.message ||
                    "Xatolik yuz berdi"
                  );

                }

              }
            );

          }

        }
      );

    }


    // ==========================================
    // TASBEH TUGMASI
    // ==========================================

    const tasbehBtn =
      document.getElementById(
        "tasbehBtn"
      );

    if (tasbehBtn) {

      tasbehBtn.addEventListener(
        "click",
        () => {

          onTap(tasbehBtn);

        }
      );

    }

  }


  // ==========================================
  // MODE UI
  // ==========================================

  function updateModeUI(root) {

    root
      .querySelectorAll(".mode-tab")
      .forEach((tab) => {

        tab.classList.toggle(
          "active",
          tab.dataset.mode ===
            state.mode
        );

      });

  }


  // ==========================================
  // COUNT UI
  // ==========================================

  function updateCountUI(root) {

    const countEl =
      document.getElementById(
        "tasbehCount"
      );

    const ringFill =
      document.getElementById(
        "ringFill"
      );

    const progress =
      Counter.progressPct(
        state.value,
        state.mode
      );

    if (countEl) {

      countEl.textContent =
        state.value;

      // Raqamga yangi animatsiya
      countEl.classList.remove(
        "tasbeh-count-pop"
      );

      void countEl.offsetWidth;

      countEl.classList.add(
        "tasbeh-count-pop"
      );

    }

    if (ringFill) {

      ringFill.style.width =
        `${progress}%`;

      TasbehAnimation.setRing(
        ringFill,
        progress
      );

    }

  }


  // ==========================================
  // TASBEH BOSILISHI
  // ==========================================

  async function onTap(btnEl) {

    // Keyingi son
    state.value =
      Counter.nextValue(
        state.value,
        state.mode
      );


    // Bosilgandagi yumshoq animatsiya
    TasbehAnimation.pulse(
      btnEl
    );


    // Telefon vibratsiyasi
    TG.haptic("light");


    // Sonni yangilash
    updateCountUI(
      document.getElementById(
        "page-root"
      )
    );


    // ========================================
    // 33 / 99 YAKUNLANGANDA
    // ========================================

    if (
      Counter.isComplete(
        state.value,
        state.mode
      )
    ) {

      // Kuchli yakuniy animatsiya
      TasbehAnimation.complete(
        btnEl
      );

      // Kuchli vibratsiya
      TG.haptic("success");

    }


    // ========================================
    // SERVERGA YUBORISH
    // ========================================

    API.post(
      "/tasbeh/increment",
      {
        mode: state.mode,

        zikr_id:
          state.zikr
            ? state.zikr.id
            : null,
      }
    )

      .then((result) => {

        state.todayCount =
          result.today_count;

        state.weekCount =
          result.week_count;

        state.dailyGoal =
          result.daily_goal;

        updateStatsUI();

      })

      .catch((error) => {

        console.error(
          "Tasbeh API xatosi:",
          error
        );

      });

  }


  // ==========================================
  // PUBLIC
  // ==========================================

  return {
    render,
  };

})();