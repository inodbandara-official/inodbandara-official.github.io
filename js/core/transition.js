/* =============================================================================
   PAGE HANDOFF — the site is one system, so moving between pages should not
   look like tearing one document down and building another.

   Real links, real URLs, real history. We just hold the frame for ~380ms while
   the environment collapses toward the destination, then let the browser
   navigate. Modifier-clicks, new tabs, downloads and external hosts are never
   intercepted, and with reduced motion the whole thing is skipped.
   ============================================================================= */
import { el }         from "./dom.js";
import { state, emit } from "./state.js";

const OUT_MS = 380;

export function initTransition() {
  const veil = el("div", { class: "veil", "aria-hidden": "true" },
    '<i class="veil__scan"></i><span class="veil__tag">SYS<b>://</b><em></em></span>');
  document.body.appendChild(veil);
  const tag = veil.querySelector("em");

  /* arriving */
  requestAnimationFrame(() => document.body.classList.add("page-in"));

  /* coming back through history: the veil must not still be up */
  addEventListener("pageshow", e => { if (e.persisted) veil.classList.remove("out"); });

  if (state.flags.reduced) return;

  document.addEventListener("click", e => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest("a[href]");
    if (!a) return;
    if (a.target && a.target !== "_self") return;
    if (a.hasAttribute("download") || a.dataset.noTransition != null) return;

    let url;
    try { url = new URL(a.href, location.href); } catch (err) { return; }
    if (url.origin !== location.origin) return;
    if (url.protocol !== "http:" && url.protocol !== "https:") return;
    /* in-page anchors scroll; they don't tear the page down */
    if (url.pathname === location.pathname && url.hash) return;
    if (url.href === location.href) return;

    e.preventDefault();
    tag.textContent = (url.pathname.replace(/\/$/, "").split("/").pop() || "HOME").toUpperCase();
    veil.classList.add("out");
    emit("handoff", { to: url.pathname });
    setTimeout(() => { location.href = url.href; }, OUT_MS);
  });
}
