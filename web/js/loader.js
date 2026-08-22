window.Loader = (function () {
  const root = document.getElementById("loader-root");
  let count = 0;

  function show() {
    count += 1;
    root.classList.remove("hidden");
  }

  function hide() {
    count = Math.max(0, count - 1);
    if (count === 0) root.classList.add("hidden");
  }

  async function wrap(promise) {
    show();
    try {
      return await promise;
    } finally {
      hide();
    }
  }

  return { show, hide, wrap };
})();
