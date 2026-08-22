window.Toast = (function () {
  function show(message, duration = 2200) {
    const root = document.getElementById("toast-root");
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = message;
    root.appendChild(el);
    setTimeout(() => {
      el.style.transition = "opacity 0.25s ease";
      el.style.opacity = "0";
      setTimeout(() => el.remove(), 250);
    }, duration);
  }

  return { show };
})();
