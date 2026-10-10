/* =============================================================================
   CURSOR — a two-part instrument: a hard point that tracks exactly, and a ring
   that lags behind it and changes state over anything interactive. Small on
   purpose. A cursor that needs its own attention is a cursor that failed.
   ============================================================================= */
import { $, el, damp }      from "./dom.js";
import { state, onTick }    from "./state.js";
import { MOTION }           from "./tokens.js";

const HOT = "[data-cursor],a,button,input,textarea,select,summary,.project__head,.portrait,.node-hit";

export function initCursor() {
  if (state.pointer.coarse) {                      // touch: no cursor layer at all
    $("#cursor")?.remove(); $("#cursorRing")?.remove();
    return;
  }
  let dot  = $("#cursor")     || document.body.appendChild(el("div", { class: "cursor",      id: "cursor"     }));
  let ring = $("#cursorRing") || document.body.appendChild(el("div", { class: "cursor-ring", id: "cursorRing" }));
  ring.innerHTML = '<i class="cr-arc"></i><i class="cr-tag"></i>';
  const tag = ring.querySelector(".cr-tag");

  let rx = state.view.w / 2, ry = state.view.h / 2;

  onTick(dt => {
    const p = state.pointer;
    dot.style.transform = `translate3d(${p.px}px,${p.py}px,0) translate(-50%,-50%)`;
    /* the ring trails — damped, never snapping */
    rx = damp(rx, p.px, 14, dt); ry = damp(ry, p.py, 14, dt);
    ring.style.transform = `translate3d(${rx}px,${ry}px,0) translate(-50%,-50%)`;
  });

  /* magnetic pull: buttons and links tug the ring a few pixels toward centre */
  let magnet = null;
  document.addEventListener("pointerover", e => {
    const hit = e.target.closest(HOT);
    if (!hit) return;
    ring.classList.add("hover");
    magnet = hit;
    const label = hit.dataset?.cursorLabel;
    ring.classList.toggle("labelled", !!label);
    if (tag) tag.textContent = label || "";
  });
  document.addEventListener("pointerout", e => {
    if (!e.target.closest(HOT)) return;
    ring.classList.remove("hover", "labelled"); magnet = null;
  });
  addEventListener("pointerdown", () => ring.classList.add("down"));
  addEventListener("pointerup",   () => ring.classList.remove("down"));

  /* scene hover state — set by the WebGL layer when the pointer is over a node */
  return {
    setState(name) { ring.dataset.state = name || ""; },
    label(text)    { ring.classList.toggle("labelled", !!text); if (tag) tag.textContent = text || ""; },
  };
}
