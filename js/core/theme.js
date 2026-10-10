/* =============================================================================
   THEME — system / light / dark. "system" follows the OS and keeps following it.
   ============================================================================= */
import { $, $$ } from "./dom.js";
import { emit }  from "./state.js";

const root  = document.documentElement;
const KEY   = "theme";
const MODES = ["system", "dark", "light"];
const media = matchMedia("(prefers-color-scheme: light)");

export const resolved = mode => mode === "system" ? (media.matches ? "light" : "dark") : mode;

let mode = "system";

export function getMode()  { return mode; }
export function getTheme() { return root.getAttribute("data-theme") || "dark"; }

export function setMode(next, persist = true) {
  mode = MODES.includes(next) ? next : "system";
  root.setAttribute("data-theme", resolved(mode));
  root.setAttribute("data-theme-mode", mode);
  if (persist) { try { localStorage.setItem(KEY, mode); } catch (e) {} }
  syncLabel();
  emit("theme", { mode, theme: getTheme() });
}

export function cycleTheme() {
  setMode(MODES[(MODES.indexOf(mode) + 1) % MODES.length]);
  return getTheme();
}

/** Terminal `theme` command keeps its old two-state behaviour. */
export function toggleTheme() {
  setMode(getTheme() === "dark" ? "light" : "dark");
  return getTheme();
}

function syncLabel() {
  const glyph = { system: "◑", dark: "◐", light: "◒" }[mode];
  $$("#themeToggle").forEach(b => {
    b.innerHTML = `<span class="tg-ic">${glyph}</span><span class="tg-tx">${mode.toUpperCase()}</span>`;
    b.setAttribute("aria-label", `Theme: ${mode}. Click to change.`);
    b.title = `Theme — ${mode}`;
  });
}

export function initTheme() {
  let saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  /* migrate the old two-value store ("dark"/"light") straight through */
  setMode(MODES.includes(saved) ? saved : "system", false);
  media.addEventListener?.("change", () => { if (mode === "system") setMode("system", false); });
  const btn = $("#themeToggle");
  if (btn) btn.addEventListener("click", cycleTheme);
}
