window.Modal = (function () {
  const root = document.getElementById("modal-root");

  function open(innerHtml) {
    root.innerHTML = `<div class="modal-sheet">${innerHtml}</div>`;
    root.classList.add("open");
    root.onclick = (e) => {
      if (e.target === root) close();
    };
  }

  function close() {
    root.classList.remove("open");
    root.innerHTML = "";
  }

  return { open, close, root };
})();
