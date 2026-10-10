/* =============================================================================
   SCRIM — the environment is the subject in the hero and the setting everywhere
   else. This ramps a single fixed layer between the two as you descend.

   Without it the 3D world competes with body copy for the same pixels, and the
   copy loses. With it the system stays visible behind everything, and the
   moment you start reading it steps back. One element, one opacity, no blur.
   ============================================================================= */
import { el, clamp, smooth } from "./dom.js";
import { state, onTick }     from "./state.js";

/* home leads with the environment; every other page opens straight into copy,
   so it starts partly settled and never goes fully clear */
const RAMP = {
  home:  { from: 0.03, to: 0.20, min: 0.00, max: 0.74 },
  inner: { from: 0.00, to: 0.12, min: 0.46, max: 0.82 },
};

export function initScrim(page) {
  const node = el("div", { class: "scrim", "aria-hidden": "true" });
  document.body.appendChild(node);

  const r = page === "home" ? RAMP.home : RAMP.inner;
  let cur = r.min;

  onTick(() => {
    const p = state.scroll.progress;
    const t = smooth(clamp((p - r.from) / Math.max(1e-4, r.to - r.from), 0, 1));
    const want = r.min + (r.max - r.min) * t;
    if (Math.abs(want - cur) < 0.002) return;
    cur = want;
    node.style.opacity = cur.toFixed(3);
  });

  node.style.opacity = String(r.min);
  return node;
}
