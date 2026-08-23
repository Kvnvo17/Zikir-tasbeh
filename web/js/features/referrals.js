window.Referrals = (function () {

  async function fetchInfo() {
    const info = await API.get("/referrals/me");

    // your_bot ni ZikrBogiBot ga almashtirish
    if (info && info.link) {
      info.link = info.link.replace(
        "https://t.me/ZikrBogiBot"
      );
    }

    return info;
  }

  function openModal(info) {
    Modal.open(`
      <p class="section-title">Do'stlarni taklif qilish</p>

      <div class="referral-link-box">
        <span id="refLinkText">${info.link}</span>
      </div>

      <button class="btn block" style="margin-top:12px" id="copyRefBtn">
        📋 Nusxa olish
      </button>

      <p style="font-size:12px;color:#8a90a3;margin-top:12px">
        Taklif qilingan do'stlar: <b>${info.invited_count}</b>
      </p>
    `);

    document.getElementById("copyRefBtn").addEventListener("click", () => {
      navigator.clipboard.writeText(info.link).then(() => {
        Toast.show("Nusxalandi!");
        TG.haptic("success");
      });
    });
  }

  return {
    fetchInfo,
    openModal
  };

})();
