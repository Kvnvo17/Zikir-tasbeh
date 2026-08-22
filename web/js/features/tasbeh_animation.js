window.TasbehAnimation = (function () {
  function pulse(buttonEl) {
    buttonEl.classList.remove("tasbeh-pop");
    void buttonEl.offsetWidth; // restart animation
    buttonEl.classList.add("tasbeh-pop");
  }

  function complete(buttonEl) {
    buttonEl.classList.remove("tasbeh-complete");
    void buttonEl.offsetWidth;
    buttonEl.classList.add("tasbeh-complete");
  }

  function setRing(ringFillEl, pct) {
    ringFillEl.style.setProperty("--pct", `${Math.max(0, Math.min(100, pct))}%`);
  }

  return { pulse, complete, setRing };
})();
