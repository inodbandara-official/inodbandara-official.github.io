/* run fn once the first-visit intro (boot.js + bottom of this file) has finished */
const afterIntro=fn=>document.documentElement.classList.contains("intro")
  ? addEventListener("intro:done",fn,{once:true}) : fn();

/* =============================================================================
   ██  CONFIG  —  THE ONLY PLACE YOU NEED TO EDIT.
   Shared by index.html, about.html and contact.html. Change a value once and
   every page updates. Add your portrait by setting  about.photo  below.
   ============================================================================= */
const CONFIG = {
  /* ---- identity ---- */
  firstName: "Inod",
  lastName:  "Bandara",
  brandTag:  "PORTFOLIO",
  role:      "Systems & DevOps Engineer",
  thesis:    "Not the box in the diagram — the system that keeps standing when the load, the outage, and the attacker all arrive at once.",
  location:  "Colombo, SL",
  timezone:  "Asia/Colombo",   // IANA name for the live clock
  tzLabel:   "+0530",
  status:    "Will work for Pizza",
  email:     "officialinod@gmail.com",
  resumeUrl: "resume.pdf",
  socials: [
    { label: "GitHub",   url: "https://github.com/inodbandara-official" },
    { label: "LinkedIn", url: "https://www.linkedin.com/in/inod-bandara-555722228/" },
    { label: "Location", url: "https://www.google.com/maps/place/Fort+America+Pentagon/@38.8707289,-77.0555936,19z" },
  ],

  /* ---- selected work ----  (each entry powers /work/<slug>, ?p=N still works) ---- */
  projects: [
    {
      title: "IFS Cloud 25R2 Rollout",
      slug: "ifs-cloud-25r2-rollout",
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
      slug: "remote-laptop-hardening",
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
      slug: "cloud-fleet-consolidation",
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
    { when:"2025 - 2026", role:"Artificial Intelligence Researcher", co:"University of Colombo School of Computing",
      points:[ "Applied ML research for Rasaswadaya — experimentation, evaluation and turning models into something that actually runs.",
               "Bridged research and infrastructure: reproducible pipelines and the plumbing around the Hybrid Recommendation model." ] },
    { when:"2024 — 2025", role:"Software Engineer", co:"Applova Inc",
      points:[ "Cloud VM fleet management and cost optimisation.",
               "Linux and Windows server builds, backups, and monitoring." ] },
    { when:"2022 - 2023", role:"Associate Network Engineer", co:"Cyber Craft (PVT) Ltd",
      points:[ "Configured, monitored, and troubleshot network infrastructure across client environments.",
               "Hands-on with switching, routing, and the security layer where the systems interest began." ] },
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

  /* ---- development stack (icon wall on /stack). Delete any line you don't want.
     s = devicon path segment: "<folder>/<file>" (no .svg). Broken ones fall back. ---- */
  /*deleted lines {n:"Ruby", s:"ruby/ruby-original"}, {n:"Rust", s:"rust/rust-original"}, {n:"Kotlin", s:"kotlin/kotlin-original"},*/
  /*deleted lines {n:"Django", s:"django/django-plain"}, {n:"Flask", s:"flask/flask-original"}, */
  /*{n:"MariaDB", s:"mariadb/mariadb-original"}, */
  /*{n:"Ansible", s:"ansible/ansible-original"}, {n:"Jenkins", s:"jenkins/jenkins-original"},*/
  techStack: [
    { group:"Languages", items:[
      {n:"Python", s:"python/python-original"}, {n:"JavaScript", s:"javascript/javascript-original"},
      {n:"TypeScript", s:"typescript/typescript-original"}, {n:"Java", s:"java/java-original"},
      {n:"C", s:"c/c-original"}, {n:"C++", s:"cplusplus/cplusplus-original"},
      {n:"C#", s:"csharp/csharp-original"}, {n:"PHP", s:"php/php-original"},
      {n:"Go", s:"go/go-original-wordmark"}, {n:"Bash", s:"bash/bash-original"} ] },
    { group:"Frameworks & Libraries", items:[
      {n:"Node.js", s:"nodejs/nodejs-original"}, {n:"Express", s:"express/express-original"},
      {n:"React", s:"react/react-original"}, {n:"Next.js", s:"nextjs/nextjs-original"},
      {n:"Vue", s:"vuejs/vuejs-original"}, {n:"Angular", s:"angularjs/angularjs-original"},
      {n:"Spring", s:"spring/spring-original"}, {n:".NET", s:"dot-net/dot-net-original"},
      {n:"Laravel", s:"laravel/laravel-original"}, {n:"Tailwind", s:"tailwindcss/tailwindcss-original"} ] },
    { group:"Databases", items:[
      {n:"MySQL", s:"mysql/mysql-original"}, {n:"PostgreSQL", s:"postgresql/postgresql-original"},
      {n:"MongoDB", s:"mongodb/mongodb-original"}, {n:"Redis", s:"redis/redis-original"},
      {n:"SQLite", s:"sqlite/sqlite-original"}, {n:"Oracle", s:"oracle/oracle-original"},
      {n:"SQL Server", s:"microsoftsqlserver/microsoftsqlserver-plain"} ] },
    { group:"DevOps & Tools", items:[
      {n:"Docker", s:"docker/docker-original"}, {n:"Kubernetes", s:"kubernetes/kubernetes-plain"},
      {n:"Git", s:"git/git-original"}, {n:"GitHub", s:"github/github-original"},
      {n:"Linux", s:"linux/linux-original"}, {n:"Nginx", s:"nginx/nginx-original"},
      {n:"AWS", s:"amazonwebservices/amazonwebservices-original-wordmark"} ] },
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

/* clean case-study URLs: /work/<slug>. Each project can set its own `slug`;
   anything without one falls back to a slug derived from its title. */
const slugify  = s => (s||"").toString().toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
const projSlug = p => (p && p.slug) ? p.slug : slugify(p && p.title);

/* cosmetic clean URLs: GitHub Pages serves /contact for contact.html, so strip
   any stray ".html" (or "/index.html") from the address bar without reloading. */
try{
  let p=location.pathname;
  if(/\/index\.html$/.test(p)) p=p.replace(/index\.html$/,'');
  else if(/\.html$/.test(p))    p=p.replace(/\.html$/,'');
  if(p!==location.pathname) history.replaceState(null,'',p+location.search+location.hash);
}catch(e){}

/* ---- identity (present on all pages) ---- */
set("brandName", CONFIG.brandTag);
set("tz", CONFIG.tzLabel);
if(!document.body.hasAttribute("data-keep-title")) document.title = CONFIG.firstName+" "+CONFIG.lastName;
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
  const unit = '<span>Systems <em>·</em> DevOps <em>·</em> Security <em>·</em> Infrastructure <em>·</em> Developer <em>·</em></span>';
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
        <div class="dcell" style="grid-column:1/-1; margin-top:6px"><a class="btn" href="/work/${projSlug(p)}" data-cursor>Read the full case study →</a></div>
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

/* ---- STACK page: icon wall (devicon via CDN, graceful fallback) ---- */
if($("#techGrid")){
  $("#techGrid").innerHTML = CONFIG.techStack.map(g=>`
    <div class="tech-group reveal">
      <h4>${g.group} <span class="tg-count">${g.items.length}</span></h4>
      <div class="tech-grid">
        ${g.items.map((it,i)=>`
          <div class="tech" title="${it.n}">
            <span class="tk-idx">${String(i+1).padStart(2,"0")}</span>
            <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${it.s}.svg" alt="${it.n}" loading="lazy"
                 onerror="this.closest('.tech').classList.add('noicon')" />
            <span class="tk-n">${it.n}</span>
          </div>`).join("")}
      </div>
    </div>`).join("");
}

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
  let idx = -1;
  /* 1) preferred: a slug in the path, e.g. /work/ifs-cloud-25r2-rollout */
  const m = location.pathname.match(/\/work\/([^\/?#]+)/);
  if(m){
    const slug = decodeURIComponent(m[1]).replace(/\.html$/,"").replace(/\/$/,"");
    idx = CONFIG.projects.findIndex(pr => projSlug(pr) === slug);
  }
  /* 2) fallback: ?p=N (old links + any host without rewrites still work) */
  if(idx < 0){ const q = parseInt(params.get("p"),10); if(!isNaN(q)) idx = q; }
  /* 3) default to the first project */
  if(idx < 0 || idx >= CONFIG.projects.length) idx = 0;
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
  set("pPrev", `<a href="/work/${projSlug(CONFIG.projects[prev])}" data-cursor>← ${CONFIG.projects[prev].title}</a>`, true);
  set("pNext", `<a href="/work/${projSlug(CONFIG.projects[next])}" data-cursor>${CONFIG.projects[next].title} →</a>`, true);
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
afterIntro(()=>$$(".reveal").forEach(el=>io.observe(el)));

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

/* custom cursor — glass lens + ink trail
   ring  : a small glass lens (backdrop blur/saturate) on a critically-damped spring.
           Over buttons/links it morphs to hug the element; over text fields it
           becomes a caret; over large clickable areas it swells.
   dot   : precise pointer, hides while the lens is wrapped around something.
   ink   : soft smoke wisps shed by movement that curl, spread and dissolve.
   click : the lens squeezes and releases, and a slow ring of ink breathes out. */
if(matchMedia("(hover:hover) and (pointer:fine)").matches){
  const dot=$("#cursor"), ring=$("#cursorRing");
  if(dot&&ring){
    const d=document.documentElement, still=matchMedia("(prefers-reduced-motion:reduce)").matches;
    d.classList.add("has-cursor");
    let mx=innerWidth/2, my=innerHeight/2, seen=false;

    /* palette -> rgb (canvas converts oklch/hsl/anything) */
    const probe=document.createElement("i"); probe.style.display="none"; document.body.appendChild(probe);
    const px=document.createElement("canvas").getContext("2d",{willReadFrequently:true});
    const rgbOf=n=>{ probe.style.color=`var(${n})`; px.clearRect(0,0,1,1); px.fillStyle="#a77bff"; px.fillStyle=getComputedStyle(probe).color; px.fillRect(0,0,1,1);
      return [...px.getImageData(0,0,1,1).data].slice(0,3); };
    let stops=[];
    const readStops=()=>{ stops=["--c-cyan","--c-blue","--c-violet","--c-pink"].map(rgbOf); };
    readStops(); new MutationObserver(readStops).observe(d,{attributes:true,attributeFilter:["data-theme"]});
    const mix=t=>{ t=((t%1)+1)%1; const f=t*stops.length, i=Math.floor(f), k=f-i, A=stops[i], B=stops[(i+1)%stops.length];
      return A.map((v,j)=>Math.round(v+(B[j]-v)*k)); };
    const dark=()=>d.getAttribute("data-theme")!=="light";

    /* spring helper: critically-damped-ish, frame-rate independent */
    const spring=(s,target,k,damp,dt)=>{ s.v+=(target-s.x)*k*dt; s.v*=Math.pow(damp,dt); s.x+=s.v*dt; };
    const S=v=>({x:v,v:0});
    const P={x:S(mx),y:S(my),w:S(36),h:S(36),r:S(18)};

    /* what the cursor is over */
    const MAG="a,button,.btn,[data-cursor],.copy-btn,.toggle,.menu-btn,label[for]";
    const TEXT="input:not([type=checkbox]):not([type=radio]):not([type=submit]):not([type=button]),textarea,[contenteditable=true]";
    let target=null, mode="free", tint=null;
    const pick=el=>{
      if(!el||!el.closest) return ["free",null];
      if(el.closest(TEXT)) return ["text",el.closest(TEXT)];
      const m=el.closest(MAG);
      if(m){ const r=m.getBoundingClientRect(); return (r.width<440&&r.height<120)?["wrap",m]:["big",m]; }
      if(el.closest(".project__head,.portrait,.tech,.stat,.principle")) return ["big",el];
      return ["free",null];
    };
    document.addEventListener("mouseover",e=>{
      [mode,target]=pick(e.target);
      const h=e.target.closest&&e.target.closest("[style*='--hc']");
      tint=h? getComputedStyle(h).getPropertyValue("--hc").trim()||null : null;
    });
    document.addEventListener("mouseleave",()=>{ ring.style.opacity=dot.style.opacity="0"; seen=false; });
    addEventListener("mousemove",e=>{
      mx=e.clientX; my=e.clientY;
      if(!seen){ seen=true; P.x.x=mx; P.y.x=my; ring.style.opacity=dot.style.opacity=""; }
      const c=$("#crsr"); if(c) c.textContent=(mx/innerWidth).toFixed(3)+" · "+(my/innerHeight).toFixed(3);
    },{passive:true});
    /* content can move under a still mouse (scroll, reveal, layout) — re-check what is underneath */
    const repick=()=>{ if(seen) [mode,target]=pick(document.elementFromPoint(mx,my)); };
    addEventListener("scroll",repick,{passive:true});

    /* ink layer */
    const cv=document.createElement("canvas"); cv.className="cursor-trail"; document.body.appendChild(cv);
    const cx=cv.getContext("2d");
    const fit=()=>{ const q=Math.min(devicePixelRatio||1,2); cv.width=innerWidth*q; cv.height=innerHeight*q; cx.setTransform(q,0,0,q,0,0); };
    fit(); addEventListener("resize",fit);
    const ink=[]; let phase=0, lx=mx, ly=my, press=0, t=0;
    const puff=(x,y,vx,vy,size,life)=>{ if(ink.length<110) ink.push({x,y,vx,vy,s:size,life,max:life,c:phase+Math.random()*.25,seed:Math.random()*100}); };

    addEventListener("mousedown",e=>{
      press=1;
      if(still) return;
      for(let i=0;i<14;i++){ const a=i/14*Math.PI*2; puff(e.clientX,e.clientY,Math.cos(a)*1.4,Math.sin(a)*1.4,8,70); }
    });

    let last=performance.now();
    (function loop(now){
      const dt=Math.min((now-last)/16.667,3); last=now; t+=dt; phase+=.0009*dt;

      /* targets for the lens */
      let tx=mx, ty=my, tw=36, th=36, tr=18;
      if((mode==="wrap"||mode==="big")&&target){ const r=target.getBoundingClientRect();
        if(!target.isConnected||mx<r.left-12||mx>r.right+12||my<r.top-12||my>r.bottom+12) repick(); }
      if(mode==="wrap"&&target){ const r=target.getBoundingClientRect(), pad=7;
        const pull=.12;   /* lens drifts a little toward the pointer while wrapped: feels magnetic, not stuck */
        tx=r.left+r.width/2+(mx-(r.left+r.width/2))*pull; ty=r.top+r.height/2+(my-(r.top+r.height/2))*pull;
        tw=r.width+pad*2; th=r.height+pad*2;
        tr=Math.min(th/2, parseFloat(getComputedStyle(target).borderRadius)+pad||10); }
      else if(mode==="text"){ tw=3; th=26; tr=2; }
      else if(mode==="big"){ tw=th=74; tr=37; }
      press*=Math.pow(.86,dt);
      const sq=1-press*.28;

      spring(P.x,tx,.32,.62,dt); spring(P.y,ty,.32,.62,dt);
      spring(P.w,tw*sq,.24,.6,dt); spring(P.h,th*sq,.24,.6,dt); spring(P.r,tr,.24,.6,dt);

      /* subtle squash along travel when free — reads as a liquid lens, not a stretched ellipse */
      const vx=P.x.v, vy=P.y.v, speed=Math.hypot(vx,vy);
      const st=mode==="free"?Math.min(speed/40,.22):0, ang=Math.atan2(vy,vx)*180/Math.PI;
      const breathe=mode==="free"&&speed<.3?1+Math.sin(t*.05)*.035:1;
      const w=Math.max(P.w.x,2), h=Math.max(P.h.x,2);
      ring.style.width=w+"px"; ring.style.height=h+"px"; ring.style.borderRadius=Math.max(P.r.x,1)+"px";
      ring.style.transform=`translate(${P.x.x-w/2}px,${P.y.x-h/2}px) rotate(${st?ang:0}deg) scale(${(1+st)*breathe},${(1-st*.6)*breathe})`;
      const col=tint||`rgb(${mix(phase)})`;
      ring.style.setProperty("--ring-c",col);
      ring.classList.toggle("is-wrap",mode==="wrap"); ring.classList.toggle("is-text",mode==="text");
      dot.style.transform=`translate(${mx}px,${my}px) translate(-50%,-50%)`;
      dot.style.opacity=(mode==="wrap"||mode==="text")?"0":"";
      dot.style.background=col;

      /* ink */
      cx.clearRect(0,0,innerWidth,innerHeight);
      if(!still){
        const dx=mx-lx, dy=my-ly, dist=Math.hypot(dx,dy);
        if(dist>2&&mode!=="text"){ const n=Math.min(Math.ceil(dist/9),6);
          for(let i=0;i<n;i++){ const f=i/n;
            puff(lx+dx*f,ly+dy*f,dx*.04+(Math.random()-.5)*.5,dy*.04+(Math.random()-.5)*.5,2+Math.random()*2.5,46+Math.random()*30); } }
        lx=mx; ly=my;
        cx.globalCompositeOperation=dark()?"lighter":"multiply";
        for(let i=ink.length-1;i>=0;i--){ const p=ink[i];
          /* cheap curl-ish flow field: smoke folds and rolls instead of drifting straight */
          const a=Math.sin(p.x*.012+p.seed+t*.02)*Math.cos(p.y*.011-t*.017)*Math.PI*2;
          p.vx=(p.vx+Math.cos(a)*.045)*.965; p.vy=(p.vy+Math.sin(a)*.045-.012)*.965;
          p.x+=p.vx*dt; p.y+=p.vy*dt; p.life-=dt;
          if(p.life<=0){ ink.splice(i,1); continue; }
          const k=p.life/p.max, age=1-k, r=p.s+age*age*26;
          const c=mix(p.c), al=(dark()?.16:.10)*Math.sin(Math.min(age*6,1)*Math.PI/2)*k;
          const g=cx.createRadialGradient(p.x,p.y,0,p.x,p.y,r);
          g.addColorStop(0,`rgba(${c},${al})`); g.addColorStop(.55,`rgba(${c},${al*.45})`); g.addColorStop(1,`rgba(${c},0)`);
          cx.fillStyle=g; cx.beginPath(); cx.arc(p.x,p.y,r,0,Math.PI*2); cx.fill(); }
        cx.globalCompositeOperation="source-over";
      }
      requestAnimationFrame(loop);
    })(last);
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
  <span class="acc">stack</span>      the toolbox          ( <span class="mut">opens /stack</span> )
  <span class="acc">skills</span>     list the stack inline
  <span class="acc">xp</span>         experience           ( <span class="mut">opens /experience</span> )
  <span class="acc">contact</span>    how to reach me      ( <span class="mut">opens /contact</span> )
  <span class="acc">theme</span>      toggle light / dark
  <span class="acc">clear</span>      wipe the screen
  <span class="mut">try:</span> <span class="acc">sudo hire</span>  <span class="mut">·  there are a few undocumented ones. it's a security portfolio; go poke.</span>`; },
  whoami(){ return `${CONFIG.firstName} ${CONFIG.lastName} — ${CONFIG.role}\n<span class="mut">${CONFIG.location} · ${CONFIG.status}</span>`; },
  about(){ setTimeout(()=>location.href="/about",600); return `${CONFIG.thesis}\n<span class="mut">opening /about …</span>`; },
  work(arg){
    if(arg){ const p=CONFIG.projects[(+arg)-1]; if(!p) return `<span class="mut">no project ${arg}. try: work 1–${CONFIG.projects.length}</span>`;
      return `<span class="acc">${p.title}</span> (${p.year}) — ${p.role}\n${p.summary}\n<span class="mut">outcome:</span> ${p.outcome}`; }
    return CONFIG.projects.map((p,i)=>`  <span class="acc">0${i+1}</span>  ${p.title} <span class="mut">— ${p.year}</span>`).join("\n")+`\n<span class="mut">→ type "work 1" for detail</span>`;
  },
  skills(){ return CONFIG.stack.map(g=>`<span class="acc">${g.group}</span>: `+g.items.map(i=>i.n).join(", ")).join("\n"); },
  xp(){ setTimeout(()=>location.href="/experience",600); return CONFIG.experience.map(e=>`<span class="acc">${e.when}</span> — ${e.role}, ${e.co}`).join("\n")+`\n<span class="mut">opening /experience …</span>`; },
  impact(){ setTimeout(()=>location.href="/impact",600); return CONFIG.impact.map(s=>`  <span class="acc">${s.num.replace(/\*/g,"")}</span>  ${s.lbl}`).join("\n")+`\n<span class="mut">opening /impact …</span>`; },
  contact(){ setTimeout(()=>location.href="/contact",600); return `email: <span class="acc">${CONFIG.email}</span>\n<span class="mut">opening /contact …</span>`; },
  theme(){ setTheme(root.getAttribute("data-theme")==="dark"?"light":"dark"); return `theme → <span class="acc">${root.getAttribute("data-theme")}</span>`; },
  clear(){ if(termBody) termBody.innerHTML=""; return ""; },
  stack(){ setTimeout(()=>location.href="/stack",600); return `<span class="mut">opening /stack — the toolbox …</span>`; },
  open(arg){ const i=(+arg)-1; if(isNaN(i)||!CONFIG.projects[i]) return `<span class="mut">usage: open 1–${CONFIG.projects.length}</span>`; setTimeout(()=>location.href="/work/"+projSlug(CONFIG.projects[i]),500); return `opening case study: <span class="acc">${CONFIG.projects[i].title}</span> …`; },
  sudo(arg){ if((arg||"").includes("hire")){ setTimeout(()=>location.href="mailto:"+CONFIG.email,700); return `<span class="acc">Permission granted.</span> Opening mail client…`; } return `<span class="mut">nice try. this incident has been logged, timestamped, and quietly forgiven. 🙂</span>`; },
  /* ---- undocumented (the fun part) ---- */
  coffee(){ return `brewing… ☕  the only blocking operation I fully endorse.`; },
  ping(){ return `PONG. latency: <span class="acc">&lt;50ms</span> technically, emotionally instantaneous.`; },
  uptime(){ return `up 3 years, 0 unplanned reboots. <span class="mut">the office coffee machine cannot make the same claim.</span>`; },
  dns(){ return `<span class="acc">it was DNS.</span> <span class="mut">it is always DNS. one day it will not be DNS, and that day it will still, somehow, be DNS.</span>`; },
  ls(arg){ if((arg||"").includes("-a")||(arg||"").includes("-la")) return `.  ..  work/  <span class="mut">.secrets/</span>  <span class="mut">.env  (you wish)</span>`; return CONFIG.projects.map((p,i)=>`0${i+1}_${projSlug(p)}/`).join("   "); },
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

/* hover tint — each text line / card takes a fresh gradient while the cursor is on it */
(()=>{
  if(!matchMedia("(hover:hover) and (pointer:fine)").matches) return;
  const TARGETS="main :is(p,li,h1,h2,h3,h4,h5,h6,blockquote,dt,dd,td,th,figcaption,.project,.stat,.chip,.dcell,.tech,.principle,.stack-col,.lesson,.tldr,.diag,.fit,.tl > *,hr)";
  const GRADS=[["ocean","blue"],["dusk","pink"],["ember","pink"],["iris","violet"],["main","violet"]];
  let last=-1;
  document.addEventListener("mouseover",e=>{
    const el=e.target.closest(TARGETS);
    if(!el || el.closest(".term,.overlay,.nav") || el.contains(e.relatedTarget)) return;
    let i; do{ i=Math.floor(Math.random()*GRADS.length); }while(i===last);
    last=i;
    el.style.setProperty("--hg","var(--g-"+GRADS[i][0]+")");
    el.style.setProperty("--hc","var(--c-"+GRADS[i][1]+")");
  });
})();

/* spotlight — cards track the cursor so their radial glow follows it */
(()=>{
  if(!matchMedia("(hover:hover) and (pointer:fine)").matches) return;
  const CARDS=".project,.stat,.chip,.dcell,.tech,.principle,.stack-col,.lesson,.tldr,.diag,.fit,.tl > *";
  document.addEventListener("mousemove",e=>{
    const el=e.target.closest&&e.target.closest("main :is("+CARDS+")");
    if(!el) return;
    const r=el.getBoundingClientRect();
    el.style.setProperty("--mx",(e.clientX-r.left)+"px");
    el.style.setProperty("--my",(e.clientY-r.top)+"px");
  },{passive:true});
})();

/* parallax — background glow and grid lean away from the cursor; a soft light follows it */
(()=>{
  if(!matchMedia("(hover:hover) and (pointer:fine)").matches) return;
  if(matchMedia("(prefers-reduced-motion:reduce)").matches) return;
  const root=document.documentElement;
  const light=document.createElement("div"); light.className="bg-light"; document.body.prepend(light);
  let tx=0,ty=0,x=0,y=0;
  addEventListener("mousemove",e=>{ tx=e.clientX/innerWidth-.5; ty=e.clientY/innerHeight-.5; },{passive:true});
  (function tick(){
    x+=(tx-x)*.05; y+=(ty-y)*.05;
    root.style.setProperty("--px",x.toFixed(4)); root.style.setProperty("--py",y.toFixed(4));
    light.style.setProperty("--lx",((x+.5)*innerWidth).toFixed(1)+"px"); light.style.setProperty("--ly",((y+.5)*innerHeight).toFixed(1)+"px");
    requestAnimationFrame(tick);
  })();
})();

/* scramble — headings decode from random glyphs the first time they scroll into view */
(()=>{
  if(matchMedia("(prefers-reduced-motion:reduce)").matches || !("IntersectionObserver" in window)) return;
  const GLYPHS="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&/<>_*";
  const rand=()=>GLYPHS[Math.floor(Math.random()*GLYPHS.length)];
  const scramble=el=>{
    const nodes=[]; const w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
    while(w.nextNode()) if(w.currentNode.nodeValue.trim()) nodes.push({n:w.currentNode,t:w.currentNode.nodeValue});
    const total=nodes.reduce((a,o)=>a+o.t.length,0); if(!total) return;
    const dur=Math.min(1100,350+total*22), t0=performance.now();
    el.classList.add("scrambling");
    el.style.height=el.getBoundingClientRect().height+"px";   /* random glyphs are wider: lock height so nothing below jumps */
    (function frame(now){
      const p=Math.min((now-t0)/dur,1), done=Math.floor(p*total);
      let k=0;
      for(const o of nodes){
        let out="";
        for(const ch of o.t){ out+=(k<done||/\s/.test(ch))?ch:(/[a-z]/.test(ch)?rand().toLowerCase():rand()); k++; }
        o.n.nodeValue=out;
      }
      if(p<1) requestAnimationFrame(frame); else { nodes.forEach(o=>o.n.nodeValue=o.t); el.classList.remove("scrambling"); el.style.height=""; }
    })(t0);
  };
  const io=new IntersectionObserver(es=>es.forEach(en=>{ if(en.isIntersecting){ io.unobserve(en.target); scramble(en.target); } }),{threshold:.4});
  afterIntro(()=>document.querySelectorAll("main :is(h1,h2,h3)").forEach(h=>io.observe(h)));
})();

/* =============================================================================
   MOTION LAYER — tilt cards, staggered reveals, scroll-progress frame,
   page transitions, first-visit intro
   ============================================================================= */
const FINE=matchMedia("(hover:hover) and (pointer:fine)").matches;
const STILL=matchMedia("(prefers-reduced-motion:reduce)").matches;

/* 3D tilt — cards lean toward the cursor; the spotlight glow doubles as the shine */
(()=>{
  if(!FINE||STILL) return;
  const SEL="main :is(.tech,.stat,.principle,.dcell,.lesson,.fit,.stack-col,.tldr,.portrait)";
  let cur=null;
  const reset=el=>{ el.style.transform=""; el.classList.remove("tilting"); };
  document.addEventListener("mousemove",e=>{
    const el=e.target.closest&&e.target.closest(SEL);
    if(cur&&cur!==el){ reset(cur); cur=null; }
    if(!el) return;
    cur=el; el.classList.add("tilting");
    const r=el.getBoundingClientRect(), x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5;
    const max=r.width>420?4:9;
    el.style.transform=`perspective(900px) rotateX(${(-y*max).toFixed(2)}deg) rotateY(${(x*max).toFixed(2)}deg) translateY(-4px)`;
  },{passive:true});
  document.addEventListener("mouseleave",()=>{ if(cur){ reset(cur); cur=null; } });
})();

/* staggered reveals — individual cards / rows rise in one after another */
(()=>{
  if(STILL||!("IntersectionObserver" in window)) return;
  const SEL="main :is(.project,.stat,.principle,.tech,.dcell,.chip,.lesson,.stack-col,.fit,.comp li,.tl > *,.edu > *,.case-section,.stack-col li,.info-row)";
  const els=[...document.querySelectorAll(SEL)].filter(el=>!el.classList.contains("reveal"));
  const set=new Set(els);
  els.forEach(el=>{
    const sib=[...el.parentElement.children].filter(c=>set.has(c));
    el.style.setProperty("--rv-d",(Math.min(sib.indexOf(el),10)*70)+"ms");
    el.classList.add("rv");
  });
  const io=new IntersectionObserver(es=>es.forEach(en=>{
    if(!en.isIntersecting) return;
    const el=en.target; io.unobserve(el); el.classList.add("in");
    setTimeout(()=>el.classList.add("rv-done"),1400);   /* drop the delay so hover effects react instantly */
  }),{threshold:.12, rootMargin:"0px 0px -6% 0px"});
  afterIntro(()=>els.forEach(el=>io.observe(el)));
})();

/* scroll progress — a gradient line traces the page border clockwise as you scroll */
(()=>{
  const ns="http://www.w3.org/2000/svg";
  const svg=document.createElementNS(ns,"svg"); svg.setAttribute("class","frame"); svg.setAttribute("aria-hidden","true");
  svg.innerHTML=`<defs><linearGradient id="frameGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" style="stop-color:var(--c-cyan)"/><stop offset=".5" style="stop-color:var(--c-violet)"/><stop offset="1" style="stop-color:var(--c-pink)"/>
    </linearGradient></defs><rect class="frame-track"/><rect class="frame-fill" pathLength="1"/>`;
  document.body.appendChild(svg);
  const rects=svg.querySelectorAll("rect"), fill=rects[1];
  const size=()=>{ const w=document.documentElement.clientWidth, h=document.documentElement.clientHeight, s=1.5;
    svg.setAttribute("viewBox",`0 0 ${w} ${h}`);
    rects.forEach(r=>{ r.setAttribute("x",s); r.setAttribute("y",s); r.setAttribute("width",Math.max(w-s*2,0)); r.setAttribute("height",Math.max(h-s*2,0)); }); };
  const prog=()=>{ const max=document.documentElement.scrollHeight-innerHeight;
    const p=max>0?Math.min(Math.max(scrollY/max,0),1):0;
    fill.style.strokeDasharray=`${p} 1`; };
  size(); prog();
  addEventListener("resize",()=>{ size(); prog(); });
  addEventListener("scroll",prog,{passive:true});
})();

/* page transitions — layered gradient wipe between internal pages */
(()=>{
  const d=document.documentElement;
  if(d.classList.contains("pt-in")) setTimeout(()=>d.classList.remove("pt-in"),1000);
  addEventListener("pageshow",e=>{ if(e.persisted) d.classList.remove("pt-leave"); });
  if(STILL) return;
  document.addEventListener("click",e=>{
    const a=e.target.closest&&e.target.closest("a[href]");
    if(!a||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey) return;
    if((a.target&&a.target!=="_self")||a.hasAttribute("download")) return;
    const url=new URL(a.href,location.href);
    if(url.origin!==location.origin||!/^https?:$/.test(url.protocol)) return;
    if(url.pathname===location.pathname&&url.search===location.search) return;   /* same page / hash links */
    e.preventDefault();
    try{ sessionStorage.setItem("pt","1"); }catch(_){}
    d.classList.add("pt-leave");
    setTimeout(()=>{ location.href=url.href; },640);
  });
})();

/* first-visit intro — name decodes, counter boots, gradient sweeps, curtain lifts */
(()=>{
  const d=document.documentElement;
  if(!d.classList.contains("intro")) return;
  try{ sessionStorage.setItem("introSeen","1"); }catch(e){}
  const name=(CONFIG.firstName+" "+CONFIG.lastName).toUpperCase();
  const el=document.createElement("div"); el.className="intro-screen"; el.setAttribute("aria-hidden","true");
  el.innerHTML=`<div class="intro-inner">
      <div class="intro-k"><span>SYS://BOOT</span><span class="intro-n">000</span></div>
      <div class="intro-name"></div>
      <div class="intro-bar"><i></i></div>
      <div class="intro-sub">${CONFIG.role}</div>
    </div>`;
  document.body.appendChild(el);
  const nameEl=el.querySelector(".intro-name"), nEl=el.querySelector(".intro-n"), bar=el.querySelector(".intro-bar i");
  const G="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&/<>_*";
  const DUR=4000, t0=performance.now(); let ended=false;
  const finish=()=>{
    if(ended) return; ended=true;
    nameEl.textContent=name; nEl.textContent="100"; bar.style.transform="scaleX(1)";
    el.classList.add("done"); d.classList.remove("intro");
    dispatchEvent(new Event("intro:done"));
    setTimeout(()=>el.remove(),1400);
  };
  (function frame(now){
    if(ended) return;
    const p=Math.min((now-t0)/DUR,1), e=1-Math.pow(1-p,3), k=Math.floor(e*name.length*1.15);
    nameEl.textContent=[...name].map((c,i)=>c===" "||i<k?c:G[Math.random()*G.length|0]).join("");
    nEl.textContent=String(Math.round(e*100)).padStart(3,"0");
    bar.style.transform=`scaleX(${e})`;
    if(p<1) requestAnimationFrame(frame); else setTimeout(finish,900);
  })(t0);
  el.addEventListener("click",finish); addEventListener("keydown",finish,{once:true});
})();

