window.ZikrSelector = (function () {
  async function openPicker(onSelect) {
    const zikrs = await Loader.wrap(API.get("/zikr"));
    const itemsHtml = zikrs
      .map(
        (z) => `<div class="profile-list-item" data-id="${z.id}">
          <span>${escapeHtml(z.text)}</span>
          <span class="chev">›</span>
        </div>`
      )
      .join("");

    Modal.open(`
      <p class="section-title">Zikr tanlash</p>
      ${itemsHtml || '<div class="empty-state">Zikrlar topilmadi</div>'}
    `);

    Modal.root.querySelectorAll("[data-id]").forEach((el) => {
      el.addEventListener("click", async () => {
        const id = parseInt(el.dataset.id, 10);
        try {
          await Loader.wrap(API.post("/zikr/select", { zikr_id: id }));
          Modal.close();
          const selected = zikrs.find((z) => z.id === id);
          onSelect(selected);
          TG.haptic("light");
        } catch (e) {
          Toast.show(e.message);
        }
      });
    });
  }

  function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str ?? "";
    return d.innerHTML;
  }

  return { openPicker };
})();
