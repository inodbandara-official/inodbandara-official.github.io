/* =============================================================================
   INTERACTIONS — the small behaviours that live on top of the rendered pages.
   ============================================================================= */
import { $, $$ }   from "./dom.js";
import { CONFIG, fullName } from "../data/profile.js";

export function initInteractions(scene) {
  projectDisclosure(scene);
  contactForm();
  copyEmail();
  smoothAnchors();
  consoleCard();
}

/* Case-study rows open in place. Real button semantics, real aria state. */
function projectDisclosure(scene) {
  $$(".project__head").forEach(h => {
    const toggle = () => {
      const p = h.closest(".project");
      const open = p.classList.toggle("open");
      h.setAttribute("aria-expanded", String(open));
      if (open) scene?.focusNode?.(Number(p.dataset.i));
      else      scene?.focusNode?.(null);
    };
    h.addEventListener("click", toggle);
    h.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
    });
    /* hovering a project lights its node in the environment */
    h.addEventListener("pointerenter", () => scene?.hoverNode?.(Number(h.closest(".project").dataset.i)));
    h.addEventListener("pointerleave", () => scene?.hoverNode?.(null));
  });
}

function contactForm() {
  const btn = $("#sendBtn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const val = id => ($("#" + id)?.value || "").trim();
    const n = val("fname"), e = val("femail"), m = val("fmsg");
    const topic = $("#ftopic")?.value || "";
    const subj = encodeURIComponent("Portfolio enquiry" + (topic ? " — " + topic : "") + (n ? " (" + n + ")" : ""));
    const body = encodeURIComponent(m + "\n\n— " + (n || "?") + " (" + (e || "no email") + ")");
    location.href = "mailto:" + CONFIG.email + "?subject=" + subj + "&body=" + body;
  });
}

function copyEmail() {
  $$("[data-copy-email]").forEach(b => {
    b.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(CONFIG.email); } catch (e) { /* clipboard blocked; the address is on screen anyway */ }
      const old = b.textContent;
      b.textContent = "✓ copied"; b.classList.add("done");
      setTimeout(() => { b.textContent = old; b.classList.remove("done"); }, 1600);
    });
  });
}

/* Anchor jumps get the same easing as everything else, and respect the setting. */
function smoothAnchors() {
  document.addEventListener("click", e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href").slice(1);
    const t = id ? document.getElementById(id) : document.body;
    if (!t) return;
    e.preventDefault();
    t.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    history.replaceState(null, "", "#" + id);
  });
}

/* Console easter egg — for the recruiter who opens devtools "just to check". */
function consoleCard() {
  try {
    const s1 = "font-family:monospace;font-size:13px;color:#f5b841";
    const s2 = "font-family:monospace;font-size:12px;color:#8b909a";
    console.log("%c$ whoami", "font-family:monospace;color:#8b909a");
    console.log("%c" + fullName + " — " + CONFIG.role, s1);
    console.log("%cYou opened the console. Either you're a recruiter who codes or you're\nsimply nosy — both are, frankly, hireable traits.", s2);
    console.log("%cThe site is hand-written. No framework, no build step, no tracker, no\nanalytics — the 3D layer is Three.js, vendored locally, and that's the\nonly dependency on the page. I don't actually know you're reading this.\nProve me wrong: %c" + CONFIG.email, s2, s1);
    console.log("%cPS — it was DNS. It's always DNS.", s2);
  } catch (e) { /* some embedded browsers have no console */ }
}
