// Injected into the Task List page for recording: draws a fake cursor and
// clicks through the items. Exposes window.runDemo().
(() => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

  const cursor = document.createElement("div");
  cursor.innerHTML = `
    <svg width="22" height="22" viewBox="0 0 24 24" style="display:block;overflow:visible">
      <path d="M5 3 L5 19.5 L9.3 15.4 L12.1 21.7 L14.9 20.5 L12.1 14.3 L17.8 14.3 Z"
        fill="#111" stroke="#fff" stroke-width="1.5" stroke-linejoin="round" />
    </svg>`;
  Object.assign(cursor.style, {
    position: "fixed",
    left: "-5px", // hotspot (5,3) of the arrow sits on the pointer position
    top: "-3px",
    zIndex: 9999,
    pointerEvents: "none",
    transformOrigin: "5px 3px",
    filter: "drop-shadow(0 1px 1.5px rgba(0,0,0,0.25))",
  });
  document.body.appendChild(cursor);

  let pos = { x: 500, y: 300 };
  let scale = 1;
  const render = () => {
    cursor.style.transform = `translate(${pos.x}px, ${pos.y}px) scale(${scale})`;
  };
  render();

  const frame = () => new Promise(requestAnimationFrame);

  async function moveTo(to) {
    const from = { ...pos };
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.hypot(dx, dy);
    const duration = Math.min(900, 380 + dist * 1.6);
    // Slight arc, like a real hand movement.
    const bend = Math.min(30, dist * 0.12);
    const nx = -dy / (dist || 1);
    const ny = dx / (dist || 1);

    const start = performance.now();
    for (;;) {
      await frame();
      const t = Math.min(1, (performance.now() - start) / duration);
      const e = easeInOut(t);
      const arc = Math.sin(Math.PI * e) * bend;
      pos = { x: from.x + dx * e + nx * arc, y: from.y + dy * e + ny * arc };
      render();
      if (t === 1) break;
    }
  }

  async function press() {
    scale = 0.86;
    render();
    await sleep(90);
    document.elementFromPoint(pos.x, pos.y)?.closest(".task")?.click();
    scale = 1;
    render();
  }

  const findTask = (text) =>
    [...document.querySelectorAll(".task")].find((b) => b.textContent.includes(text));

  // Aim at either the checkbox or somewhere on the label text.
  function point(text, part, along = 0.45) {
    const task = findTask(text);
    if (part === "check") {
      const r = task.querySelector(".task__check").getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }
    const r = task.querySelector(".task__text").getClientRects()[0];
    return { x: r.left + r.width * along, y: r.top + r.height / 2 };
  }

  async function clickTask(text, part, along) {
    await moveTo(point(text, part, along));
    await sleep(140);
    await press();
  }

  window.runDemo = async () => {
    await sleep(900);

    // Mark everything complete, in a mixed order.
    await clickTask("Water the plants", "label", 0.55);
    await sleep(1350);
    await clickTask("Book a dentist", "check");
    await sleep(1350);
    await clickTask("Walk the dog", "label", 0.4);
    await sleep(1600);

    // Mark two back as incomplete.
    await clickTask("Water the plants", "check");
    await sleep(1350);
    await clickTask("Book a dentist", "label", 0.35);
    await sleep(1200);

    // Ease the cursor away and hold on the final state.
    await moveTo({ x: pos.x + 150, y: pos.y + 70 });
    await sleep(1400);
  };
})();
