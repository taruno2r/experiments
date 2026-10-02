const list = document.querySelector(".task-list");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

// How long the check/uncheck visuals run before the item starts moving.
const SETTLE = 500;

const MOVE = { duration: 450, easing: "cubic-bezier(0.22, 1, 0.36, 1)" };

const moveTimers = new WeakMap();

// Remember each item's original slot so un-checking can put it back.
[...list.children].forEach((li, i) => {
  li.dataset.index = i;
});

const isDone = (li) => li.querySelector(".task").getAttribute("aria-checked") === "true";

// Completed item goes above any other completed items, or to the bottom.
function placeCompleted(li) {
  const firstDone = [...list.children].find((el) => el !== li && isDone(el));
  list.insertBefore(li, firstDone ?? null);
}

// Incomplete item goes back to its original slot among incomplete items.
function placeIncomplete(li) {
  const index = Number(li.dataset.index);
  const next = [...list.children].find(
    (el) => el !== li && (isDone(el) || Number(el.dataset.index) > index)
  );
  list.insertBefore(li, next ?? null);
}

// FLIP: measure, reorder, then animate every item from its old spot.
// The item being moved stays on top of the ones it slides past.
function reorder(mover, mutate, timing) {
  const items = [...list.children];
  const before = new Map(items.map((el) => [el, el.getBoundingClientRect().top]));

  items.forEach((el) => el.getAnimations().forEach((a) => a.cancel()));
  items.forEach((el) => (el.style.zIndex = ""));
  mutate();

  if (reducedMotion.matches) return;

  items.forEach((el) => {
    const dy = before.get(el) - el.getBoundingClientRect().top;
    if (!dy) return;
    if (el === mover) el.style.zIndex = 1;
    const anim = el.animate([{ transform: `translateY(${dy}px)` }, { transform: "none" }], timing);
    anim.onfinish = () => (el.style.zIndex = "");
  });
}

list.addEventListener("click", (event) => {
  const button = event.target.closest(".task");
  if (!button) return;

  const li = button.closest("li");
  const done = !isDone(li);
  button.setAttribute("aria-checked", String(done));

  clearTimeout(moveTimers.get(li));
  moveTimers.set(
    li,
    setTimeout(
      () => reorder(li, () => (done ? placeCompleted(li) : placeIncomplete(li)), MOVE),
      reducedMotion.matches ? 0 : SETTLE
    )
  );
});
