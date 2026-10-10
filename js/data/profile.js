/* =============================================================================
   ██  CONFIG  —  THE ONLY PLACE YOU NEED TO EDIT.
   Shared by index.html, about.html and contact.html. Change a value once and
   every page updates. Add your portrait by setting  about.photo  below.
   ============================================================================= */
export const CONFIG = {
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
  /* optional cinematic plate behind the 3D environment. Drop a file at
     /videos/hero.mp4 and set this to "/videos/hero.mp4"; leave empty and the
     site simply doesn't ask for it. Atmosphere only — never information. */
  heroVideo: "",
  socials: [
    { label: "GitHub",   url: "https://github.com/indobandara-official" },
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

/* -----------------------------------------------------------------------------
   Derived helpers. Everything downstream reads identity from here — never from
   a hard-coded string in a component.
   -------------------------------------------------------------------------- */
export const fullName = `${CONFIG.firstName} ${CONFIG.lastName}`;
export const slugify  = s => (s || "").toString().toLowerCase().trim()
  .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
export const projSlug = p => (p && p.slug) ? p.slug : slugify(p && p.title);

export default CONFIG;
