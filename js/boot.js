/* =============================================================================
   BOOT — the entry point for every page.

   Order matters: state and theme come up before anything paints, the pages
   render their content, the interface layer attaches, and only then does the
   3D environment get loaded — asynchronously, so the readable site is never
   waiting on the renderer.
   ============================================================================= */
import { $, $$ }            from "./core/dom.js";
import { initState, state } from "./core/state.js";
import { initTheme }        from "./core/theme.js";
import { renderAll }        from "./render/pages.js";
import { initReveal }       from "./core/reveal.js";
import { initHUD }          from "./core/hud.js";
import { initNav }          from "./core/nav.js";
import { initCursor }       from "./core/cursor.js";
import { initTransition }   from "./core/transition.js";
import { initTerminal }     from "./core/terminal.js";
import { initInteractions } from "./core/interactions.js";
import { initScrim }        from "./core/scrim.js";
import { detectPage }       from "./scene/profiles.js";

/* Cosmetic clean URLs: GitHub Pages serves /contact for contact.html, so strip
   any stray ".html" from the address bar without reloading. */
(function cleanURL() {
  try {
    let p = location.pathname;
    if (/\/index\.html$/.test(p)) p = p.replace(/index\.html$/, "");
    else if (/\.html$/.test(p))   p = p.replace(/\.html$/, "");
    if (p !== location.pathname) history.replaceState(null, "", p + location.search + location.hash);
  } catch (e) { /* file:// and sandboxed frames throw here; harmless */ }
})();

initState();
initTheme();

/* content first — everything below decorates what this produces */
renderAll();

initScrim(detectPage());
initReveal();
initHUD();
initNav();
initCursor();
initTransition();

/* The interface works with or without the environment behind it, so it binds
   once, now, against a stable handle. When (if) the scene arrives it slots in
   behind this proxy — no second pass, no duplicated listeners. */
let scene = null;
const sys = {
  pulse:     v => scene?.pulse?.(v),
  hoverNode: k => scene?.hoverNode?.(k),
  focusNode: k => scene?.focusNode?.(k),
};

const terminal = initTerminal(sys);
initInteractions(sys);

document.documentElement.classList.add("js");

/* The environment loads after paint. A visitor who asked for reduced motion
   still gets it — quieter, with drift and most of the traffic switched off —
   because removing the scene entirely would remove the site's whole idea. */
(async function environment() {
  try {
    const { mountScene } = await import("./scene/index.js");
    scene = await mountScene();
  } catch (err) {
    document.body.classList.add("no-webgl", "sys-online");
    console.warn("[sys] environment unavailable — running flat:", err?.message || err);
  }
})();

/* Skip link target + focus management for keyboard users landing on a page
   whose first interactive element is inside the fixed navigation. */
$$("[data-skip]").forEach(a => a.addEventListener("click", () => {
  const m = $("main");
  if (m) { m.setAttribute("tabindex", "-1"); m.focus({ preventScroll: true }); }
}));

export { scene, terminal, state };
