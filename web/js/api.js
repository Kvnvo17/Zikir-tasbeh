window.API = (function () {
  const BASE = "/api";

  async function request(path, options = {}) {
    const headers = Object.assign(
      { "Content-Type": "application/json", "X-Telegram-Init-Data": TG.initData() },
      options.headers || {}
    );

    const res = await fetch(BASE + path, Object.assign({}, options, { headers }));

    if (!res.ok) {
      let detail = res.statusText;
      try {
        const body = await res.json();
        detail = body.detail || detail;
      } catch (e) {
        /* no json body */
      }
      throw new Error(detail || "So'rovda xatolik");
    }

    if (res.status === 204) return null;
    return res.json();
  }

  return {
    get: (path) => request(path, { method: "GET" }),
    post: (path, body) => request(path, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined }),
    patch: (path, body) => request(path, { method: "PATCH", body: body !== undefined ? JSON.stringify(body) : undefined }),
    del: (path) => request(path, { method: "DELETE" }),
  };
})();
