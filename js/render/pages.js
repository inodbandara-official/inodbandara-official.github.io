/* =============================================================================
   RENDERERS — every page is built from the same CONFIG object.
   Each block is guarded by the presence of its mount point, so one module
   serves index / work / impact / about / experience / stack / contact /
   case-study / lab / 404 without a router.
   ============================================================================= */
import { $, $$, set, accent }          from "../core/dom.js";
import { CONFIG, projSlug, fullName }  from "../data/profile.js";

/* Experience entries are grouped into the layer of the stack each role actually
   sat in. This is a reading of the real roles below, not extra information:
   nothing here adds a title, a date or a claim that isn't already in CONFIG. */
const LAYER = role => {
  const r = (role || "").toLowerCase();
  if (r.includes("network"))    return { k: "NETWORK",     n: "01" };
  if (r.includes("software"))   return { k: "APPLICATION", n: "02" };
  if (r.includes("research") || r.includes("intelligence")) return { k: "DATA", n: "03" };
  if (r.includes("systems") || r.includes("devops") || r.includes("infrastructure")) return { k: "SYSTEMS", n: "04" };
  return { k: "FOUNDATION", n: "00" };
};

const pad = i => String(i + 1).padStart(2, "0");

export function renderAll() {
  identity();
  marquee();
  socials();
  home();
  stackPage();
  aboutPage();
  casePage();
  contactPage();
}

/* ---- identity: present on every page ------------------------------------- */
function identity() {
  set("brandName", CONFIG.brandTag);
  set("tz", CONFIG.tzLabel);
  if (!document.body.hasAttribute("data-keep-title")) document.title = fullName;

  $$("[data-mailto]").forEach(a => {
    a.href = "mailto:" + CONFIG.email;
    if (a.hasAttribute("data-mail-text")) a.textContent = CONFIG.email;
  });
  $$("[data-resume]").forEach(a => { a.href = CONFIG.resumeUrl; });
  set("footC", "© " + new Date().getFullYear() + " " + fullName +
    " · no cookies, no trackers, no analytics — I genuinely have no idea you're here.");

  /* --- home hero -----------------------------------------------------------
     The display type is the role, not the name: a visitor gets "what is this
     person" before "who is this person", which is the order they actually
     read in. Both words come out of CONFIG.role, so changing the role there
     changes the headline here — no second copy of the job title to forget. */
  if ($("#heroL1")) {
    const words = String(CONFIG.role).split(/\s+/).filter(w => w !== "&");
    set("heroL1", (words[0] || "SYSTEMS").toUpperCase());
    set("heroL2", (words[words.length - 1] || "ENGINEER").toUpperCase() + '<span class="dot">.</span>', true);
    set("heroName", fullName);
    set("heroLoc", CONFIG.location);
    set("heroDisc", disciplines().map((d, i) =>
      (i ? '<i aria-hidden="true">/</i>' : "") + "<b>" + d + "</b>").join(" "), true);
    set("thesis", CONFIG.thesis);
    set("roleMeta", "<b>" + CONFIG.role + "</b>", true);
    set("locMeta", CONFIG.location);
    set("statusMeta", CONFIG.status);
  }
}

/** The disciplines line is the stack's own group names, flattened. Real data,
 *  so it can never drift out of sync with what the Stack section claims. */
function disciplines() {
  const out = [];
  CONFIG.stack.forEach(g => {
    g.group.replace(/&amp;/g, "&").split(/\s*&\s*/).forEach(part => {
      const t = part.trim();
      if (t && !out.includes(t)) out.push(t);
    });
  });
  return out;
}

function marquee() {
  if (!$("#marquee")) return;
  const unit = "<span>Systems <em>·</em> DevOps <em>·</em> Security <em>·</em> Infrastructure <em>·</em> Developer <em>·</em></span>";
  const run = " " + Array(6).fill(unit).join("");
  set("marquee", run + run, true);
}

function socials() {
  $$("[data-socials]").forEach(box => {
    box.innerHTML = CONFIG.socials.map(s =>
      '<a href="' + s.url + '" target="_blank" rel="noopener" data-cursor>' +
      '<i class="sig" aria-hidden="true"></i>' + s.label + "</a>").join("");
  });
}

/* ---- home + shared section renderers ------------------------------------- */
function home() {
  if ($("#projects")) {
    set("workCount", "— " + CONFIG.projects.length + " PROJECTS (THE SHOWABLE ONES)");
    $("#projects").innerHTML = CONFIG.projects.map(projectNode).join("");
  }

  if ($("#impactGrid")) {
    $("#impactGrid").innerHTML = CONFIG.impact.map((s, i) =>
      '<div class="stat" data-i="' + pad(i) + '">' +
        '<span class="stat__id" aria-hidden="true">' + pad(i) + "</span>" +
        '<div class="num">' + accent(s.num) + "</div>" +
        '<div class="lbl">' + s.lbl + "</div>" +
        '<i class="stat__scan" aria-hidden="true"></i>' +
      "</div>").join("");
  }

  if ($("#dontList")) $("#dontList").innerHTML = CONFIG.dont.map(d => "<li>" + d + "</li>").join("");

  if ($("#compList")) $("#compList").innerHTML = CONFIG.competencies.map(c =>
    "<li>" + c.name + '<span class="c">' + c.c + "</span></li>").join("");

  if ($("#timeline")) $("#timeline").innerHTML = CONFIG.experience.map(timelineItem).join("");

  if ($("#stackGrid")) $("#stackGrid").innerHTML = CONFIG.stack.map((g, i) =>
    '<div class="stack-col reveal" data-mod="' + pad(i) + '">' +
      "<h4><i class=\"mod-dot\" aria-hidden=\"true\"></i>" + g.group + '<span class="mod-n">' + pad(i) + "</span></h4>" +
      "<ul>" + g.items.map(it =>
        "<li><span class=\"mod-i\">" + it.n + "</span><span>" + it.q + "</span></li>").join("") +
      "</ul>" +
    "</div>").join("");
}

/* A project is a node in the system: index, title, live status marker and the
   full context → approach → system → outcome behind a disclosure. */
function projectNode(p, i) {
  return '<article class="project reveal" data-i="' + i + '" data-slug="' + projSlug(p) + '">' +
    '<div class="project__head" data-cursor role="button" tabindex="0" aria-expanded="false" ' +
         'aria-controls="pd-' + i + '">' +
      '<span class="project__idx"><i class="pnode" aria-hidden="true"></i>' + pad(i) + "</span>" +
      "<div><h3 class=\"project__title\">" + p.title + "</h3></div>" +
      '<span class="project__yr">' + p.year + '<span class="plus">+</span></span>' +
    "</div>" +
    '<p class="project__sub">' + p.role + "</p>" +
    '<p class="project__summary">' + p.summary + "</p>" +
    '<div class="chips">' + (p.chips || []).map(c =>
      '<span class="chip"><b>' + c.v + "</b> " + c.l + "</span>").join("") + "</div>" +
    '<div class="project__detail" id="pd-' + i + '">' +
      dcell("Context", p.context) + dcell("Approach", p.approach) +
      dcell("System", p.system)   + dcell("Outcome", p.outcome) +
      '<div class="dcell dcell--wide"><a class="btn" href="/work/' + projSlug(p) + '" data-cursor>' +
        "Read the full case study <span aria-hidden=\"true\">→</span></a></div>" +
    "</div>" +
  "</article>";
}
const dcell = (k, v) => '<div class="dcell"><h4>' + k + "</h4><p>" + v + "</p></div>";

function timelineItem(e) {
  const l = LAYER(e.role);
  return '<div class="tl__item reveal" data-layer="' + l.k + '">' +
    '<div class="tl__when"><span class="' + (e.now ? "now" : "") + '">' + e.when + "</span>" +
      '<span class="tl__layer" aria-hidden="true">' + l.k + "</span></div>" +
    "<div>" +
      '<div class="tl__role">' + e.role + "</div>" +
      '<div class="tl__co">' + e.co + "</div>" +
      '<ul class="tl__pts">' + e.points.map(pt => "<li>" + pt + "</li>").join("") + "</ul>" +
    "</div>" +
  "</div>";
}

/* ---- STACK page: the icon wall ------------------------------------------- */
function stackPage() {
  if (!$("#techGrid")) return;
  $("#techGrid").innerHTML = CONFIG.techStack.map(g =>
    '<div class="tech-group reveal">' +
      "<h4>" + g.group + ' <span class="tg-count">' + g.items.length + "</span></h4>" +
      '<div class="tech-grid">' + g.items.map((it, i) =>
        '<div class="tech" title="' + it.n + '" data-cursor>' +
          '<span class="tk-idx">' + pad(i) + "</span>" +
          '<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/' + it.s + '.svg" alt="' + it.n + '" loading="lazy" ' +
               "onerror=\"this.closest('.tech').classList.add('noicon')\" />" +
          '<span class="tk-n">' + it.n + "</span>" +
        "</div>").join("") +
      "</div>" +
    "</div>").join("");
}

/* ---- ABOUT page ----------------------------------------------------------- */
function aboutPage() {
  if (!$("#aboutPage")) return;
  const A = CONFIG.about;
  set("aStatement", A.statement, true);
  set("aStandfirst", A.standfirst, true);
  set("aRole", CONFIG.role);
  set("aLoc", CONFIG.location);
  set("aCoords", A.coords);
  set("aStatus", CONFIG.status);

  const pt = $("#portrait");
  if (pt) {
    pt.innerHTML = A.photo
      ? '<img src="' + A.photo + '" alt="' + fullName +
        ', allegedly. (This is the alt text. Nice to meet the screen-reader crowd.)" />'
      : '<div class="portrait__ph"><span class="ic">⌷</span>' +
        "<div>Add your portrait here<br><b>set about.photo</b> in js/data/profile.js<br>(or don't — mysterious also works)</div></div>";
    pt.insertAdjacentHTML("beforeend",
      '<span class="tick tl"></span><span class="tick tr"></span><span class="tick bl"></span><span class="tick br"></span>' +
      '<div class="portrait__cap"><b>' + A.photoCaption + "</b> — " + fullName + ", " + CONFIG.location + "</div>");
  }

  if ($("#bio")) $("#bio").innerHTML = A.bio.map(p =>
    '<p class="' + (p.lede ? "lede" : "") + '">' + p.text + "</p>").join("");

  if ($("#principles")) $("#principles").innerHTML = A.principles.map((p, i) =>
    '<div class="stat principle reveal"><div class="pn">' + pad(i) + "</div><h3>" + p.t + "</h3><p>" + p.d +
    '</p><i class="stat__scan" aria-hidden="true"></i></div>').join("");

  if ($("#aDont")) $("#aDont").innerHTML = CONFIG.dont.map(d => "<li>" + d + "</li>").join("");

  if ($("#education")) $("#education").innerHTML = A.education.map(e =>
    '<div class="edu__item reveal">' +
      '<div class="edu__when">' + e.when + "</div>" +
      "<div><div class=\"edu__title\">" + e.title + '</div><div class="edu__org">' + e.org + "</div></div>" +
      '<div class="edu__note">' + e.note + "</div>" +
    "</div>").join("");
}

/* ---- CASE STUDY page ------------------------------------------------------ */
function casePage() {
  if (!$("#projectPage")) return;
  const params = new URLSearchParams(location.search);
  let idx = -1;

  /* 1) preferred: a slug in the path, e.g. /work/ifs-cloud-25r2-rollout */
  const m = location.pathname.match(/\/work\/([^/?#]+)/);
  if (m) {
    const slug = decodeURIComponent(m[1]).replace(/\.html$/, "").replace(/\/$/, "");
    idx = CONFIG.projects.findIndex(pr => projSlug(pr) === slug);
  }
  /* 2) fallback: ?p=N (old links still work) */
  if (idx < 0) { const q = parseInt(params.get("p"), 10); if (!isNaN(q)) idx = q; }
  if (idx < 0 || idx >= CONFIG.projects.length) idx = 0;

  const p = CONFIG.projects[idx];
  const n = CONFIG.projects.length;

  set("cEyebrowN", pad(idx));
  set("pTitle", p.title);
  set("pTagline", p.tagline || p.summary);
  document.title = p.title + " — " + fullName;

  const meta = [["YEAR", p.year], ["ROLE", p.role], ["CLIENT", p.client || "—"], ["DURATION", p.duration || "—"]];
  set("pMeta", meta.map(kv =>
    "<span><span class=\"k\">" + kv[0] + '</span> &nbsp;<span class="v">' + kv[1] + "</span></span>").join(""), true);

  if ($("#pChips")) $("#pChips").innerHTML = (p.chips || []).map(c =>
    '<span class="chip"><b>' + c.v + "</b> " + c.l + "</span>").join("");

  set("pTldr", p.summary);

  const cov = $("#pCover");
  if (cov) {
    cov.innerHTML = '<div class="portrait__ph"><span class="ic">⌷</span><div>Cover image / architecture diagram<br>' +
      "<b>add it to gallery in js/data/profile.js</b><br>(honestly, a diagram sells this harder than words)</div></div>" +
      '<span class="tick tl"></span><span class="tick tr"></span><span class="tick bl"></span><span class="tick br"></span>' +
      '<div class="portrait__cap"><b>FIG.00</b> — ' + p.title + "</div>";
  }

  const secs = [["Context", p.context], ["Approach", p.approach], ["System", p.system], ["Outcome", p.outcome]];
  if ($("#pSections")) $("#pSections").innerHTML = secs.map((s, i) =>
    '<div class="case-section reveal"><div class="cs-k">' + pad(i) + " — " + s[0] + "</div><p>" + s[1] + "</p></div>").join("");

  if ($("#pStack")) $("#pStack").innerHTML = (p.stack || []).map(s => '<span class="chip">' + s + "</span>").join("");

  if ($("#pGallery")) $("#pGallery").innerHTML = (p.gallery || []).map((cap, i) =>
    '<div class="portrait shot reveal">' +
      '<div class="portrait__ph"><span class="ic">⌷</span><div>image slot<br><b>' + cap + "</b></div></div>" +
      '<span class="tick tl"></span><span class="tick tr"></span><span class="tick bl"></span><span class="tick br"></span>' +
      '<div class="portrait__cap"><b>FIG.' + pad(i) + "</b> — " + cap + "</div>" +
    "</div>").join("");

  set("pLesson", p.lesson || "Nothing exploded that I'm willing to admit to in writing.");

  const prev = (idx - 1 + n) % n, next = (idx + 1) % n;
  set("pPrev", '<a href="/work/' + projSlug(CONFIG.projects[prev]) + '" data-cursor>← ' + CONFIG.projects[prev].title + "</a>", true);
  set("pNext", '<a href="/work/' + projSlug(CONFIG.projects[next]) + '" data-cursor>' + CONFIG.projects[next].title + " →</a>", true);

  /* the scene focuses the node this page is about */
  document.body.dataset.focusNode = String(idx);
}

/* ---- CONTACT page --------------------------------------------------------- */
function contactPage() {
  if (!$("#contactPage")) return;
  const C = CONFIG.contact;
  set("cHeadline", C.headline + '<span class="dot">.</span>', true);
  set("cLede", C.lede);
  set("cMail", CONFIG.email);

  const info = [
    ["EMAIL", CONFIG.email, ""],
    ["LOCATION", CONFIG.location, ""],
    ["LOCAL TIME", '<span id="cClock">--:--:--</span> ' + CONFIG.tzLabel, ""],
    ["AVAILABILITY", C.availability, "acc"],
    ["RESPONSE", C.responseTime, ""],
  ];
  if ($("#cInfo")) $("#cInfo").innerHTML = info.map(row =>
    '<div class="info-row"><span class="k">' + row[0] + '</span><span class="v ' + row[2] + '">' + row[1] + "</span></div>").join("");

  if ($("#cGood")) $("#cGood").innerHTML = C.goodFit.map(x => "<li>" + x + "</li>").join("");
  if ($("#cNo"))   $("#cNo").innerHTML   = C.notFit.map(x => "<li>" + x + "</li>").join("");
  set("cCoffee", C.coffee);
}
