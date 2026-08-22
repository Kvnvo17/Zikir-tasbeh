window.Counter = (function () {
  const MODE_TARGETS = { "33": 33, "99": 99, inf: null };

  function nextValue(current, mode) {
    const target = MODE_TARGETS[mode];
    if (!target) return current + 1; // infinite mode never resets
    const next = current + 1;
    return next > target ? 0 : next;
  }

  function isComplete(value, mode) {
    const target = MODE_TARGETS[mode];
    return !!target && value === target;
  }

  function progressPct(value, mode) {
    const target = MODE_TARGETS[mode];
    if (!target) return Math.min(100, (value % 100));
    return Math.round((value / target) * 100);
  }

  return { nextValue, isComplete, progressPct, MODE_TARGETS };
})();
