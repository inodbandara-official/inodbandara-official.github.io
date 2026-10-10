/* =============================================================================
   CONSOLE — the portfolio's own shell. Every command below does something real:
   it reads the same CONFIG the pages render from, or it navigates. Nothing here
   simulates access it doesn't have, and nothing prints a number I didn't measure.
   ============================================================================= */
import { $, $$, el }                   from "./dom.js";
import { CONFIG, projSlug, fullName }  from "../data/profile.js";
import { toggleTheme, getTheme }       from "./theme.js";
import { state }                       from "./state.js";

let term, body, input;
let sceneRef = null;

const PROMPT = '<span class="pr">&#10148;</span>';
const go = (path, ms = 620) => setTimeout(() => { location.href = path; }, ms);
const esc = s => String(s).replace(/[<>&]/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]));

export function initTerminal(scene) {
  sceneRef = scene || null;
  term = $("#term"); body = $("#termBody"); input = $("#termInput");
  if (!term) return {};

  /* dress the existing shell as an instrument, not a desktop window */
  const ttl = term.querySelector(".term__bar .ttl");
  if (ttl) ttl.innerHTML = 'visitor@' + CONFIG.brandTag.toLowerCase() + ' <b>:</b> ~';
  term.querySelector(".term__bar")?.insertAdjacentHTML("beforeend",
    '<span class="term__sig" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>');

  $("#termLaunch")?.addEventListener("click", () => open(!term.classList.contains("open")));
  $$("[data-open-term],[data-term-trigger]").forEach(b =>
    b.addEventListener("click", e => { e.preventDefault(); open(true); }));
  $("#termClose")?.addEventListener("click", () => open(false));

  print('<span class="mut">' + CONFIG.firstName.toLowerCase() + "@" + CONFIG.brandTag.toLowerCase() +
        '</span> — interactive shell. type <span class="acc">help</span> to start.');

  const hist = []; let hp = -1;
  input?.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      const v = input.value;
      if (v.trim()) { hist.push(v); hp = hist.length; }
      run(v); input.value = "";
    } else if (e.key === "ArrowUp") {
      if (hp > 0) { hp--; input.value = hist[hp] || ""; } e.preventDefault();
    } else if (e.key === "ArrowDown") {
      if (hp < hist.length - 1) { hp++; input.value = hist[hp] || ""; }
      else { hp = hist.length; input.value = ""; } e.preventDefault();
    } else if (e.key === "Tab") { e.preventDefault(); complete(); }
  });

  addEventListener("keydown", e => {
    if (e.key === "`" && document.activeElement !== input) {
      e.preventDefault(); open(!term.classList.contains("open"));
    }
    if (e.key === "Escape") {
      open(false);
      $("#overlay")?.classList.remove("open");
      document.body.classList.remove("no-scroll");
    }
  });

  return { open, run, print };
}

function open(v) {
  if (!term) return;
  term.classList.toggle("open", v);
  document.body.classList.toggle("term-open", v);
  if (v) setTimeout(() => input?.focus(), 60);
}

function print(html, cls = "") {
  if (!body) return;
  body.appendChild(el("div", { class: "term__line " + cls }, html));
  body.scrollTop = body.scrollHeight;
}

function complete() {
  const v = (input.value || "").trim();
  if (!v) return;
  const hit = Object.keys(CMDS).filter(k => k.startsWith(v));
  if (hit.length === 1) input.value = hit[0] + " ";
  else if (hit.length > 1) print(hit.map(h => '<span class="acc">' + h + "</span>").join("  "));
}

/* --------------------------------------------------------------------------
   Commands. Documented ones appear in `help`; the undocumented ones are the
   reward for poking at a security portfolio.
   -------------------------------------------------------------------------- */
const CMDS = {
  help() {
    return [
      "Available commands:",
      '  <span class="acc">whoami</span>     who is this',
      '  <span class="acc">about</span>      the short version   ( <span class="mut">opens /about</span> )',
      '  <span class="acc">work</span>       list projects        ( <span class="mut">work 1</span> for detail )',
      '  <span class="acc">open</span>       open a case study    ( <span class="mut">open 1</span> )',
      '  <span class="acc">impact</span>     the numbers          ( <span class="mut">opens /impact</span> )',
      '  <span class="acc">stack</span>      the toolbox          ( <span class="mut">opens /stack</span> )',
      '  <span class="acc">skills</span>     list the stack inline',
      '  <span class="acc">xp</span>         experience           ( <span class="mut">opens /experience</span> )',
      '  <span class="acc">lab</span>        experiments          ( <span class="mut">opens /lab</span> )',
      '  <span class="acc">contact</span>    how to reach me      ( <span class="mut">opens /contact</span> )',
      '  <span class="acc">sys</span>        what this page is actually running',
      '  <span class="acc">theme</span>      toggle light / dark',
      '  <span class="acc">clear</span>      wipe the screen',
      '<span class="mut">try:</span> <span class="acc">sudo hire</span>  <span class="mut">·  there are a few undocumented ones. it\'s a security portfolio; go poke.</span>',
    ].join("\n");
  },

  whoami() {
    return fullName + " — " + CONFIG.role + '\n<span class="mut">' + CONFIG.location + " · " + CONFIG.status + "</span>";
  },

  about() { go("/about"); return CONFIG.thesis + '\n<span class="mut">opening /about …</span>'; },

  work(arg) {
    if (arg) {
      const p = CONFIG.projects[(+arg) - 1];
      if (!p) return '<span class="mut">no project ' + esc(arg) + ". try: work 1–" + CONFIG.projects.length + "</span>";
      return '<span class="acc">' + p.title + "</span> (" + p.year + ") — " + p.role + "\n" + p.summary +
             '\n<span class="mut">outcome:</span> ' + p.outcome;
    }
    return CONFIG.projects.map((p, i) => '  <span class="acc">0' + (i + 1) + "</span>  " + p.title +
           ' <span class="mut">— ' + p.year + "</span>").join("\n") +
           '\n<span class="mut">→ type "work 1" for detail</span>';
  },

  open(arg) {
    const i = (+arg) - 1;
    if (isNaN(i) || !CONFIG.projects[i]) return '<span class="mut">usage: open 1–' + CONFIG.projects.length + "</span>";
    go("/work/" + projSlug(CONFIG.projects[i]), 520);
    return 'opening case study: <span class="acc">' + CONFIG.projects[i].title + "</span> …";
  },

  skills() {
    return CONFIG.stack.map(g => '<span class="acc">' + g.group + "</span>: " + g.items.map(i => i.n).join(", ")).join("\n");
  },

  xp() {
    go("/experience");
    return CONFIG.experience.map(e => '<span class="acc">' + e.when + "</span> — " + e.role + ", " + e.co).join("\n") +
           '\n<span class="mut">opening /experience …</span>';
  },

  impact() {
    go("/impact");
    return CONFIG.impact.map(s => '  <span class="acc">' + s.num.replace(/\*/g, "") + "</span>  " + s.lbl).join("\n") +
           '\n<span class="mut">opening /impact …</span>';
  },

  stack()   { go("/stack");   return '<span class="mut">opening /stack — the toolbox …</span>'; },
  lab()     { go("/lab");     return '<span class="mut">/lab — where things are allowed to break. opening …</span>'; },
  contact() { go("/contact"); return 'email: <span class="acc">' + CONFIG.email + '</span>\n<span class="mut">opening /contact …</span>'; },

  /* honest introspection: reads this page, doesn't invent it */
  sys() {
    return [
      'renderer   <span class="acc">' + (state.flags.webgl ? "WebGL" : "canvas 2D fallback") + "</span>",
      "viewport   " + state.view.w + "×" + state.view.h + " @ " + state.view.dpr.toFixed(2) + "x dpr",
      "motion     " + (state.flags.reduced ? "reduced (respected)" : "full"),
      "theme      " + getTheme(),
      "network    " + (navigator.onLine ? '<span class="acc">online</span>' : "offline"),
      "build      static · no framework · no tracker · no analytics",
      '<span class="mut">every value on this readout came from your browser, not from me.</span>',
    ].join("\n");
  },

  theme() { return 'theme → <span class="acc">' + toggleTheme() + "</span>"; },
  clear() { if (body) body.innerHTML = ""; return ""; },

  sudo(arg) {
    if ((arg || "").includes("hire")) {
      setTimeout(() => { location.href = "mailto:" + CONFIG.email; }, 700);
      return '<span class="acc">Permission granted.</span> Opening mail client…';
    }
    return '<span class="mut">nice try. this incident has been logged, timestamped, and quietly forgiven. 🙂</span>';
  },

  /* ---- undocumented (the fun part) ---- */
  coffee() { return "brewing… ☕  the only blocking operation I fully endorse."; },
  ping()   { return 'PONG. latency: <span class="acc">&lt;50ms</span> technically, emotionally instantaneous.'; },
  uptime() { return 'up 3 years, 0 unplanned reboots. <span class="mut">the office coffee machine cannot make the same claim.</span>'; },
  dns()    { return '<span class="acc">it was DNS.</span> <span class="mut">it is always DNS. one day it will not be DNS, and that day it will still, somehow, be DNS.</span>'; },
  ls(arg)  {
    if ((arg || "").includes("-a") || (arg || "").includes("-la"))
      return '.  ..  work/  lab/  <span class="mut">.secrets/</span>  <span class="mut">.env  (you wish)</span>';
    return CONFIG.projects.map((p, i) => "0" + (i + 1) + "_" + projSlug(p) + "/").join("   ");
  },
  cat(arg) {
    if ((arg || "").includes("secret") || (arg || "").includes(".env"))
      return '<span class="mut">permission denied. hardening is a lifestyle, not a project.</span>';
    return '<span class="mut">cat: ' + esc(arg || "?") + ': no such file. try </span><span class="acc">help</span>';
  },
  rm(arg) {
    if ((arg || "").replace(/\s+/g, "").includes("-rf/"))
      return '<span class="acc">whoa.</span> <span class="mut">I keep backups precisely so this stopped being funny to me. request denied, with love.</span>';
    return '<span class="mut">rm: refusing. see: backups, runbooks, therapy.</span>';
  },
  man()   { return '<span class="mut">no manual pages here. that\'s the entire reason I write runbooks.</span>'; },
  exit()  { return '<span class="mut">there is no exit — this is a shell inside a portfolio inside a browser. (or: hire me. that\'s also an exit.)</span>'; },
  hello() { return 'hey. <span class="mut">type</span> <span class="acc">help</span> <span class="mut">if you\'re lost, or</span> <span class="acc">sudo hire</span> <span class="mut">if you\'re decisive.</span>'; },
  traceroute() {
    return '1  hero              <span class="acc">ok</span>\n' +
           '2  network-layer     <span class="acc">ok</span>\n' +
           '3  system-core       <span class="acc">ok</span>\n' +
           '<span class="mut">all three hops are on this page. scroll.</span>';
  },
};

const QUIPS = c => [
  "command not found: " + c + '. <span class="mut">have you tried turning it off and on again?</span>',
  c + ': not a command. <span class="mut">but I admire the confidence. try </span><span class="acc">help</span>',
  "bash: " + c + ': command not found. <span class="mut">(it was probably DNS.)</span>',
  c + '? <span class="mut">bold. unsupported, but bold. → </span><span class="acc">help</span>',
];

function run(raw) {
  const parts = String(raw).trim().split(/\s+/);
  const cmd = parts.shift();
  if (!cmd) return;
  print(PROMPT + " " + esc(raw));
  const fn = CMDS[cmd.toLowerCase()];
  if (fn) {
    const out = fn(parts.join(" "));
    if (out) print(out);
    sceneRef?.pulse?.(0.7);            // the environment acknowledges the command
  } else {
    const q = QUIPS(esc(cmd));
    print(q[Math.floor(Math.random() * q.length)]);
  }
}

export { open as openTerminal };
