window.TasbehAnimation = (function () {

  function restartAnimation(element, className) {
    if (!element) return;

    element.classList.remove(className);

    // Animatsiyani qayta ishga tushirish
    void element.offsetWidth;

    element.classList.add(className);

    // Keyin klassni tozalash
    setTimeout(() => {
      element.classList.remove(className);
    }, 700);
  }

  // Har bir bosishda
  function pulse(buttonEl) {
    if (!buttonEl) return;

    restartAnimation(buttonEl, "tasbeh-tap");

    // Atrofida yumshoq halqa
    restartAnimation(buttonEl, "tasbeh-ring");
  }

  // 33 / 99 tugaganda
  function complete(buttonEl) {
    if (!buttonEl) return;

    restartAnimation(buttonEl, "tasbeh-complete");

    // Kuchliroq halqa
    restartAnimation(buttonEl, "tasbeh-success-ring");
  }

  // Progress
  function setRing(ringFillEl, pct) {
    if (!ringFillEl) return;

    const value = Math.max(
      0,
      Math.min(100, Number(pct) || 0)
    );

    ringFillEl.style.setProperty(
      "--pct",
      `${value}%`
    );
  }

  return {
    pulse,
    complete,
    setRing
  };

})();