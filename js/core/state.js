/* =============================================================================
   SYSTEM STATE — one shared, mutable telemetry object.
   The HUD, the cursor, the navigation and the WebGL scene all read from this.
   Exactly one scroll listener, one pointer listener and one rAF clock exist on
   the page; everything else subscribes. Keeps re-renders and listeners at zero.
   ============================================================================= */
import { clamp } from "./dom.js";

export const state = {
  pointer: {
    x: 0.5, y: 0.5,        // normalised 0..1 viewport position
    nx: 0,  ny: 0,         // normalised -1..1, y up
    sx: 0,  sy: 0,         // damped (smoothed) copy of nx/ny
    px: 0,  py: 0,         // raw pixels
    inside: false, coarse: false,
  },
  scroll:  { y: 0, max: 1, progress: 0, velocity: 0 },
  view:    { w: 1, h: 1, aspect: 1, dpr: 1, mobile: false, small: false },
  clock:   { t: 0, dt: 0.016, frames: 0 },
  flags:   { reduced: false, webgl: true, booted: false, hidden: false },
  focus:   { section: "top", index: 0, hover: null },
};

const subs = new Set();
/** Subscribe to the shared rAF tick. Returns an unsubscribe function. */
export const onTick = fn => { subs.add(fn); return () => subs.delete(fn); };

const evt = new Map();
export const on = (name, fn) => {
  if (!evt.has(name)) evt.set(name, new Set());
  evt.get(name).add(fn);
  return () => evt.get(name).delete(fn);
};
export const emit = (name, payload) => {
  const s = evt.get(name); if (!s) return;
  for (const fn of s) fn(payload);
};

function measure() {
  const v = state.view;
  v.w = window.innerWidth; v.h = window.innerHeight;
  v.aspect = v.w / Math.max(1, v.h);
  v.dpr = window.devicePixelRatio || 1;
  v.mobile = v.w < 900;
  v.small  = v.w < 560;
}

function readScroll() {
  const s = state.scroll;
  const y = window.scrollY || 0;
  s.velocity = y - s.y;
  s.y = y;
  s.max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  s.progress = clamp(y / s.max, 0, 1);
}

export function initState() {
  state.flags.reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  state.pointer.coarse = !matchMedia("(hover:hover) and (pointer:fine)").matches;
  measure(); readScroll();

  addEventListener("resize", () => { measure(); readScroll(); emit("resize", state.view); }, { passive: true });
  addEventListener("scroll", () => { readScroll(); emit("scroll", state.scroll); }, { passive: true });

  addEventListener("pointermove", e => {
    const p = state.pointer;
    p.px = e.clientX; p.py = e.clientY;
    p.x = e.clientX / state.view.w; p.y = e.clientY / state.view.h;
    p.nx = p.x * 2 - 1; p.ny = -(p.y * 2 - 1);
    p.inside = true;
    emit("pointer", p);
  }, { passive: true });
  addEventListener("pointerleave", () => { state.pointer.inside = false; }, { passive: true });

  document.addEventListener("visibilitychange", () => {
    state.flags.hidden = document.hidden;
  });

  /* the one clock */
  let last = performance.now();
  (function loop(now) {
    requestAnimationFrame(loop);
    const c = state.clock;
    c.dt = Math.min(0.05, (now - last) / 1000);   // clamp: tab-switch shouldn't teleport the world
    c.t += c.dt; c.frames++;
    last = now;
    if (state.flags.hidden) return;
    /* one damped copy of the pointer, shared by everything that needs a lazy
       version of it — the camera, the backdrop, the parallax layers */
    const p = state.pointer, k = 1 - Math.exp(-3.2 * c.dt);
    p.sx += (p.nx - p.sx) * k;
    p.sy += (p.ny - p.sy) * k;
    for (const fn of subs) fn(c.dt, c.t);
  })(last);
}
