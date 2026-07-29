/* =============================================================================
   ██  CONFIG  —  THE ONLY PLACE YOU NEED TO EDIT.
   Shared by index.html, about.html and contact.html. Change a value once and
   every page updates. Add your portrait by setting  about.photo  below.
   ============================================================================= */
const CONFIG = {
  /* ---- identity ---- */
  firstName: "INOD",
  lastName:  "BANDARA",
  brandTag:  "PORTFOLIO",
  role:      "Systems & DevOps Engineer",
  thesis:    "Not the box in the diagram — the system that keeps standing when the load, the outage, and the attacker all arrive at once.",
  location:  "Colombo, SL",
  timezone:  "Asia/Colombo",   // IANA name for the live clock
  tzLabel:   "+0530",
  status:    "OPEN TO WORK",
  email:     "officialinod@gmail.com",
  resumeUrl: "resume.pdf",
  socials: [
    { label: "GitHub",   url: "https://github.com/inodbandara-official" },
    { label: "LinkedIn", url: "https://www.linkedin.com/in/inod-bandara-555722228/" },
    { label: "Location", url: "https://www.google.com/maps/place/Fort+America+Pentagon/@38.8707289,-77.0555936,19z" },
  ],

  /* ---- selected work ----  (each entry also powers project.html?p=N) ---- */
  projects: [
    {
      title: "IFS Cloud 25R2 Rollout",
      tagline: "Getting a split-tier ERP from \"undocumented failure modes\" to a green deploy — without the 2am reruns becoming a lifestyle.",
      year: "2026", role: "Lead — Infrastructure & Deployment", client: "Internal · ERP consultancy", duration: "~6 weeks, several of them character-building",
      summary: "Stood up a production ERP platform on a split two-VM topology — Oracle 19c on Windows, a microk8s middle tier on Ubuntu — and drove it through every install blocker to a green deploy.",
      chips: [ {v:"2 VM", l:"topology"}, {v:"19c", l:"Oracle DB"}, {v:"k8s", l:"middle tier"}, {v:"0", l:"open blockers"} ],
      context:  "A greenfield ERP install with a strict split-tier design and a stack of undocumented failure modes between the database host and the Kubernetes middle tier.",
      approach: "Rebuilt the DB to the required patch level, fixed listener binding so the middle tier could actually reach it, and scripted the cluster bring-up to remove race conditions.",
      system:   "Oracle 19c (RU 19.28 + OJVM) on Windows; microk8s on Ubuntu Server; JDBC path traced end-to-end; PDB-level NLS and semantics corrected; controller-driven pod recovery.",
      outcome:  "A reproducible, documented deployment — plus an internal reference guide the rest of the team now installs from.",
      stack: ["Oracle 19c","microk8s","Ubuntu Server","Windows Server","JDBC","PowerShell"],
      gallery: ["The two-VM split tier, drawn after it worked","The deploy that finally went green","The runbook the team now installs from"],
      lesson: "If I did it again, I'd script the listener and firewall config on day one instead of rediscovering the same binding bug at 2am. Twice. It was, of course, DNS-adjacent.",
    },
    {
      title: "Remote Laptop Hardening",
      tagline: "A real security baseline for a fleet with no domain, no MDM, and no appetite for \"we'll sort it later.\"",
      year: "2026", role: "Owner — Endpoint Security", client: "Internal · remote staff", duration: "~3 weeks",
      summary: "Designed a Group-Policy + registry hardening baseline for remote staff on a fleet with no Intune and no domain — then wrote the honest business case for the tooling that would automate it.",
      chips: [ {v:"No MDM", l:"constraint"}, {v:"1-click", l:"run sheet"}, {v:"CIS", l:"aligned"}, {v:"PS", l:"scripted"} ],
      context:  "Remote Windows laptops needed a real security baseline, but the environment ruled out Active Directory and mobile device management.",
      approach: "Built a scripted local-policy baseline with a dry-run mode, an interactive run sheet, and a clear-eyed upgrade path where the constraints stopped making sense.",
      system:   "Harden-Laptop.ps1 with idempotent registry/GPO edits; BitLocker + secret-escrow design; documented Business Standard → Premium migration for silent self-hardening.",
      outcome:  "A deployable baseline today, and a costed recommendation for the managed path — decision left to the business with the trade-offs made explicit.",
      stack: ["PowerShell","Group Policy","Registry","BitLocker","CIS Benchmarks"],
      gallery: ["The interactive run sheet","Dry-run output (measure twice, harden once)","Posture: before vs after"],
      lesson: "A single em-dash in a script comment silently broke encoding on older hosts. I now trust no character I didn't type twice, and I test on the sad old laptop first.",
    },
    {
      title: "Cloud Fleet Consolidation",
      tagline: "Turning a surprise-every-month hosting bill into a flat, boring, predictable one. Boring is the entire point.",
      year: "2025", role: "Infrastructure Engineer", client: "Internal", duration: "ongoing",
      summary: "Evaluated hosting for a Windows-heavy, high-bandwidth VM fleet and moved the analysis from gut feel to a flat-rate, unmetered single-provider model.",
      chips: [ {v:"7", l:"VMs"}, {v:"flat", l:"licensing"}, {v:"∞", l:"bandwidth"}, {v:"£", l:"cost cut"} ],
      context:  "A growing VM fleet on metered, per-resource pricing made monthly cost unpredictable and Windows licensing painful.",
      approach: "Benchmarked providers against real bandwidth and licensing needs rather than headline compute prices, then modelled total cost of ownership.",
      system:   "Single-provider consolidation with flat-rate Windows licensing and unmetered traffic; region and access model reviewed for the team.",
      outcome:  "Predictable spend and simpler administration across the fleet, with a migration plan the team could execute incrementally.",
      stack: ["Kamatera","Contabo","Windows licensing","Linux","Bash"],
      gallery: ["Cost model: the scary before","Cost model: the calm after","Provider comparison matrix"],
      lesson: "I trusted headline compute prices for roughly a day, before bandwidth and licensing quietly reminded me who actually writes the invoice.",
    },
  ],

  /* ---- impact numbers (wrap the highlight in *asterisks* for accent) ---- */
  impact: [
    { num:"*0*",       lbl:"open blockers at go-live" },
    { num:"*7*×",      lbl:"VMs consolidated to one provider" },
    { num:"*19.28*",   lbl:"Oracle RU patched clean" },
    { num:"*1-click*", lbl:"hardening run sheet" },
    { num:"*100%*",    lbl:"reproducible from docs, not memory" },
    { num:"*3*",       lbl:"runbooks nobody has to decode" },
    { num:"*<50*ms",   lbl:"tuned API round-trips" },
    { num:"*24/7*",    lbl:"observable — no vibes-based ops" },
  ],

  /* ---- what I don't do (used on home + about) ---- */
  dont: [
    "Ship infrastructure I can't observe. If it can't be measured, it isn't done.",
    "Hand over a system without the runbook that keeps it alive.",
    "Bolt on security last. Hardening is a design input, not a patch.",
  ],

  competencies: [
    { name:"Cloud &amp; Infrastructure",      c:"AWS · Kamatera · Contabo" },
    { name:"Linux &amp; Windows Admin",       c:"Ubuntu · RHEL · Server" },
    { name:"Containers &amp; Orchestration",  c:"Kubernetes · microk8s" },
    { name:"Databases &amp; Middleware",      c:"Oracle 19c · REST" },
    { name:"Security &amp; Hardening",        c:"GPO · CIS · endpoint" },
    { name:"Automation &amp; Docs",           c:"PowerShell · Bash" },
  ],

  /* ---- experience timeline (most recent first) ---- */
  experience: [
    { when:"2025 — Now", now:true, role:"Systems Engineer", co:"Kaizens Group Ltd",
      points:[ "ERP platform implementations across split-tier cloud topologies.",
               "Infrastructure provisioning, server administration, and client deployments.",
               "Endpoint hardening, plus documentation someone other than me can actually follow." ] },
    { when:"2024 — 2025", role:"Software Engineer", co:"Applova Inc",
      points:[ "Cloud VM fleet management and cost optimisation.",
               "Linux and Windows server builds, backups, and monitoring." ] },
    { when:"2026", role:"B.Sc. in Information Systems", co:"University of Colombo School of Computing",
      points:[ "Core grounding in information systems, databases, and networked infrastructure.",
               "Where the systems-and-security itch started — and then refused to leave." ] },
    { when:"2028 (expected)", role:"B.Sc. (Hons) in Software Engineering", co:"University of Westminster",
      points:[ "Software engineering, distributed systems, and the theory under the tools I use daily.",
               "Still compiling — expected 2028." ] },
  ],

  /* ---- stack ---- */
  stack: [
    { group:"Cloud & OS", items:[
      {n:"Ubuntu / RHEL", q:"servers"}, {n:"Windows Server", q:"AD-free, on purpose"},
      {n:"Kamatera", q:"VM fleet"}, {n:"AWS", q:"working on it"} ] },
    { group:"Systems & Data", items:[
      {n:"Kubernetes", q:"microk8s"}, {n:"Oracle 19c", q:"DBCA · RMAN"},
      {n:"Docker", q:"when it behaves"}, {n:"REST / FQDN", q:"proxy"} ] },
    { group:"Security & Automation", items:[
      {n:"GPO / Registry", q:"hardening"}, {n:"PowerShell", q:"scripting"},
      {n:"Bash", q:"reluctantly fluent"}, {n:"ELK", q:"logging"} ] },
  ],

  /* ==========================================================================
     ABOUT PAGE
     ========================================================================== */
  about: {
    statement: "Infrastructure is easy to draw. It's hard to keep <em>alive</em>.",
    standfirst: "I'm the engineer who owns the unglamorous layer — the failover path, the hardened endpoint, the log line that tells you what actually broke at 3am.",
    photo: "me.jpg",                       // ← ADD YOUR IMAGE: set to e.g. "me.jpg" (put the file next to these pages)
    photoCaption: "FIG.01",          // small caption shown on the portrait
    coords: "6.9271°N 79.8612°E",    // shows in the HUD-style meta row
    bio: [
      { lede:true, text:"I started where most infrastructure people start: <em>something was broken and someone had to fix it before morning.</em> That pressure taught me to ask why a system fails before asking how to make it prettier." },
      { text:"My work sits in the space between a clean architecture diagram and a system that survives real load. Cloud provisioning, Linux and Windows administration, database and middleware setup, container orchestration, and endpoint security for teams that don't have a dedicated security function. The common thread is ownership: I take the part nobody wants — the migration, the hardening baseline, the flaky listener — and make it boring, documented, and reliable. Boring, where I come from, is the highest compliment you can pay a system." },
      { text:"I've learned the hard way that the demo is not the deliverable. A build that works once, by hand, on a good day, is a liability. So I script the bring-up, I instrument before I optimise, and I write the runbook as if the next person on call has never seen the system. Because usually, they haven't." },
      { text:"When I'm not deep in a deployment, I'm playing CTFs, breaking things on purpose in a homelab, and reading incident write-ups the way other people read novels. Security isn't a job function to me; it's a way of looking at every system I touch." },
    ],
    principles: [
      { t:"Observe first", d:"If a system can't be measured, it can't be trusted. Logs, metrics, and traces come before optimisation — always." },
      { t:"Design for 3am", d:"The real test isn't the demo. It's whether the on-call engineer can recover it half-asleep from the runbook alone." },
      { t:"Security by design", d:"Hardening is an input to the architecture, not a checkbox at the end. The threat model shapes the build." },
      { t:"Prove it", d:"Every claim earns a number. I'd rather show a measured result than a confident opinion." },
    ],
    education: [
      { when:"2028 (exp.)", title:"B.Sc. (Hons) Software Engineering", org:"University of Westminster", note:"in progress" },
      { when:"2026", title:"B.Sc. in Information Systems", org:"University of Colombo School of Computing", note:"IS · systems · security" },
      { when:"Always", title:"CTF &amp; Homelab", org:"Self-directed practice", note:"breaking things on purpose" },
    ],
  },

  /* ==========================================================================
     CONTACT PAGE
     ========================================================================== */
  contact: {
    headline: "Let's talk",
    lede: "Hiring, a gnarly infrastructure problem, or you just want to compare notes on hardening and homelabs — I read every message and reply to the real ones.",
    availability: "Available for new work",   // shows with a live dot
    responseTime: "Usually within 24–48h (faster if something's on fire)",
    coffee: "In Colombo or London? First coffee's on me — unless you order six shots, then we split it.",
    goodFit: [
      "Cloud / on-prem infrastructure that needs to be reliable",
      "Security hardening and endpoint baselines",
      "Migrations, deployments, and the docs to keep them alive",
      "Hard problems no one else wants to own",
    ],
    notFit: [
      "\"Make it work by hand, just this once\"",
      "Ship-and-forget with no observability",
      "Anything that begins with \"it's simple, just…\"",
    ],
  },
};

/* =============================================================================
   RENDER + BEHAVIOUR  (guarded so one file works on every page)
   ============================================================================= */
const $  = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>[...r.querySelectorAll(s)];
const accent = t => (t||"").replace(/\*(.+?)\*/g,'<em>$1</em>');
const set  = (id,val,html)=>{ const el=$("#"+id); if(el){ if(html) el.innerHTML=val; else el.textContent=val; } };

/* ---- identity (present on all pages) ---- */
set("brandName", CONFIG.brandTag);
set("tz", CONFIG.tzLabel);
if(!document.body.hasAttribute("data-keep-title")) document.title = CONFIG.firstName+" "+CONFIG.lastName+" — "+CONFIG.role;
$$("[data-mailto]").forEach(a=>{ a.href="mailto:"+CONFIG.email; if(a.hasAttribute("data-mail-text")) a.textContent=CONFIG.email; });
$$("[data-resume]").forEach(a=>a.href=CONFIG.resumeUrl);
set("footC", "© "+new Date().getFullYear()+" "+CONFIG.firstName+" "+CONFIG.lastName+" · no cookies, no trackers, no analytics — I genuinely have no idea you're here.");

/* ---- HOME hero ---- */
if($("#nameL1")){
  set("nameL1", CONFIG.firstName);
  set("nameL2", CONFIG.lastName+'<span class="dot">.</span>', true);
  set("thesis", CONFIG.thesis);
  set("roleMeta", "<b>"+CONFIG.role+"</b>", true);
  set("locMeta", CONFIG.location);
  set("statusMeta", CONFIG.status);
}

/* ---- marquee (any page that has one) ---- */
if($("#marquee")){
  const unit = '<span>Systems <em>·</em> Security <em>·</em> Infrastructure <em>·</em> DevOps <em>·</em></span>';
  const run = " " + Array(6).fill(unit).join("");
  set("marquee", run+run, true);
}

/* ---- socials (home + contact) ---- */
$$("[data-socials]").forEach(box=>{
  box.innerHTML = CONFIG.socials.map(s=>`<a href="${s.url}" target="_blank" rel="noopener" data-cursor>${s.label}</a>`).join("");
});

/* ---- HOME: projects / impact / dont / competencies / timeline / stack ---- */
if($("#projects")){
  set("workCount", "— "+CONFIG.projects.length+" PROJECTS (THE SHOWABLE ONES)");
  $("#projects").innerHTML = CONFIG.projects.map((p,i)=>`
    <article class="project reveal" data-i="${i}">
      <div class="project__head" data-cursor role="button" tabindex="0" aria-expanded="false">
        <span class="project__idx">0${i+1}</span>
        <div><h3 class="project__title">${p.title}</h3></div>
        <span class="project__yr">${p.year}<span class="plus">+</span></span>
      </div>
      <p class="project__sub">${p.role}</p>
      <p class="project__summary">${p.summary}</p>
      <div class="chips">${p.chips.map(c=>`<span class="chip"><b>${c.v}</b> ${c.l}</span>`).join("")}</div>
      <div class="project__detail">
        <div class="dcell"><h4>Context</h4><p>${p.context}</p></div>
        <div class="dcell"><h4>Approach</h4><p>${p.approach}</p></div>
        <div class="dcell"><h4>System</h4><p>${p.system}</p></div>
        <div class="dcell"><h4>Outcome</h4><p>${p.outcome}</p></div>
        <div class="dcell" style="grid-column:1/-1; margin-top:6px"><a class="btn" href="project.html?p=${i}" data-cursor>Read the full case study →</a></div>
      </div>
    </article>`).join("");
}
if($("#impactGrid")){
  $("#impactGrid").innerHTML = CONFIG.impact.map(s=>`
    <div class="stat"><div class="num">${accent(s.num)}</div><div class="lbl">${s.lbl}</div></div>`).join("");
}
if($("#dontList"))  $("#dontList").innerHTML  = CONFIG.dont.map(d=>`<li>${d}</li>`).join("");
if($("#compList"))  $("#compList").innerHTML  = CONFIG.competencies.map(c=>`<li>${c.name}<span class="c">${c.c}</span></li>`).join("");
if($("#timeline"))  $("#timeline").innerHTML  = CONFIG.experience.map(e=>`
    <div class="tl__item reveal">
      <div class="tl__when"><span class="${e.now?'now':''}">${e.when}</span></div>
      <div>
        <div class="tl__role">${e.role}</div>
        <div class="tl__co">${e.co}</div>
        <ul class="tl__pts">${e.points.map(pt=>`<li>${pt}</li>`).join("")}</ul>
      </div>
    </div>`).join("");
if($("#stackGrid")) $("#stackGrid").innerHTML = CONFIG.stack.map(g=>`
    <div class="stack-col reveal">
      <h4>${g.group}</h4>
      <ul>${g.items.map(it=>`<li>${it.n}<span>${it.q}</span></li>`).join("")}</ul>
    </div>`).join("");

/* ---- ABOUT page ---- */
if($("#aboutPage")){
  const A = CONFIG.about;
  set("aStatement", A.statement, true);
  set("aStandfirst", A.standfirst, true);
  set("aRole", CONFIG.role);
  set("aLoc", CONFIG.location);
  set("aCoords", A.coords);
  set("aStatus", CONFIG.status);
  // portrait
  const pt = $("#portrait");
  if(pt){
    if(A.photo){
      pt.innerHTML = `<img src="${A.photo}" alt="${CONFIG.firstName} ${CONFIG.lastName}, allegedly. (This is the alt text. Nice to meet the screen-reader crowd.)" />`;
    } else {
      pt.innerHTML = `<div class="portrait__ph"><span class="ic">⌷</span>
        <div>Add your portrait here<br><b>set about.photo</b> in app.js<br>(or don't — mysterious also works)</div></div>`;
    }
    pt.insertAdjacentHTML("beforeend",
      `<span class="tick tl"></span><span class="tick tr"></span><span class="tick bl"></span><span class="tick br"></span>
       <div class="portrait__cap"><b>${A.photoCaption}</b> — ${CONFIG.firstName} ${CONFIG.lastName}, ${CONFIG.location}</div>`);
  }
  // bio
  if($("#bio")) $("#bio").innerHTML = A.bio.map(p=>`<p class="${p.lede?'lede':''}">${p.text}</p>`).join("");
  // principles
  if($("#principles")) $("#principles").innerHTML = A.principles.map((p,i)=>`
    <div class="stat principle reveal"><div class="pn">0${i+1}</div><h3>${p.t}</h3><p>${p.d}</p></div>`).join("");
  // dont
  if($("#aDont")) $("#aDont").innerHTML = CONFIG.dont.map(d=>`<li>${d}</li>`).join("");
  // education
  if($("#education")) $("#education").innerHTML = A.education.map(e=>`
    <div class="edu__item reveal">
      <div class="edu__when">${e.when}</div>
      <div><div class="edu__title">${e.title}</div><div class="edu__org">${e.org}</div></div>
      <div class="edu__note">${e.note}</div>
    </div>`).join("");
}

/* ---- PROJECT (case study) page — one template renders any project via ?p=N ---- */
if($("#projectPage")){
  const params = new URLSearchParams(location.search);
  let idx = parseInt(params.get("p"),10);
  if(isNaN(idx) || idx<0 || idx>=CONFIG.projects.length) idx=0;
  const p = CONFIG.projects[idx];
  const n = CONFIG.projects.length;
  const pad = i => "0"+(i+1);

  set("cEyebrowN", pad(idx));
  set("pTitle", p.title);
  set("pTagline", p.tagline || p.summary);
  document.title = p.title+" — "+CONFIG.firstName+" "+CONFIG.lastName;
  // meta
  const meta = [["YEAR",p.year],["ROLE",p.role],["CLIENT",p.client||"—"],["DURATION",p.duration||"—"]];
  set("pMeta", meta.map(([k,v])=>`<span><span class="k">${k}</span> &nbsp;<span class="v">${v}</span></span>`).join(""), true);
  // chips
  if($("#pChips")) $("#pChips").innerHTML = (p.chips||[]).map(c=>`<span class="chip"><b>${c.v}</b> ${c.l}</span>`).join("");
  // tl;dr
  set("pTldr", p.summary);
  // cover
  const cov=$("#pCover");
  if(cov){ cov.innerHTML = `<div class="portrait__ph"><span class="ic">⌷</span><div>Cover image / architecture diagram<br><b>add it to gallery in app.js</b><br>(honestly, a diagram sells this harder than words)</div></div>
    <span class="tick tl"></span><span class="tick tr"></span><span class="tick bl"></span><span class="tick br"></span>
    <div class="portrait__cap"><b>FIG.00</b> — ${p.title}</div>`; }
  // narrative sections
  const secs=[["Context",p.context],["Approach",p.approach],["System",p.system],["Outcome",p.outcome]];
  if($("#pSections")) $("#pSections").innerHTML = secs.map((s,i)=>`
    <div class="case-section reveal"><div class="cs-k">${pad(i)} — ${s[0]}</div><p>${s[1]}</p></div>`).join("");
  // stack
  if($("#pStack")) $("#pStack").innerHTML = (p.stack||[]).map(s=>`<span class="chip">${s}</span>`).join("");
  // gallery
  if($("#pGallery")) $("#pGallery").innerHTML = (p.gallery||[]).map((cap,i)=>`
    <div class="portrait shot reveal">
      <div class="portrait__ph"><span class="ic">⌷</span><div>image slot<br><b>${cap}</b></div></div>
      <span class="tick tl"></span><span class="tick tr"></span><span class="tick bl"></span><span class="tick br"></span>
      <div class="portrait__cap"><b>FIG.${pad(i)}</b> — ${cap}</div>
    </div>`).join("");
  // lesson
  set("pLesson", p.lesson || "Nothing exploded that I'm willing to admit to in writing.");
  // prev / next
  const prev=(idx-1+n)%n, next=(idx+1)%n;
  set("pPrev", `<a href="project.html?p=${prev}" data-cursor>← ${CONFIG.projects[prev].title}</a>`, true);
  set("pNext", `<a href="project.html?p=${next}" data-cursor>${CONFIG.projects[next].title} →</a>`, true);
}

/* ---- CONTACT page ---- */
if($("#contactPage")){
  const C = CONFIG.contact;
  set("cHeadline", C.headline+'<span class="dot">.</span>', true);
  set("cLede", C.lede);
  set("cMail", CONFIG.email);
  const info = [
    ["EMAIL", CONFIG.email, false],
    ["LOCATION", CONFIG.location, false],
    ["LOCAL TIME", '<span id="cClock">--:--:--</span> '+CONFIG.tzLabel, true],
    ["AVAILABILITY", C.availability, "acc"],
    ["RESPONSE", C.responseTime, false],
  ];
  if($("#cInfo")) $("#cInfo").innerHTML = info.map(([k,v,cls])=>`
    <div class="info-row"><span class="k">${k}</span><span class="v ${cls==='acc'?'acc':''}">${v}</span></div>`).join("");
  if($("#cGood")) $("#cGood").innerHTML = C.goodFit.map(x=>`<li>${x}</li>`).join("");
  if($("#cNo"))   $("#cNo").innerHTML   = C.notFit.map(x=>`<li>${x}</li>`).join("");
  set("cCoffee", C.coffee);
}

/* =============================================================================
   SHARED INTERACTIONS
   ============================================================================= */
/* live clock(s) */
function clockStr(){
  try{ return new Date().toLocaleTimeString("en-GB",{hour12:false,timeZone:CONFIG.timezone}); }
  catch(e){ return new Date().toLocaleTimeString("en-GB",{hour12:false}); }
}
function tick(){ const t=clockStr(); const a=$("#clock"); if(a)a.textContent=t; const b=$("#cClock"); if(b)b.textContent=t; }
tick(); setInterval(tick,1000);

/* nav scrolled + scroll HUD */
const nav=$("#nav");
function onScroll(){
  const st=window.scrollY;
  if(nav) nav.classList.toggle("scrolled", st>40);
  const h=document.documentElement.scrollHeight-window.innerHeight;
  const s=$("#scrl"); if(s) s.textContent=(h>0?(st/h*100):0).toFixed(2);
}
window.addEventListener("scroll",onScroll,{passive:true}); onScroll();

/* reveal observer (run AFTER renders so injected .reveal nodes are caught) */
const io=new IntersectionObserver(es=>{es.forEach(e=>{ if(e.isIntersecting){e.target.classList.add("in"); io.unobserve(e.target);} })},{threshold:.12});
$$(".reveal").forEach(el=>io.observe(el));

/* theme */
const root=document.documentElement;
function setTheme(t){ root.setAttribute("data-theme",t); try{localStorage.setItem("theme",t);}catch(e){} }
setTheme((()=>{try{return localStorage.getItem("theme")}catch(e){return null}})() || (matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"));
if($("#themeToggle")) $("#themeToggle").addEventListener("click",()=>setTheme(root.getAttribute("data-theme")==="dark"?"light":"dark"));

/* mobile menu */
const overlay=$("#overlay");
function openMenu(v){ if(overlay){overlay.classList.toggle("open",v);} document.body.classList.toggle("no-scroll",v); }
if($("#menuBtn")) $("#menuBtn").addEventListener("click",()=>openMenu(true));
if($("#overlayClose")) $("#overlayClose").addEventListener("click",()=>openMenu(false));
$$("#overlay a").forEach(a=>a.addEventListener("click",()=>openMenu(false)));

/* project expand */
$$(".project__head").forEach(h=>{
  const toggle=()=>{ const p=h.closest(".project"); const open=p.classList.toggle("open"); h.setAttribute("aria-expanded",open); };
  h.addEventListener("click",toggle);
  h.addEventListener("keydown",e=>{ if(e.key==="Enter"||e.key===" "){e.preventDefault();toggle();} });
});

/* contact form -> mailto */
function wireForm(){
  const btn=$("#sendBtn"); if(!btn) return;
  btn.addEventListener("click",()=>{
    const n=($("#fname")||{}).value?.trim()||"", e=($("#femail")||{}).value?.trim()||"", m=($("#fmsg")||{}).value?.trim()||"";
    const topic=($("#ftopic")||{}).value||"";
    const subj=encodeURIComponent(`Portfolio enquiry${topic?` — ${topic}`:""}${n?` (${n})`:""}`);
    const body=encodeURIComponent(`${m}\n\n— ${n||"?"} (${e||"no email"})`);
    window.location.href=`mailto:${CONFIG.email}?subject=${subj}&body=${body}`;
  });
}
wireForm();

/* copy email */
$$("[data-copy-email]").forEach(b=>{
  b.addEventListener("click",async()=>{
    try{ await navigator.clipboard.writeText(CONFIG.email); }catch(e){}
    const old=b.textContent; b.textContent="✓ copied"; b.classList.add("done");
    setTimeout(()=>{ b.textContent=old; b.classList.remove("done"); },1600);
  });
});

/* custom cursor */
if(matchMedia("(hover:hover) and (pointer:fine)").matches){
  const dot=$("#cursor"), ring=$("#cursorRing");
  if(dot&&ring){
    let mx=innerWidth/2,my=innerHeight/2,rx=mx,ry=my;
    addEventListener("mousemove",e=>{
      mx=e.clientX; my=e.clientY;
      dot.style.transform=`translate(${mx}px,${my}px) translate(-50%,-50%)`;
      const c=$("#crsr"); if(c) c.textContent=(mx/innerWidth).toFixed(3)+" · "+(my/innerHeight).toFixed(3);
    });
    (function loop(){ rx+=(mx-rx)*.16; ry+=(my-ry)*.16; ring.style.transform=`translate(${rx}px,${ry}px) translate(-50%,-50%)`; requestAnimationFrame(loop); })();
    document.addEventListener("mouseover",e=>{ if(e.target.closest("[data-cursor],a,button,input,textarea,select,.project__head,.portrait")) ring.classList.add("hover"); });
    document.addEventListener("mouseout", e=>{ if(e.target.closest("[data-cursor],a,button,input,textarea,select,.project__head,.portrait")) ring.classList.remove("hover"); });
  }
}

/* =============================================================================
   TERMINAL (signature element, present on every page)
   ============================================================================= */
const term=$("#term"), termBody=$("#termBody"), termInput=$("#termInput");
function openTerm(v){ if(!term) return; term.classList.toggle("open",v); if(v) setTimeout(()=>termInput&&termInput.focus(),60); }
if($("#termLaunch")) $("#termLaunch").addEventListener("click",()=>openTerm(!term.classList.contains("open")));
$$("[data-open-term]").forEach(b=>b.addEventListener("click",()=>openTerm(true)));
if($("#termClose")) $("#termClose").addEventListener("click",()=>openTerm(false));

function tprint(html,cls=""){ if(!termBody) return; const d=document.createElement("div"); d.className="term__line "+cls; d.innerHTML=html; termBody.appendChild(d); termBody.scrollTop=termBody.scrollHeight; }
function techo(cmd){ tprint(`<span class="pr">➜ ~</span> ${cmd}`); }

const CMDS={
  help(){ return `Available commands:
  <span class="acc">whoami</span>     who is this
  <span class="acc">about</span>      the short version   ( <span class="mut">opens /about</span> )
  <span class="acc">work</span>       list projects        ( <span class="mut">work 1</span> for detail )
  <span class="acc">open</span>       open a case study    ( <span class="mut">open 1</span> )
  <span class="acc">impact</span>     the numbers          ( <span class="mut">opens /impact</span> )
  <span class="acc">skills</span>     the stack
  <span class="acc">xp</span>         experience           ( <span class="mut">opens /experience</span> )
  <span class="acc">contact</span>    how to reach me      ( <span class="mut">opens /contact</span> )
  <span class="acc">theme</span>      toggle light / dark
  <span class="acc">clear</span>      wipe the screen
  <span class="mut">try:</span> <span class="acc">sudo hire</span>  <span class="mut">·  there are a few undocumented ones. it's a security portfolio; go poke.</span>`; },
  whoami(){ return `${CONFIG.firstName} ${CONFIG.lastName} — ${CONFIG.role}\n<span class="mut">${CONFIG.location} · ${CONFIG.status}</span>`; },
  about(){ setTimeout(()=>location.href="about.html",600); return `${CONFIG.thesis}\n<span class="mut">opening /about …</span>`; },
  work(arg){
    if(arg){ const p=CONFIG.projects[(+arg)-1]; if(!p) return `<span class="mut">no project ${arg}. try: work 1–${CONFIG.projects.length}</span>`;
      return `<span class="acc">${p.title}</span> (${p.year}) — ${p.role}\n${p.summary}\n<span class="mut">outcome:</span> ${p.outcome}`; }
    return CONFIG.projects.map((p,i)=>`  <span class="acc">0${i+1}</span>  ${p.title} <span class="mut">— ${p.year}</span>`).join("\n")+`\n<span class="mut">→ type "work 1" for detail</span>`;
  },
  skills(){ return CONFIG.stack.map(g=>`<span class="acc">${g.group}</span>: `+g.items.map(i=>i.n).join(", ")).join("\n"); },
  xp(){ setTimeout(()=>location.href="experience.html",600); return CONFIG.experience.map(e=>`<span class="acc">${e.when}</span> — ${e.role}, ${e.co}`).join("\n")+`\n<span class="mut">opening /experience …</span>`; },
  impact(){ setTimeout(()=>location.href="impact.html",600); return CONFIG.impact.map(s=>`  <span class="acc">${s.num.replace(/\*/g,"")}</span>  ${s.lbl}`).join("\n")+`\n<span class="mut">opening /impact …</span>`; },
  contact(){ setTimeout(()=>location.href="contact.html",600); return `email: <span class="acc">${CONFIG.email}</span>\n<span class="mut">opening /contact …</span>`; },
  theme(){ setTheme(root.getAttribute("data-theme")==="dark"?"light":"dark"); return `theme → <span class="acc">${root.getAttribute("data-theme")}</span>`; },
  clear(){ if(termBody) termBody.innerHTML=""; return ""; },
  open(arg){ const i=(+arg)-1; if(isNaN(i)||!CONFIG.projects[i]) return `<span class="mut">usage: open 1–${CONFIG.projects.length}</span>`; setTimeout(()=>location.href="project.html?p="+i,500); return `opening case study: <span class="acc">${CONFIG.projects[i].title}</span> …`; },
  sudo(arg){ if((arg||"").includes("hire")){ setTimeout(()=>location.href="mailto:"+CONFIG.email,700); return `<span class="acc">Permission granted.</span> Opening mail client…`; } return `<span class="mut">nice try. this incident has been logged, timestamped, and quietly forgiven. 🙂</span>`; },
  /* ---- undocumented (the fun part) ---- */
  coffee(){ return `brewing… ☕  the only blocking operation I fully endorse.`; },
  ping(){ return `PONG. latency: <span class="acc">&lt;50ms</span> technically, emotionally instantaneous.`; },
  uptime(){ return `up 3 years, 0 unplanned reboots. <span class="mut">the office coffee machine cannot make the same claim.</span>`; },
  dns(){ return `<span class="acc">it was DNS.</span> <span class="mut">it is always DNS. one day it will not be DNS, and that day it will still, somehow, be DNS.</span>`; },
  ls(arg){ if((arg||"").includes("-a")||(arg||"").includes("-la")) return `.  ..  work/  <span class="mut">.secrets/</span>  <span class="mut">.env  (you wish)</span>`; return CONFIG.projects.map((p,i)=>`0${i+1}_${p.title.toLowerCase().replace(/[^a-z0-9]+/g,'-')}/`).join("   "); },
  cat(arg){ if((arg||"").includes("secret")||(arg||"").includes(".env")) return `<span class="mut">permission denied. hardening is a lifestyle, not a project.</span>`; return `<span class="mut">cat: ${arg||"?"}: no such file. try </span><span class="acc">help</span>`; },
  rm(arg){ if((arg||"").replace(/\s+/g,"").includes("-rf/")) return `<span class="acc">whoa.</span> <span class="mut">I keep backups precisely so this stopped being funny to me. request denied, with love.</span>`; return `<span class="mut">rm: refusing. see: backups, runbooks, therapy.</span>`; },
  man(){ return `<span class="mut">no manual pages here. that's the entire reason I write runbooks.</span>`; },
  exit(){ return `<span class="mut">there is no exit — this is a shell inside a portfolio inside a browser. (or: hire me. that's also an exit.)</span>`; },
  hello(){ return `hey. <span class="mut">type</span> <span class="acc">help</span> <span class="mut">if you're lost, or</span> <span class="acc">sudo hire</span> <span class="mut">if you're decisive.</span>`; },
};
function trun(raw){
  const [cmd,...rest]=raw.trim().split(/\s+/);
  if(!cmd) return; techo(raw);
  const fn=CMDS[cmd.toLowerCase()];
  if(fn){ const out=fn(rest.join(" ")); if(out) tprint(out); }
  else {
    const quips=[
      `command not found: ${cmd}. <span class="mut">have you tried turning it off and on again?</span>`,
      `${cmd}: not a command. <span class="mut">but I admire the confidence. try </span><span class="acc">help</span>`,
      `bash: ${cmd}: command not found. <span class="mut">(it was probably DNS.)</span>`,
      `${cmd}? <span class="mut">bold. unsupported, but bold. → </span><span class="acc">help</span>`,
    ];
    tprint(quips[Math.floor(Math.random()*quips.length)]);
  }
}
if(termBody) tprint(`<span class="mut">${CONFIG.firstName.toLowerCase()}@portfolio</span> — interactive shell. type <span class="acc">help</span> to start.`);
if(termInput){
  const hist=[]; let hp=-1;
  termInput.addEventListener("keydown",e=>{
    if(e.key==="Enter"){ const v=termInput.value; if(v.trim()){hist.push(v); hp=hist.length;} trun(v); termInput.value=""; }
    else if(e.key==="ArrowUp"){ if(hp>0){hp--; termInput.value=hist[hp]||"";} e.preventDefault(); }
    else if(e.key==="ArrowDown"){ if(hp<hist.length-1){hp++; termInput.value=hist[hp]||"";} else {hp=hist.length; termInput.value="";} e.preventDefault(); }
  });
}
/* terminal nudge (contact page) + global keys */
$$("[data-term-trigger]").forEach(el=>el.addEventListener("click",()=>openTerm(true)));
addEventListener("keydown",e=>{
  if(e.key==="`" && document.activeElement!==termInput){ e.preventDefault(); openTerm(!term||!term.classList.contains("open")); }
  if(e.key==="Escape"){ openTerm(false); openMenu(false); }
});

/* console easter egg — for the recruiter who opens devtools "just to check" */
try{
  const s1="font-family:monospace;font-size:13px;color:#f5b841";
  const s2="font-family:monospace;font-size:12px;color:#8b909a";
  console.log("%c$ whoami","font-family:monospace;color:#8b909a");
  console.log("%c"+CONFIG.firstName+" "+CONFIG.lastName+" — "+CONFIG.role, s1);
  console.log("%cYou opened the console. Either you're a recruiter who codes or you're\nsimply nosy — both are, frankly, hireable traits.", s2);
  console.log("%cThe site is hand-written. No framework, no tracker, no analytics.\nI don't actually know you're reading this. Prove me wrong: %c"+CONFIG.email, s2, s1);
  console.log("%cPS — it was DNS. It's always DNS.", s2);
}catch(e){}
