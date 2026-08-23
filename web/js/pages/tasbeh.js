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

  const completed =
    Counter.isComplete(
      state.value,
      state.mode
    );


  if (completed) {

    // Eski yakuniy animatsiya
    TasbehAnimation.complete(
      btnEl
    );

    // Eski kuchli vibratsiya
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

      state.weekCount =
        result.week_count;

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
        if (
          state.zikr &&
          typeof state.zikr.next === "function"
        ) {

          state.zikr =
            state.zikr.next();

        }


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