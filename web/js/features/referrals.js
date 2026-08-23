window.Referrals = (function () {

  async function fetchInfo() {
    return API.get("/referrals/me");
  }

  function openModal(info) {
    Modal.open(`
      <p class="section-title">Do'stlarni taklif qilish</p>

      <div class="referral-link-box">
        <span id="refLinkText">${info.link}</span>
      </div>

      <button class="btn block" id="copyRefBtn">📋 Nusxa olish</button>
      <button class="btn block" style="margin-top:8px" id="shareRefBtn">📤 Ulashish</button>

      <p style="font-size:12px;color:#8a90a3;margin-top:12px">
        Taklif qilingan do'stlar: <b>${info.invited_count}</b>
      </p>
    `);

    document.getElementById("copyRefBtn").onclick = () => {
      navigator.clipboard.writeText(info.link);
      Toast.show("Nusxalandi!");
    };

    document.getElementById("shareRefBtn").onclick = () => {
      if (navigator.share) {
        navigator.share({
          title: "Zikr Bog‘i",
          text: "📿 Zikr Bog‘iga qo‘shiling!",
          url: info.link
        });
      } else {
        window.open(`https://t.me/share/url?url=${encodeURIComponent(info.link)}`);
      }
    };
  }

  return { fetchInfo, openModal };

})();
