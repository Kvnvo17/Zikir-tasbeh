window.ZikrAddPage = (function () {
  async function render(root) {
    root = root || document.getElementById("page-root");
    root.innerHTML = `<div class="theme-zikr-add animate-in">
      <button class="rules-btn" id="rulesBtn">\u{1F4DC} Zikr qo'shish qoidalari</button>

      <div class="glass-card" style="margin-bottom:16px">
        <p class="section-title">Zikr qo'shing</p>
        <textarea class="zikr-textarea" id="zikrInput" placeholder="Zikr yoki duo matnini kiriting..."></textarea>
        <button class="btn block accent-zikr-bg" id="submitZikrBtn">\u{1F4E4} Yuborish</button>
      </div>

      <div class="glass-card" style="margin-bottom:16px">
        <p class="section-title">\u{1F3C6} Zikr qo'shganlar reytingi</p>
        <div id="submittersList"><div class="empty-state">Yuklanmoqda...</div></div>
      </div>

      <div class="glass-card">
        <p class="section-title">\u{1F4CB} Men qo'shgan zikrlarim</p>
        <div id="mySubmissionsList"><div class="empty-state">Yuklanmoqda...</div></div>
      </div>
    </div>`;

    document.getElementById("rulesBtn").addEventListener("click", showRules);
    document.getElementById("submitZikrBtn").addEventListener("click", submitZikr);

    await Promise.all([loadSubmitters(), loadMySubmissions()]);
  }

  async function showRules() {
    let rulesText = "Qoidalar hali qo'shilmagan.";
    try {
      const data = await API.get("/zikr/rules");
      rulesText = data.text;
    } catch (e) {
      /* fall back to default text above */
    }
    Modal.open(`
      <p class="section-title">Zikr qo'shish qoidalari</p>
      <p style="font-size:13.5px;line-height:1.6;color:#dfe2ee">${escapeHtml(rulesText)}</p>
    `);
  }

  async function submitZikr() {
    const input = document.getElementById("zikrInput");
    const text = input.value.trim();
    if (text.length < 2) {
      Toast.show("Iltimos, zikr matnini kiriting");
      return;
    }
    try {
      await Loader.wrap(API.post("/zikr/submit", { text }));
      input.value = "";
      Toast.show("Yuborildi! Admin ko'rib chiqadi.");
      TG.haptic("success");
      await loadMySubmissions();
    } catch (e) {
      Toast.show(e.message);
    }
  }

  async function loadSubmitters() {
    const el = document.getElementById("submittersList");
    try {
      const rows = await API.get("/rating/zikr-submitters");
      if (!rows.length) {
        el.innerHTML = `<div class="empty-state">Hozircha ma'lumot yo'q</div>`;
        return;
      }
      el.innerHTML = rows
        .map(
          (r, i) => `<div class="submitters-row">
            <span>${i + 1}. ${escapeHtml(r.first_name)}</span>
            <span style="color:#5b9dff;font-weight:700">${r.approved_count}</span>
          </div>`
        )
        .join("");
    } catch (e) {
      el.innerHTML = `<div class="empty-state">${e.message}</div>`;
    }
  }

  async function loadMySubmissions() {
    const el = document.getElementById("mySubmissionsList");
    try {
      const rows = await API.get("/zikr/submissions/mine");
      if (!rows.length) {
        el.innerHTML = `<div class="empty-state">Siz hali zikr yubormagansiz</div>`;
        return;
      }
      el.innerHTML = rows
        .map(
          (s) => `<div class="submission-item">
            <div class="text">${escapeHtml(s.original_text)}</div>
            <span class="badge ${s.status}">${statusLabel(s.status)}</span>
            ${s.final_text && s.status === "approved" ? `<div class="final">Yakuniy: ${escapeHtml(s.final_text)}</div>` : ""}
          </div>`
        )
        .join("");
    } catch (e) {
      el.innerHTML = `<div class="empty-state">${e.message}</div>`;
    }
  }

  function statusLabel(status) {
    return { pending: "\u{1F7E1} Kutilmoqda", approved: "\u{1F7E2} Tasdiqlangan", rejected: "\u{1F534} Rad etilgan" }[status] || status;
  }

  function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str ?? "";
    return d.innerHTML;
  }

  return { render };
})();
