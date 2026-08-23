window.TasbehPage = (function () {
  let state = {
    mode: "33",
    value: 0,
    zikr: null,
    zikrs: [],
    zikrIndex: 0,
    todayCount: 0,
    weekCount: 0,
    dailyGoal: 1000,
    busy: false,
  };

  async function render(root) {
    root = root || document.getElementById("page-root");

    if (!root) {
      console.error("Tasbeh: page-root topilmadi");
      return;
    }

    root.innerHTML = `
      <div class="theme-tasbeh animate-in">

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

  // =====================================================
  // BOSHLANG'ICH MA'LUMOTLAR
  // =====================================================

  async function loadInitialData() {
    try {
      const [me, zikrs] = await Promise.all([
        API.get("/users/me"),
        API.get("/zikr"),
      ]);

      state.dailyGoal =
        me && me.daily_goal
          ? me.daily_goal
          : 1000;

      state.zikrs =
        Array.isArray(zikrs)
          ? zikrs
          : [];

      // Tanlangan zikrni topish
      state.zikrIndex = 0;

      if (
        me &&
        me.selected_zikr_id &&
        state.zikrs.length
      ) {
        const foundIndex =
          state.zikrs.findIndex(
            (z) =>
              z.id === me.selected_zikr_id
          );

        if (foundIndex >= 0) {
          state.zikrIndex = foundIndex;
        }
      }

      state.zikr =
        state.zikrs[state.zikrIndex] ||
        null;

      // Bugungi statistika
      try {
        const today =
          await API.get(
            "/profile/history?range=today"
          );

        state.todayCount =
          today && today[0]
            ? Number(today[0].count || 0)
            : 0;
      } catch (e) {
        console.error(
          "Bugungi statistika xatosi:",
          e
        );

        state.todayCount = 0;
      }

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

  // =====================================================
  // KEYINGI ZIKR
  // =====================================================

  function goToNextZikr() {
    if (!state.zikrs.length) {
      return;
    }

    state.zikrIndex =
      (state.zikrIndex + 1) %
      state.zikrs.length;

    state.zikr =
      state.zikrs[state.zikrIndex] ||
      null;

    updateStatsUI();
  }

  // =====================================================
  // STATISTIKA
  // =====================================================

  function updateStatsUI() {
    const todayEl =
      document.getElementById(
        "todayVal"
      );

    const weekEl =
      document.getElementById(
        "weekVal"
      );

    const goalFill =
      document.getElementById(
        "goalFill"
      );

    const goalText =
      document.getElementById(
        "goalText"
      );

    const zikrName =
      document.getElementById(
        "zikrName"
      );

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
        state.zikr &&
        state.zikr.text
          ? state.zikr.text
          : "Zikr tanlanmagan";
    }
  }

  // =====================================================
  // EVENTLAR
  // =====================================================

  function bindEvents(root) {

    // -----------------------------------------------
    // 33 / 99 / ∞
    // -----------------------------------------------

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


    // -----------------------------------------------
    // ZIKR O'ZGARTIRISH
    // -----------------------------------------------

    const changeZikrBtn =
      document.getElementById(
        "changeZikrBtn"
      );

    if (changeZikrBtn) {

      changeZikrBtn.addEventListener(
        "click",
        () => {

          if (
            typeof ZikrSelector !==
            "undefined" &&
            ZikrSelector.openPicker
          ) {

            ZikrSelector.openPicker(
              (zikr) => {

                if (!zikr) {
                  return;
                }

                state.zikr = zikr;

                const index =
                  state.zikrs.findIndex(
                    (z) =>
                      z.id === zikr.id
                  );

                if (index >= 0) {
                  state.zikrIndex = index;
                }

                state.value = 0;

                updateStatsUI();
                updateCountUI(root);

                TG.haptic("light");
              }
            );

          } else {
            console.warn(
              "ZikrSelector mavjud emas"
            );
          }

        }
      );

    }


    // -----------------------------------------------
    // KUNLIK MAQSAD
    // -----------------------------------------------

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


    // -----------------------------------------------
    // TASBEH TUGMASI
    // -----------------------------------------------

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

  // =====================================================
  // MODE UI
  // =====================================================

  function updateModeUI(root) {

    if (!root) {
      return;
    }

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

  // =====================================================
  // COUNT UI
  // =====================================================

  function updateCountUI(root) {

    const countEl =
      document.getElementById(
        "tasbehCount"
      );

    const ringFill =
      document.getElementById(
        "ringFill"
      );

    let progress = 0;

    try {

      progress =
        Counter.progressPct(
          state.value,
          state.mode
        );

    } catch (e) {

      // Counter ishlamasa ham
      // Web App buzilib qolmasin

      if (state.mode === "33") {
        progress =
          (state.value / 33) * 100;
      } else if (state.mode === "99") {
        progress =
          (state.value / 99) * 100;
      } else {
        progress = 0;
      }
    }

    if (countEl) {

      countEl.textContent =
        state.value;

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
        `${Math.min(100, progress)}%`;

      if (
        typeof TasbehAnimation !==
          "undefined" &&
        TasbehAnimation.setRing
      ) {

        TasbehAnimation.setRing(
          ringFill,
          progress
        );

      }

    }

  }

  // =====================================================
  // TASBEH BOSILISHI
  // =====================================================

  async function onTap(btnEl) {

    if (state.busy) {
      return;
    }

    state.busy = true;

    try {

      // ---------------------------------------------
      // KEYINGI SON
      // ---------------------------------------------

      try {

        state.value =
          Counter.nextValue(
            state.value,
            state.mode
          );

      } catch (e) {

        // Counter fallback
        if (state.mode === "33") {

          state.value =
            state.value >= 33
              ? 1
              : state.value + 1;

        } else if (state.mode === "99") {

          state.value =
            state.value >= 99
              ? 1
              : state.value + 1;

        } else {

          state.value += 1;

        }

      }


      // ---------------------------------------------
      // YUMSHOQ ANIMATSIYA
      // ---------------------------------------------

      if (
        typeof TasbehAnimation !==
          "undefined" &&
        TasbehAnimation.pulse
      ) {

        TasbehAnimation.pulse(
          btnEl
        );

      }


      // ---------------------------------------------
      // VIBRATSIYA
      // ---------------------------------------------

      if (
        typeof TG !== "undefined" &&
        TG.haptic
      ) {

        TG.haptic("light");

      }


      // ---------------------------------------------
      // SONNI YANGILASH
      // ---------------------------------------------

      const root =
        document.getElementById(
          "page-root"
        );

      updateCountUI(root);


      // ---------------------------------------------
      // YAKUNLANGANINI ANIQLASH
      // ---------------------------------------------

      let completed = false;

      try {

        completed =
          Counter.isComplete(
            state.value,
            state.mode
          );

      } catch (e) {

        if (state.mode === "33") {
          completed =
            state.value === 33;
        }

        if (state.mode === "99") {
          completed =
            state.value === 99;
        }

      }


      // ---------------------------------------------
      // 33 / 99 YAKUNI
      // ---------------------------------------------

      if (completed) {

        if (
          typeof TasbehAnimation !==
            "undefined" &&
          TasbehAnimation.complete
        ) {

          TasbehAnimation.complete(
            btnEl
          );

        }

        if (
          typeof TG !== "undefined" &&
          TG.haptic
        ) {

          TG.haptic("success");

        }

      }


      // ---------------------------------------------
      // SERVERGA YUBORISH
      // ---------------------------------------------

      try {

        const result =
          await API.post(
            "/tasbeh/increment",
            {
              mode: state.mode,

              zikr_id:
                state.zikr
                  ? state.zikr.id
                  : null,
            }
          );

        if (result) {

          if (
            result.today_count !==
            undefined
          ) {

            state.todayCount =
              result.today_count;

          }

          if (
            result.week_count !==
            undefined
          ) {

            state.weekCount =
              result.week_count;

          }

          if (
            result.daily_goal !==
            undefined
          ) {

            state.dailyGoal =
              result.daily_goal;

          }

          updateStatsUI();

        }

      } catch (error) {

        console.error(
          "Tasbeh API xatosi:",
          error
        );

      }


      // ---------------------------------------------
      // FAQAT 33 VA 99 DAN KEYIN
      // 0 + KEYINGI ZIKR
      // ---------------------------------------------

      if (
        completed &&
        (
          state.mode === "33" ||
          state.mode === "99"
        )
      ) {

        setTimeout(
          () => {

            // Avval 0
            state.value = 0;

            updateCountUI(
              document.getElementById(
                "page-root"
              )
            );

            // Keyin navbatdagi zikr
            setTimeout(
              () => {

                goToNextZikr();

                updateCountUI(
                  document.getElementById(
                    "page-root"
                  )
                );

              },
              150
            );

          },
          500
        );

      }

    } finally {

      state.busy = false;

    }

  }

  // =====================================================
  // PUBLIC
  // =====================================================

  return {
    render,
    onTap,
  };

})();
