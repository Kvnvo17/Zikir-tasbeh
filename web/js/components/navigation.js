window.Navigation = (function () {
  const PAGES = {
    tasbeh: () => window.TasbehPage.render(),
    rating: () => window.RatingPage.render(),
    zikr_add: () => window.ZikrAddPage.render(),
    profile: () => window.ProfilePage.render(),
  };

  let current = "tasbeh";

  function go(page) {
    if (!PAGES[page]) return;
    current = page;

    document.querySelectorAll(".nav-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.page === page);
    });

    const root = document.getElementById("page-root");
    root.innerHTML = "";
    PAGES[page](root);
  }

  function init() {
    document.querySelectorAll(".nav-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        TG.haptic("light");
        go(btn.dataset.page);
      });
    });
    go("tasbeh");
  }

  return { init, go, get current() { return current; } };
})();
