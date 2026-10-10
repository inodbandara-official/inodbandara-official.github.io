/* =============================================================================
   DOM — the three helpers the whole site is built out of.
   ============================================================================= */
export const $  = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** Set text (or HTML) on an element by id. No-ops when the id isn't on the page,
 *  which is how one bundle serves every page without a router. */
export const set = (id, val, html = false) => {
  const el = $("#" + id);
  if (!el) return;
  if (html) el.innerHTML = val; else el.textContent = val;
};

export const el = (tag, attrs = {}, html = "") => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v == null) continue;
    if (k === "class") n.className = v;
    else if (k === "style" && typeof v === "object") Object.assign(n.style, v);
    else n.setAttribute(k, v === true ? "" : v);
  }
  if (html) n.innerHTML = html;
  return n;
};

export const accent = t => (t || "").replace(/\*(.+?)\*/g, '<em>$1</em>');
export const clamp  = (v, a, b) => v < a ? a : v > b ? b : v;
export const lerp   = (a, b, t) => a + (b - a) * t;
/** Frame-rate independent damping. dt in seconds, k = "how fast" (higher = snappier). */
export const damp   = (a, b, k, dt) => lerp(a, b, 1 - Math.exp(-k * dt));
export const smooth  = t => t * t * (3 - 2 * t);
export const easeOut = t => 1 - Math.pow(1 - t, 3);
