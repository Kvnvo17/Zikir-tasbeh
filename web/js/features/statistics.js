window.Statistics = (function () {
  async function fetchHistory(range) {
    return API.get(`/profile/history?range=${range}`);
  }

  function renderBarChart(points) {
    const max = Math.max(1, ...points.map((p) => p.count));
    return `<div class="history-chart">
      ${points
        .map(
          (p) => `<div class="history-bar-wrap">
            <div class="history-bar" style="height:${Math.max(4, (p.count / max) * 100)}%"></div>
            <div class="history-bar-label">${p.label}</div>
          </div>`
        )
        .join("")}
    </div>`;
  }

  return { fetchHistory, renderBarChart };
})();
