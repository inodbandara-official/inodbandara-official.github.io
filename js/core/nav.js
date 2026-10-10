/* =============================================================================
   NAVIGATION — a control surface, not a navbar.
   The markup already in each page is kept (real links, real semantics); this
   module adds the indicator, the section rail and the scrollspy on top of it.
   ============================================================================= */
import { $, $$, el, damp } from "./dom.js";
import { state, onTick, on } from "./state.js";

export function initNav() {
  const nav = $("#nav");
  const links = $$(".nav-links a");

  /* ---- moving indicator under the active / hovered link ---- */
  if (nav && links.length) {
    const rail = el("i", { class: "nav-ind", "aria-hidden": "true" });
    $(".nav-links")?.appendChild(rail);
    let target = null, x = 0, w = 0, shown = false;

    const measure = a => {
      const p = a.parentElement.getBoundingClientRect(), r = a.getBoundingClientRect();
      return { x: r.left - p.left, w: r.width };
    };
    const current = () => $('.nav-links a[aria-current="page"]');
    const rest = () => { target = current(); };

    links.forEach(a => {
      a.addEventListener("pointerenter", () => { target = a; });
      a.addEventListener("focus",        () => { target = a; });
      a.addEventListener("pointerleave", rest);
      a.addEventListener("blur",         rest);
    });
    rest();

    let last = null, cached = { x: 0, w: 0 };
    on("resize", () => { last = null; });
    onTick(dt => {
      if (!target) { rail.style.opacity = "0"; shown = false; return; }
      /* one layout read per target change, not one per frame */
      if (target !== last) { cached = measure(target); last = target; }
      const m = cached;
      if (!shown) { x = m.x; w = m.w; shown = true; }
      x = damp(x, m.x, 16, dt); w = damp(w, m.w, 16, dt);
      rail.style.opacity = "1";
      rail.style.transform = `translate3d(${x}px,0,0) scaleX(${w})`;
    });
  }

  /* ---- nav condenses once you leave the hero ---- */
  on("scroll", () => nav?.classList.toggle("scrolled", state.scroll.y > 40));
  nav?.classList.toggle("scrolled", state.scroll.y > 40);

  /* ---- mobile overlay ---- */
  const overlay = $("#overlay");
  const openMenu = v => {
    overlay?.classList.toggle("open", v);
    document.body.classList.toggle("no-scroll", v);
    $("#menuBtn")?.setAttribute("aria-expanded", String(v));
    if (v) overlay?.querySelector("a")?.focus({ preventScroll: true });
  };
  $("#menuBtn")?.setAttribute("aria-expanded", "false");
  $("#menuBtn")?.addEventListener("click", () => openMenu(true));
  $("#overlayClose")?.addEventListener("click", () => openMenu(false));
  $$("#overlay a").forEach(a => a.addEventListener("click", () => openMenu(false)));

  /* ---- section rail + scrollspy (only where the page actually has sections) ---- */
  const sections = $$("main section[id], main header[id]").filter(s => s.id);
  if (sections.length > 2 && !state.view.mobile) buildRail(sections);

  return { openMenu };
}

function buildRail(sections) {
  const rail = el("nav", { class: "srail", "aria-label": "Section progress" });
  rail.innerHTML = sections.map((s, i) => {
    const label = s.dataset.railLabel || s.id;
    return `<a href="#${s.id}" data-cursor data-i="${i}"><i></i><span>${String(i + 1).padStart(2, "0")} ${label}</span></a>`;
  }).join("");
  document.body.appendChild(rail);
  const dots = [...rail.children];

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      const i = sections.indexOf(e.target);
      if (i < 0) return;
      if (e.isIntersecting) {
        dots.forEach(d => d.classList.remove("on"));
        dots[i]?.classList.add("on");
        state.focus.section = e.target.id;
        state.focus.index = i;
      }
    });
  }, { rootMargin: "-45% 0px -45% 0px" });
  sections.forEach(s => io.observe(s));
}
