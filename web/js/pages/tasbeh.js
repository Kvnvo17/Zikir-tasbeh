async function onTap(btnEl) {

  // ========================================
  // HOZIRGI QIYMATNI SAQLASH
  // ========================================

  const oldValue = state.value;


  // ========================================
  // 33 / 99 MAQSAD
  // ========================================

  let target = null;

  if (state.mode === "33") {
    target = 33;
  }

  if (state.mode === "99") {
    target = 99;
  }


  // ========================================
  // OXIRGI SONMI?
  // ========================================

  const completed =
    target !== null &&
    oldValue === target - 1;


  // ========================================
  // KEYINGI SON
  // ========================================

  if (completed) {

    // 33 yoki 99 tugadi
    state.value = 0;

  } else {

    state.value =
      Counter.nextValue(
        state.value,
        state.mode
      );

  }


  // ========================================
  // YUMSHOQ ANIMATSIYA
  // ========================================

  TasbehAnimation.pulse(
    btnEl
  );


  // ========================================
  // VIBRATSIYA
  // ========================================

  TG.haptic("light");


  // ========================================
  // SONNI YANGILASH
  // ========================================

  updateCountUI(
    document.getElementById(
      "page-root"
    )
  );


  // ========================================
  // 33 / 99 YAKUNLANGANDA
  // ========================================

  if (completed) {

    // Yakuniy animatsiya
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

    })

    .catch((error) => {

      console.error(
        "Tasbeh API xatosi:",
        error
      );

    });


  // ========================================
  // FAQAT 33 VA 99 REJIMIDA
  // KEYINGI ZIKRGA O'TISH
  // ========================================

  if (
    completed &&
    (
      state.mode === "33" ||
      state.mode === "99"
    )
  ) {

    setTimeout(
      async () => {

        try {

          // Barcha zikrlarni olamiz
          const zikrs =
            await API.get(
              "/zikr"
            );


          // Zikrlar mavjudligini tekshiramiz
          if (
            !Array.isArray(zikrs) ||
            zikrs.length === 0
          ) {

            console.warn(
              "Zikrlar topilmadi"
            );

            return;

          }


          // ==================================
          // HOZIRGI ZIKRNI TOPISH
          // ==================================

          const currentIndex =
            zikrs.findIndex(
              (z) =>
                state.zikr &&
                z.id === state.zikr.id
            );


          // ==================================
          // KEYINGI ZIKR INDEXI
          // ==================================

          let nextIndex = 0;


          if (
            currentIndex >= 0
          ) {

            nextIndex =
              (
                currentIndex + 1
              ) %
              zikrs.length;

          }


          // ==================================
          // KEYINGI ZIKR
          // ==================================

          state.zikr =
            zikrs[nextIndex];


          // ==================================
          // HISOBNI 0 QILISH
          // ==================================

          state.value = 0;


          // ==================================
          // UI YANGILASH
          // ==================================

          updateStatsUI();

          updateCountUI(
            document.getElementById(
              "page-root"
            )
          );


          // ==================================
          // VIBRATSIYA
          // ==================================

          TG.haptic(
            "success"
          );


          // ==================================
          // TOAST
          // ==================================

          if (
            typeof Toast !==
            "undefined"
          ) {

            Toast.show(
              `Keyingi zikr: ${state.zikr.text}`
            );

          }

        } catch (error) {

          console.error(
            "Keyingi zikrni almashtirishda xatolik:",
            error
          );

        }

      },
      500
    );

  }

}