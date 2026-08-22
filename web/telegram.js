// Thin wrapper around the Telegram WebApp SDK.
window.TG = (function () {
  const webapp = window.Telegram ? window.Telegram.WebApp : null;

  function init() {
    if (!webapp) return;
    webapp.ready();
    webapp.expand();
    try {
      webapp.setHeaderColor("#0b0d12");
      webapp.setBackgroundColor("#0b0d12");
    } catch (e) {
      /* older clients may not support this */
    }
  }

  function initData() {
    return webapp ? webapp.initData || "" : "";
  }

  function user() {
    return webapp && webapp.initDataUnsafe ? webapp.initDataUnsafe.user : null;
  }

  function haptic(style) {
    if (!webapp || !webapp.HapticFeedback) return;
    try {
      if (style === "success" || style === "warning" || style === "error") {
        webapp.HapticFeedback.notificationOccurred(style);
      } else {
        webapp.HapticFeedback.impactOccurred(style || "light");
      }
    } catch (e) {
      /* ignore */
    }
  }

  function close() {
    if (webapp) webapp.close();
  }

  return { init, initData, user, haptic, close, raw: webapp };
})();
