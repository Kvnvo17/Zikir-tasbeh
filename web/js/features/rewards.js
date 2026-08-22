window.Rewards = (function () {
  async function fetchHelp() {
    return API.get("/rewards/help");
  }

  async function fetchActiveCampaign() {
    return API.get("/rewards/campaign/active");
  }

  function renderHelp(help) {
    if (!help.enabled) {
      return `<div class="empty-state">\u26A0\uFE0F Mukofot tizimi hali ishga tushmagan.</div>`;
    }

    const cards = help.cards
      .map(
        (c) => `<div class="reward-card-item">
          <div>
            <div class="num">${escapeHtml(c.card_number)}</div>
            <div style="font-size:12px;color:#8a90a3">${escapeHtml(c.holder_name)}${
          c.card_type ? " · " + escapeHtml(c.card_type) : ""
        }</div>
          </div>
          <button class="copy-btn" data-num="${escapeHtml(c.card_number)}">\u{1F4CB} Nusxa</button>
        </div>`
      )
      .join("");

    return `${cards}${help.warning ? `<div class="warning-box">${escapeHtml(help.warning)}</div>` : ""}`;
  }

  function bindCopyButtons(container) {
    container.querySelectorAll(".copy-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        navigator.clipboard.writeText(btn.dataset.num).then(() => {
          Toast.show("Nusxalandi!");
          TG.haptic("success");
        });
      });
    });
  }

  function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str ?? "";
    return d.innerHTML;
  }

  return { fetchHelp, fetchActiveCampaign, renderHelp, bindCopyButtons };
})();
