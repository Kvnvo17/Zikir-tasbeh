window.TasbehAnimation = (function () {

  function setRing(el, pct) {
    if (!el) return;

    const parent = el.parentElement;

    if (parent) {
      parent.style.setProperty(
        "--progress",
        Math.max(0, Math.min(100, pct)) + "%"
      );
    }
  }

  function pulse(btn) {
    if (!btn) return;

    btn.classList.remove("tasbeh-pulse");

    // Animatsiyani qayta ishga tushirish
    void btn.offsetWidth;

    btn.classList.add("tasbeh-pulse");

    setTimeout(() => {
      btn.classList.remove("tasbeh-pulse");
    }, 180);
  }

  function complete(btn) {
    if (!btn) return;

    btn.classList.remove("tasbeh-complete");

    void btn.offsetWidth;

    btn.classList.add("tasbeh-complete");

    setTimeout(() => {
      btn.classList.remove("tasbeh-complete");
    }, 600);
  }

  return {
    setRing,
    pulse,
    complete
  };

})();