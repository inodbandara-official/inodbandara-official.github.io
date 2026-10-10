/* =============================================================================
   REVEAL — content enters the way hardware comes online: in order, once.
   ============================================================================= */
import { $$ } from "./dom.js";
import { state } from "./state.js";

let io = null;

export function initReveal() {
  if (state.flags.reduced) { $$(".reveal").forEach(n => n.classList.add("in")); return; }
  io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      io.unobserve(e.target);
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -6% 0px" });
  observe();
}

/** Re-scan after a render pass injects new nodes. */
export function observe(root = document) {
  if (!io) { $$(".reveal", root).forEach(n => n.classList.add("in")); return; }
  $$(".reveal:not(.in)", root).forEach((n, i) => {
    n.style.setProperty("--rv-i", String(i % 8));   // stagger inside a group
    io.observe(n);
  });
}
