/* =============================================================================
   HUD — the system interface layer.

   Injected rather than hand-written into ten HTML files, so every page carries
   the identical instrument panel. Every value here is REAL: pointer position,
   scroll progress, wall-clock in the configured timezone, the actual renderer
   in use, the browser's own online flag and a measured frame rate. Nothing on
   this panel is invented, because inventing a metric on a portfolio that argues
   for measurement would be the single dumbest thing on the page.
   ============================================================================= */
import { $, $$, el }        from "./dom.js";
import { state, onTick, on } from "./state.js";
import { CONFIG }            from "../data/profile.js";

let refs = null, fpsAcc = 0, fpsFrames = 0;

export function initHUD() {
  /* absorb the old markup: its ids are re-created below */
  $$(".hud").forEach(n => n.remove());

  const bar = el("aside", { class: "sysbar", "aria-hidden": "true" }, `
    <div class="sysbar__l">
      <span class="rd"><i class="k">CRSR</i><b class="v" id="crsr">0.500 · 0.500</b></span>
      <span class="rd rd--sm"><i class="k">FPS</i><b class="v" id="sysFps">—</b></span>
    </div>
    <div class="sysbar__c">
      <span class="st" id="sysCore"><i class="dot"></i>CORE</span>
      <span class="st" id="sysNet"><i class="dot"></i>NET</span>
      <span class="st" id="sysRender"><i class="dot"></i>RENDER</span>
    </div>
    <div class="sysbar__r">
      <span class="rd"><i class="k">SCRL</i><b class="v" id="scrl">0.00</b><i class="k">%</i></span>
      <span class="track"><i class="fill" id="scrlFill"></i></span>
    </div>`);
  document.body.appendChild(bar);

  refs = {
    crsr: $("#crsr"), scrl: $("#scrl"), fill: $("#scrlFill"), fps: $("#sysFps"),
    core: $("#sysCore"), net: $("#sysNet"), render: $("#sysRender"),
  };

  setStatus("net", navigator.onLine ? "ok" : "down", navigator.onLine ? "NET" : "NET OFF");
  addEventListener("online",  () => setStatus("net", "ok", "NET"));
  addEventListener("offline", () => setStatus("net", "down", "NET OFF"));
  setStatus("core", "wait", "CORE");
  setStatus("render", "wait", "RENDER");

  on("scroll", () => paintScroll());
  paintScroll();

  onTick(dt => {
    if (refs.crsr && state.pointer.inside)
      refs.crsr.textContent = state.pointer.x.toFixed(3) + " · " + state.pointer.y.toFixed(3);

    fpsAcc += dt; fpsFrames++;
    if (fpsAcc >= 0.5) {
      const fps = Math.round(fpsFrames / fpsAcc);
      if (refs.fps) { refs.fps.textContent = String(fps).padStart(2, "0"); refs.fps.dataset.low = fps < 45 ? "1" : "0"; }
      fpsAcc = 0; fpsFrames = 0;
    }
  });

  initClock();
}

function paintScroll() {
  if (!refs) return;
  const pct = state.scroll.progress * 100;
  if (refs.scrl) refs.scrl.textContent = pct.toFixed(2);
  if (refs.fill) refs.fill.style.transform = `scaleX(${state.scroll.progress})`;
}

/** status: "ok" | "wait" | "down". Only called with values we can actually observe. */
export function setStatus(which, status, label) {
  const node = refs && refs[which];
  if (!node) return;
  node.dataset.s = status;
  if (label) node.lastChild.textContent = label;
}

/* --- the clock: real time, in the timezone the portfolio actually sits in --- */
function clockStr() {
  try { return new Date().toLocaleTimeString("en-GB", { hour12: false, timeZone: CONFIG.timezone }); }
  catch (e) { return new Date().toLocaleTimeString("en-GB", { hour12: false }); }
}
function initClock() {
  const paint = () => {
    const t = clockStr();
    $$("#clock, #cClock").forEach(n => n.textContent = t);
  };
  paint(); setInterval(paint, 1000);
}
