window.RatingPage = (function () {
  let currentTab = "daily";
  let currentSubTab = "top"; // top | reward

  async function render(root) {
    root = root || document.getElementById("page-root");
    root.innerHTML = `<div class="theme-rating animate-in">
      <div class="rating-tabs">
        <button class="rating-tab" data-tab="daily">Kunlik</button>
        <button class="rating-tab" data-tab="weekly">Haftalik</button>
        <button class="rating-tab" data-tab="alltime">Umumiy</button>
      </div>

      <div class="rating-tabs" style="margin-bottom:16px">
        <button class="rating-tab" data-subtab="top">\u{1F3C6} Reyting</button>
        <button class="rating-tab" data-subtab="reward">\u{1F381} Mukofot</button>
      </div>

      <div id="ratingContent"></div>
    </div>`;

    root.querySelectorAll("[data-tab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        currentTab = btn.dataset.tab;
        TG.haptic("light");
        renderActiveSection(root);
      });
    });

    root.querySelectorAll("[data-subtab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        currentSubTab = btn.dataset.subtab;
        TG.haptic("light");
        renderActiveSection(root);
      });
    });

    updateTabUI(root);
    await renderActiveSection(root);
  }

  function updateTabUI(root) {
    root.querySelectorAll("[data-tab]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === currentTab);
    });
    root.querySelectorAll("[data-subtab]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.subtab === currentSubTab);
    });
  }

  async function renderActiveSection(root) {
    updateTabUI(root);
    const content = document.getElementById("ratingContent");
    content.innerHTML = `<div class="empty-state">Yuklanmoqda...</div>`;

    if (currentSubTab === "top") {
      await renderTopRating(content);
    } else {
      await renderRewardSection(content);
    }
  }

  async function renderTopRating(content) {
    try {
      const data = await API.get(`/rating?period=${currentTab}`);
      const rows = data.top
        .map((r) => rowHtml(r))
        .join("");

      const meHtml =
        data.me && !data.top.some((r) => r.is_me)
          ? `<div style="margin-top:8px">${rowHtml(data.me)}</div>`
          : "";

      content.innerHTML = `<div class="glass-card">${rows || '<div class="empty-state">Hozircha ma\'lumot yo\'q</div>'}</div>${meHtml}`;
    } catch (e) {
      content.innerHTML = `<div class="empty-state">${e.message}</div>`;
    }
  }

  function rowHtml(r) {
    const rankClass = r.rank === 1 ? "top1" : r.rank === 2 ? "top2" : r.rank === 3 ? "top3" : "";
    const initial = (r.first_name || "?").charAt(0).toUpperCase();
    return `<div class="rating-row ${r.is_me ? "me" : ""}">
      <div class="rating-rank ${rankClass}">${r.rank}</div>
      <div class="rating-avatar">${r.photo_url ? `<img src="${r.photo_url}" />` : initial}</div>
      <div class="rating-name">${escapeHtml(r.first_name)}</div>
      <div class="rating-count">${r.count}</div>
    </div>`;
  }

  async function renderRewardSection(content) {
    try {
      const [campaign, help] = await Promise.all([
        API.get("/rewards/campaign/active"),
        API.get("/rewards/help"),
      ]);

      let campaignHtml = `<div class="empty-state">Hozircha faol mukofot kampaniyasi yo'q</div>`;
      if (campaign) {
        campaignHtml = `<div class="glass-card" style="margin-bottom:14px">
          <p class="section-title">\u{1F381} Haftalik mukofot</p>
          <p style="font-size:14px;font-weight:600;margin:0 0 4px">${escapeHtml(campaign.title)}</p>
          ${campaign.description ? `<p style="font-size:12.5px;color:#c3bfe0;margin:0 0 8px">${escapeHtml(campaign.description)}</p>` : ""}
          ${campaign.prize_breakdown ? `<pre style="white-space:pre-wrap;font-family:inherit;font-size:12.5px;color:#e0dcf5;margin:0">${escapeHtml(campaign.prize_breakdown)}</pre>` : ""}
          <p style="font-size:11px;color:#9a94bd;margin-top:8px">${campaign.start_date} \u2192 ${campaign.end_date}</p>
        </div>`;
      }

      content.innerHTML = `${campaignHtml}<div class="glass-card"><p class="section-title">Mukofot uchun yordam</p>${Rewards.renderHelp(help)}</div>`;
      Rewards.bindCopyButtons(content);
    } catch (e) {
      content.innerHTML = `<div class="empty-state">${e.message}</div>`;
    }
  }

  function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str ?? "";
    return d.innerHTML;
  }

  return { render };
})();
