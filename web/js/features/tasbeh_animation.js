window.TasbehAnimation = (function () {

  function pulse(buttonEl) {
    if (!buttonEl) return;

    buttonEl.classList.remove(
      "tasbeh-pop",
      "pulse"
    );

    void buttonEl.offsetWidth;

    buttonEl.classList.add("tasbeh-pop");
    buttonEl.classList.add("pulse");

    setTimeout(() => {
      buttonEl.classList.remove(
        "tasbeh-pop",
        "pulse"
      );
    }, 300);
  }


  function complete(buttonEl) {
    if (!buttonEl) return;

    buttonEl.classList.remove(
      "tasbeh-complete",
      "bead"
    );

    void buttonEl.offsetWidth;

    buttonEl.classList.add("tasbeh-complete");
    buttonEl.classList.add("bead");

    setTimeout(() => {
      buttonEl.classList.remove(
        "tasbeh-complete",
        "bead"
      );
    }, 750);
  }


  function setRing(ringFillEl, pct) {
    if (!ringFillEl) return;

    const value = Math.max(
      0,
      Math.min(100, Number(pct) || 0)
    );

    /*
      CSS uchun progress
    */
    ringFillEl.style.setProperty(
      "--pct",
      `${value}%`
    );

    /*
      Eski CSS bilan ham mos ishlashi uchun
    */
    ringFillEl.style.setProperty(
      "--progress",
      `${value}%`
    );

    ringFillEl.style.width =
      `${value}%`;

    /*
      Parent ring uchun ham
    */
    const ring =
      ringFillEl.parentElement;

    if (ring) {
      ring.style.setProperty(
        "--pct",
        `${value}%`
      );

      ring.style.setProperty(
        "--progress",
        `${value}%`
      );

      ring.style.setProperty(
        "--tasbeh-progress",
        `${value * 3.6}deg`
      );
    }
  }


  return {
    pulse,
    complete,
    setRing
  };

})();