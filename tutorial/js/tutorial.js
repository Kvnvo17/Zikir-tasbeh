(function () {
  const slides = document.querySelectorAll(".slide");
  const dotsRoot = document.getElementById("dots");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  let index = 0;

  slides.forEach((_, i) => {
    const dot = document.createElement("div");
    dot.className = "dot" + (i === 0 ? " active" : "");
    dotsRoot.appendChild(dot);
  });

  function render() {
    slides.forEach((s, i) => s.classList.toggle("active", i === index));
    dotsRoot.querySelectorAll(".dot").forEach((d, i) => d.classList.toggle("active", i === index));
    prevBtn.style.visibility = index === 0 ? "hidden" : "visible";
    nextBtn.textContent = index === slides.length - 1 ? "Tugatish" : "Keyingisi";
  }

  prevBtn.addEventListener("click", () => {
    if (index > 0) {
      index -= 1;
      render();
    }
  });

  nextBtn.addEventListener("click", () => {
    if (index < slides.length - 1) {
      index += 1;
      render();
    } else if (window.Telegram && window.Telegram.WebApp) {
      window.Telegram.WebApp.close();
    }
  });

  if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.ready();
    window.Telegram.WebApp.expand();
  }

  render();
})();
