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
    busy: false
  };


  // ==========================================
  // RENDER
  // ==========================================

  async function render(root) {

    root =
      root ||
      document.getElementById("page-root");

    if (!root) {
      console.error("page-root topilmadi");
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


        <div
          class="goal-row"
          id="goalRow"
          style="cursor:pointer"
        >

          <span>🎯</span>

          <div class="goal-bar">

            <div
              class="goal-fill"
              id="goalFill"
              style="width:0%"
            ></div>

          </div>

          <span id="goalText">
            0 / 1000
          </span>

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


  // ==========================================
  // INITIAL DATA
  // ==========================================

  async function loadInitialData() {

    try {

      const [
        me,
        zikrs
      ] = await Promise.all([
        API.get("/users/me"),
        API.get("/zikr")
      ]);


      state.dailyGoal =
        me.daily_goal || 1000;


      state.zikrs =
        Array.isArray(zikrs)
          ? zikrs
          : [];


      if (state.zikrs.length > 0) {

        const selectedIndex =
          state.zikrs.findIndex(
            (z) =>
              z.id === me.selected_zikr_id
          );


        state.zikrIndex =
          selectedIndex >= 0
            ? selectedIndex
            : 0;


        state.zikr =
          state.zikrs[state.zikrIndex];

      } else {

        state.zikr = null;
        state.zikrIndex = 0;

      }


      const today =
        await API.get(
          "/profile/history?range=today"
        );


      state.todayCount =
        today &&
        today[0]
          ? today[0].count
          : 0;


      updateStatsUI();


    } catch (e) {

      console.error(
        "Tasbeh ma'lumot xatosi:",
        e
      );


      if (
        typeof Toast !== "undefined" &&
        Toast.show
      ) {

        Toast.show(
          e.message ||
          "Ma'lumotlarni yuklashda xatolik"
        );

      }

    }

  }


  // ==========================================
  // STATISTIKA
  // ==========================================

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
        state.weekCount || 0;

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
          ? (
              state.zikr.text ||
              state.zikr.name ||
              "Zikr"
            )
          : "Zikr tanlanmagan";

    }

  }


  // ==========================================
  // EVENTS
  // ==========================================

  function bindEvents(root) {


    // ========================================
    // 33 / 99 / INFINITE
    // ========================================

    root
      .querySelectorAll(".mode-tab")
      .forEach((tab) => {

        tab.addEventListener(
          "click",
          () => {

            state.mode =
              tab.dataset.mode;


            state.value = 0;


            if (
              typeof TG !== "undefined" &&
              TG.haptic
            ) {

              TG.haptic("light");

            }


            updateModeUI(root);

            updateCountUI(root);

          }
        );

      });


    // ========================================
    // ZIKR O'ZGARTIRISH
    // ========================================

    const changeZikrBtn =
      document.getElementById(
        "changeZikrBtn"
      );


    if (changeZikrBtn) {

      changeZikrBtn.addEventListener(
        "click",
        () => {

          if (
            typeof ZikrSelector !== "undefined" &&
            ZikrSelector.openPicker
          ) {

            ZikrSelector.openPicker(
              (zikr) => {

                setZikr(zikr);

              }
            );

          } else {

            // Agar picker mavjud bo'lmasa
            // o'zimiz keyingi zikrga o'tamiz

            nextZikr();

          }

        }
      );

    }


    // ========================================
    // KUNLIK MAQSAD
    // ========================================

    const goalRow =
      document.getElementById(
        "goalRow"
      );


    if (goalRow) {

      goalRow.addEventListener(
        "click",
        openGoalModal
      );

    }


    // ========================================
    // TASBEH
    // ========================================

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
  // ZIKR O'RNATISH
  // ==========================================

  function setZikr(zikr) {

    if (!zikr) return;


    state.zikr = zikr;


    const index =
      state.zikrs.findIndex(
        (z) => z.id === zikr.id
      );


    if (index >= 0) {

      state.zikrIndex = index;

    }


    // Zikr almashganda hisob 0
    state.value = 0;


    updateStatsUI();


    updateCountUI(
      document.getElementById(
        "page-root"
      )
    );


    if (
      typeof TG !== "undefined" &&
      TG.haptic
    ) {

      TG.haptic("light");

    }

  }


  // ==========================================
  // KEYINGI ZIKR
  // ==========================================

  function nextZikr() {

    if (
      !state.zikrs ||
      state.zikrs.length === 0
    ) {

      return;

    }


    state.zikrIndex =
      (
        state.zikrIndex + 1
      ) %
      state.zikrs.length;


    state.zikr =
      state.zikrs[state.zikrIndex];


    state.value = 0;


    updateStatsUI();


    updateCountUI(
      document.getElementById(
        "page-root"
      )
    );

  }


  // ==========================================
  // MODE UI
  // ==========================================

  function updateModeUI(root) {

    if (!root) return;


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


    let progress = 0;


    if (
      typeof Counter !== "undefined"
    ) {

      progress =
        Counter.progressPct(
          state.value,
          state.mode
        );

    } else {

      if (state.mode === "33") {

        progress =
          Math.round(
            (state.value / 33) * 100
          );

      } else if (state.mode === "99") {

        progress =
          Math.round(
            (state.value / 99) * 100
          );

      } else {

        progress =
          state.value % 100;

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
        `${progress}%`;


      if (
        typeof TasbehAnimation !== "undefined" &&
        TasbehAnimation.setRing
      ) {

        TasbehAnimation.setRing(
          ringFill,
          progress
        );

      }

    }

  }


  // ==========================================
  // TASBEH ON TAP
  // ==========================================

  async function onTap(btnEl) {

    if (state.busy) {
      return;
    }


    // Keyingi son
    if (
      typeof Counter !== "undefined"
    ) {

      state.value =
        Counter.nextValue(
          state.value,
          state.mode
        );

    } else {

      // Counter ishlamasa fallback

      if (state.mode === "33") {

        state.value =
          state.value >= 33
            ? 0
            : state.value + 1;

      } else if (state.mode === "99") {

        state.value =
          state.value >= 99
            ? 0
            : state.value + 1;

      } else {

        state.value++;

      }

    }


    // Yumshoq animatsiya
    if (
      typeof TasbehAnimation !== "undefined" &&
      TasbehAnimation.pulse
    ) {

      TasbehAnimation.pulse(
        btnEl
      );

    }


    // Vibratsiya
    if (
      typeof TG !== "undefined" &&
      TG.haptic
    ) {

      TG.haptic("light");

    }


    // UI
    updateCountUI(
      document.getElementById(
        "page-root"
      )
    );


    // ========================================
    // YAKUNLANGANINI TEKSHIRISH
    // ========================================

    let completed = false;


    if (
      typeof Counter !== "undefined" &&
      Counter.isComplete
    ) {

      completed =
        Counter.isComplete(
          state.value,
          state.mode
        );

    } else {

      completed =
        (
          state.mode === "33" &&
          state.value === 33
        ) ||
        (
          state.mode === "99" &&
          state.value === 99
        );

    }


    // ========================================
    // YAKUNIY ANIMATSIYA
    // ========================================

    if (completed) {

      if (
        typeof TasbehAnimation !== "undefined" &&
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


    // ========================================
    // SERVER
    // ========================================

    try {

      const result =
        await API.post(
          "/tasbeh/increment",
          {
            mode: state.mode,

            zikr_id:
              state.zikr
                ? state.zikr.id
                : null
          }
        );


      if (result) {

        state.todayCount =
          result.today_count ??
          state.todayCount;


        state.weekCount =
          result.week_count ??
          state.weekCount;


        state.dailyGoal =
          result.daily_goal ??
          state.dailyGoal;

      }


      updateStatsUI();


    } catch (error) {

      console.error(
        "Tasbeh API xatosi:",
        error
      );

    }


    // ========================================
    // 33 / 99 TUGAGACH:
    // 0 BO'LADI VA KEYINGI ZIKRGA O'TADI
    // ========================================

    if (
      completed &&
      (
        state.mode === "33" ||
        state.mode === "99"
      )
    ) {

      setTimeout(
        () => {

          // 0 ga qaytarish
          state.value = 0;


          // Keyingi zikr
          nextZikr();


          // UI yangilash
          updateStatsUI();


          updateCountUI(
            document.getElementById(
              "page-root"
            )
          );

        },
        500
      );

    }

  }


  // ==========================================
  // DAILY GOAL
  // ==========================================

  function openGoalModal() {

    if (
      typeof Modal === "undefined" ||
      !Modal.open
    ) {

      return;

    }


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


    if (!saveGoalBtn) return;


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

          if (
            typeof Toast !== "undefined" &&
            Toast.show
          ) {

            Toast.show(
              "Noto'g'ri qiymat"
            );

          }

          return;

        }


        try {

          let updated;


          if (
            typeof Loader !== "undefined" &&
            Loader.wrap
          ) {

            updated =
              await Loader.wrap(
                API.post(
                  "/users/me/daily-goal",
                  {
                    daily_goal: value
                  }
                )
              );

          } else {

            updated =
              await API.post(
                "/users/me/daily-goal",
                {
                  daily_goal: value
                }
              );

          }


          state.dailyGoal =
            updated.daily_goal ||
            value;


          updateStatsUI();


          Modal.close();


          if (
            typeof Toast !== "undefined" &&
            Toast.show
          ) {

            Toast.show(
              "Saqlandi"
            );

          }

        } catch (e) {

          console.error(
            "Maqsad xatosi:",
            e
          );


          if (
            typeof Toast !== "undefined" &&
            Toast.show
          ) {

            Toast.show(
              e.message ||
              "Xatolik yuz berdi"
            );

          }

        }

      }
    );

  }


  // ==========================================
  // PUBLIC
  // ==========================================

  return {
    render: render,
    onTap: onTap
  };

})();