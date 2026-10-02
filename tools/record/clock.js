// Injected before the page loads: replaces timers, rAF and performance.now with
// a manual clock, and drives CSS transitions / Web Animations from it, so the
// recorder can step the page exactly one video frame at a time.
(() => {
  const realSetTimeout = window.setTimeout.bind(window);
  const flush = () => new Promise((r) => realSetTimeout(r, 0));

  let now = 0;
  let nextId = 0;
  const timers = new Map();
  let rafs = [];

  window.setTimeout = (fn, ms = 0, ...args) => {
    const id = ++nextId;
    timers.set(id, { at: now + Math.max(0, Number(ms) || 0), fn, args });
    return id;
  };
  window.clearTimeout = (id) => timers.delete(id);
  window.requestAnimationFrame = (fn) => {
    const id = ++nextId;
    rafs.push({ id, fn });
    return id;
  };
  window.cancelAnimationFrame = (id) => {
    rafs = rafs.filter((r) => r.id !== id);
  };
  performance.now = () => now;

  // Each animation is paused on first sight and then seeked to the manual clock.
  const births = new WeakMap();
  function syncAnimations() {
    for (const anim of document.getAnimations()) {
      if (!births.has(anim)) {
        births.set(anim, now);
        anim.pause();
      }
      const t = now - births.get(anim);
      if (t >= anim.effect.getComputedTiming().endTime) anim.finish();
      else anim.currentTime = t;
    }
  }

  async function runDueTimers() {
    for (;;) {
      const due = [...timers].filter(([, t]) => t.at <= now).sort((a, b) => a[1].at - b[1].at);
      if (!due.length) return;
      for (const [id, t] of due) {
        timers.delete(id);
        t.fn(...t.args);
      }
      await flush();
    }
  }

  window.__clock = {
    async tick(dt) {
      now += dt;
      await runDueTimers();
      const callbacks = rafs;
      rafs = [];
      callbacks.forEach((r) => r.fn(now));
      await flush();
      await runDueTimers();
      syncAnimations();
    },
  };
})();
