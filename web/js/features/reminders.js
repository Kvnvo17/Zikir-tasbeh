window.Reminders = (function () {
  async function fetchSettings() {
    return API.get("/reminders/me");
  }

  async function save(time, enabled) {
    return API.post("/reminders/me", { time, enabled });
  }

  function openModal(current, onSaved) {
    Modal.open(`
      <p class="section-title">Eslatma</p>
      <label style="font-size:12px;color:#8a90a3">Har kuni shu vaqtda eslatma</label>
      <input type="time" id="reminderTime" value="${current.time}" />
      <label style="display:flex;align-items:center;gap:8px;font-size:13px;margin-bottom:14px">
        <input type="checkbox" id="reminderEnabled" ${current.enabled ? "checked" : ""} style="width:auto;margin:0" />
        Eslatmalarni yoqish
      </label>
      <button class="btn block" id="saveReminderBtn">Saqlash</button>
    `);

    document.getElementById("saveReminderBtn").addEventListener("click", async () => {
      const time = document.getElementById("reminderTime").value;
      const enabled = document.getElementById("reminderEnabled").checked;
      try {
        const result = await Loader.wrap(save(time, enabled));
        Modal.close();
        Toast.show("Saqlandi");
        onSaved(result);
      } catch (e) {
        Toast.show(e.message);
      }
    });
  }

  return { fetchSettings, save, openModal };
})();
