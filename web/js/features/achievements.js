window.Achievements = (function () {
  async function fetchAll() {
    return API.get("/profile/achievements");
  }

  function renderGrid(achievements) {
    return `<div class="achievements-grid">
      ${achievements
        .map(
          (a) => `<div class="achievement-item ${a.unlocked ? "unlocked" : ""}" title="${escapeHtml(a.title)}">
            ${a.icon}
          </div>`
        )
        .join("")}
    </div>`;
  }

  function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str ?? "";
    return d.innerHTML;
  }

  return { fetchAll, renderGrid };
})();
