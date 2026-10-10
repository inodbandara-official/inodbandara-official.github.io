/* =============================================================================
   SCENE — the orchestrator.

   Owns the mount point, decides how much machine it is allowed to spend, boots
   the environment, and hands back a tiny API the rest of the site talks to
   (pulse / hoverNode / focusNode). Everything WebGL is loaded lazily: a browser
   without WebGL, or a visitor who asked for reduced motion, never downloads
   Three at all.
   ============================================================================= */
import { el, clamp, damp, easeOut } from "../core/dom.js";
import { state, onTick, on, emit }  from "../core/state.js";
import { DENSITY, BOOT, THEME }     from "../core/tokens.js";
import { detectPage, profileFor }   from "./profiles.js";
import { setStatus }                from "../core/hud.js";
import { CONFIG }                   from "../data/profile.js";

/* --- capability probes ------------------------------------------------------ */
function webglOK() {
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2") || c.getContext("webgl");
    if (!gl) return false;
    /* a context that reports a software renderer will not hold 60fps; the
       2D fallback looks better than a slideshow */
    const dbg = gl.getExtension("WEBGL_debug_renderer_info");
    const name = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || "") : "";
    /* ?gl=force keeps the real scene on a software rasteriser — useful for
       headless capture, never the default for a visitor. */
    if (/swiftshader|llvmpipe|software/i.test(name) && !/[?&]gl=force/.test(location.search)) return false;
    return true;
  } catch (e) { return false; }
}

function pickTier() {
  const mem = navigator.deviceMemory || 4;
  const cpu = navigator.hardwareConcurrency || 4;
  if (state.view.mobile || mem <= 3 || cpu <= 4) return "low";
  if (mem <= 6 || cpu <= 8 || state.view.dpr > 2.4) return "medium";
  return "high";
}

/* --- mount ------------------------------------------------------------------ */
export async function mountScene() {
  const page = detectPage();
  const profile = profileFor(page);

  const host = el("div", { class: "scene", "aria-hidden": "true" });
  const canvas = el("canvas", { class: "scene__gl" });
  host.appendChild(atmosphereVideo());
  host.appendChild(el("div", { class: "scene__grade" }));
  host.appendChild(canvas);
  document.body.prepend(host);
  document.body.dataset.page = page;

  const reduced = state.flags.reduced;
  state.flags.webgl = webglOK();

  if (!state.flags.webgl) {
    canvas.remove();
    const { mountFallback } = await import("./fallback.js");
    setStatus("render", "ok", "CANVAS 2D");
    setStatus("core", "ok", "CORE");
    document.body.classList.add("no-webgl", "sys-online");
    return mountFallback(host, profile);
  }

  const tier = reduced ? "low" : pickTier();
  const density = { ...DENSITY[tier] };
  if (reduced) { density.packets = Math.round(density.packets * 0.25); density.dust = Math.round(density.dust * 0.4); }

  const [{ createStage }, { buildCore }, { buildNetwork }, { buildAtmosphere }, { createRig }, { createLabels }] =
    await Promise.all([
      import("./stage.js"), import("./core-object.js"), import("./network.js"),
      import("./atmosphere.js"), import("./camera-rig.js"), import("./labels.js"),
    ]);

  const stage = createStage(canvas, tier);
  const { THREE, scene, camera, composer, composite } = stage;

  const core = buildCore(THREE, tier);
  const net  = buildNetwork(THREE, tier, density, profile.content);
  const atmo = buildAtmosphere(THREE, tier, density);

  const world = new THREE.Group();
  world.add(core.group, net.group, atmo.group);
  /* Framing is viewport-dependent, not a fixed transform.

     Wide: typography left, system right — they share the frame.
     Narrow: the column is the whole width, so the system rises behind the
     display type (which is outline, and reads beautifully over it) and the
     page darkens downward toward the body copy and the buttons. Putting it
     below instead puts a lit machine directly behind the CTAs. */
  const baseOffset = profile.offset || [0, 0, 0];
  function frameWorld() {
    const narrow = state.view.w < 900;
    const tiny = state.view.w < 560;
    world.position.set(
      baseOffset[0] * (narrow ? 0.34 : 1),
      baseOffset[1] + (narrow ? 4.3 : 0),
      baseOffset[2] - (narrow ? 1.0 : 0)
    );
    world.scale.setScalar(profile.scale * (tiny ? 0.6 : narrow ? 0.76 : 1));
  }
  frameWorld();
  scene.add(world);

  /* The local rig travels with the system. Left in scene space it would sit
     several units off the core and light empty room instead of the machine. */
  world.add(stage.lights.heart, stage.lights.accent, stage.lights.fill, stage.lights.rim);

  /* one theme switch drives the whole environment */
  const applyTheme = () => {
    const t = document.documentElement.getAttribute("data-theme") || "dark";
    stage.setTheme(t); core.setTheme(t); net.setTheme(t); atmo.setTheme(t);
    composite.uniforms.uExposure.value = THEME[t === "light" ? "light" : "dark"].exposure * (profile.exposure || 1);
  };
  applyTheme();

  const rig = createRig(THREE, camera, profile.path);
  const labels = createLabels(THREE, camera, host);

  /* The type column owns its own space. Measured from the elements themselves,
     as a union, so it stays right at every breakpoint and through every copy
     change — no hand-tuned percentage to drift out of date. */
  const TYPE_COLUMN = [
    ".hero h1", ".hero .thesis", ".hero .hero__disc", ".hero .meta-row", ".hero .cta",
    ".page-hero h1", ".page-hero .ah__standfirst", ".case-hero h1", ".case-hero .tagline",
    ".nf h1", ".nf .msg", ".contact-hero h1",
  ].join(",");
  let keepOut = [];
  function measureKeepOut() {
    /* kept as separate rectangles, not one union: a headline and a paragraph
       leave a usable gap between them, and unioning the two would close it and
       push every tag off the hero entirely. */
    const out = [];
    for (const node of document.querySelectorAll(TYPE_COLUMN)) {
      const q = node.getBoundingClientRect();
      if (!q.width || q.bottom < -40 || q.top > state.view.h + 40) continue;
      out.push({ left: q.left - 20, right: q.right + 24, top: q.top - 12, bottom: q.bottom + 12 });
    }
    keepOut = out;
  }
  measureKeepOut();
  /* Measured inside the frame loop rather than on the scroll event: all the
     layout reads happen together, before any style is written, so nothing in
     this file forces a synchronous reflow mid-scroll. */

  /* --- bind labels to the nodes the profile asked for --------------------- */
  const bound = net.contentNodes.map(cn => labels.add({
    anchor: cn.node.pos, id: cn.id, meta: cn.meta, kind: cn.kind, status: cn.status, href: cn.href,
  }));
  if (profile.coreLabel) {
    labels.add({ anchor: new THREE.Vector3(0, 3.6, 0), id: "CORE", meta: "STABLE", kind: "core", status: "ok" });
  }

  /* --- boot: the infrastructure comes up, quickly -------------------------
     Timed off the wall clock, not off accumulated frame deltas: on a slow
     first paint the sequence should still finish in two seconds, not stall. */
  const bootStart = performance.now();
  let bootT = 0, booted = false;
  document.body.classList.add("sys-booting");
  setStatus("render", "ok", tier === "high" ? "WEBGL·HIGH" : tier === "medium" ? "WEBGL·MED" : "WEBGL·LOW");

  /* --- interaction --------------------------------------------------------- */
  let hoverIdx = null, hoverItem = null;
  const cursorRing = () => document.getElementById("cursorRing");

  function pickAt(px, py) {
    if (state.pointer.coarse) return null;
    return net.pick(camera, px, py, state.view.w, state.view.h);
  }

  on("pointer", p => {
    if (!booted) return;
    const hit = pickAt(p.px, p.py);
    const idx = hit ? hit.index : null;
    if (idx === hoverIdx) return;
    if (hoverItem) labels.setActive(hoverItem, false);
    hoverIdx = idx;
    hoverItem = hit ? bound[net.contentNodes.indexOf(hit)] : null;
    net.hover(idx);
    labels.setActive(hoverItem, true);
    const ring = cursorRing();
    if (ring) {
      ring.classList.toggle("on-node", !!hit);
      ring.dataset.state = hit ? "node" : "";
    }
    document.body.classList.toggle("node-hover", !!hit);
    if (hit) core.pulse(0.18);
  });

  /* Clicking a bound node navigates — but only when the click did not land on
     anything in the document. The 3D layer never intercepts real UI. */
  document.addEventListener("click", e => {
    if (!hoverItem || !hoverItem.href) return;
    if (e.target.closest("a,button,input,textarea,select,.term,.overlay,[data-cursor]")) return;
    if (window.getSelection && String(window.getSelection())) return;
    e.preventDefault();
    location.href = hoverItem.href;
  });

  /* the environment answers the interface */
  on("theme",   () => { applyTheme(); core.pulse(0.5); });
  on("handoff", () => { composite.uniforms.uFade.value = 0.0001; });

  /* the page this case study is about gets its node held open */
  if (profile.focusContent != null) {
    const i = net.contentIndex(profile.focusContent);
    if (i != null) { net.focus(i); rig.focusOn(net.nodes[i].pos); labels.setActive(bound[profile.focusContent], true); }
  }

  on("resize", () => { stage.resize(); frameWorld(); });

  /* --- frame --------------------------------------------------------------- */
  let fade = 1;
  const stop = onTick((dt, t) => {
    /* boot ramp */
    if (!booted) {
      bootT = (performance.now() - bootStart) / 1000;
      const b = easeOut(clamp(bootT / BOOT.power, 0, 1));
      const n = easeOut(clamp((bootT - BOOT.fade) / BOOT.network, 0, 1));
      core.setBoot(b); net.setBoot(n); atmo.setBoot(easeOut(clamp(bootT / BOOT.total, 0, 1)));
      if (bootT >= BOOT.total) {
        booted = true;
        document.body.classList.remove("sys-booting");
        document.body.classList.add("sys-online");
        setStatus("core", "ok", "CORE");
        core.pulse(1.2); net.pulse(0.8);
        emit("scene:ready", null);
      }
    }

    /* the handoff veil pulls the world down with it */
    const wantFade = document.querySelector(".veil.out") ? 1 : (booted ? 0 : 1 - clamp(bootT / BOOT.total, 0, 1));
    fade = damp(fade, wantFade, 6, dt);
    composite.uniforms.uFade.value = fade;
    composite.uniforms.uTime.value = t;
    stage.backdrop.uniforms.uTime.value = t;
    stage.backdrop.uniforms.uDrift.value.set(state.pointer.sx, state.pointer.sy);

    rig.update(dt);
    const energy = core.update(dt, t);
    net.update(dt, t, camera);
    atmo.update(dt, t);

    /* the heart's light tracks the core's own energy — one source of truth */
    stage.lights.heart.intensity = 9 + energy * 14;
    stage.lights.accent.intensity = 16 + energy * 14;

    measureKeepOut();
    labels.update(keepOut);
    composer.render();
  });

  const api = {
    pulse(v = 1) { core.pulse(v); net.pulse(v * 0.6); },
    hoverNode(k) {
      const i = k == null ? null : net.contentIndex(k);
      net.hover(i);
      bound.forEach((b, j) => labels.setActive(b, j === k));
    },
    focusNode(k) {
      if (k == null) { net.focus(null); rig.focusOn(null); return; }
      const i = net.contentIndex(k);
      if (i == null) return;
      net.focus(i); rig.focusOn(net.nodes[i].pos); core.pulse(0.7);
    },
    dispose() {
      stop();
      labels.dispose(); core.dispose(); net.dispose(); atmo.dispose(); stage.dispose();
      host.remove();
    },
  };
  return api;
}

/* --- optional cinematic plate ----------------------------------------------
   Set CONFIG.heroVideo (js/data/profile.js) to a path such as
   "/videos/hero.mp4" and it sits behind everything at low opacity, purely as
   atmosphere. Left empty — the default — no element is created and no request
   is made, so the console stays clean on a site that hasn't shot one yet.
   Either way the gradient underneath is the real background. */
function atmosphereVideo() {
  const src = CONFIG.heroVideo;
  if (!src) return document.createComment(" hero video: set CONFIG.heroVideo to enable ");
  const v = el("video", {
    class: "scene__plate", muted: true, loop: true, playsinline: true,
    autoplay: true, preload: "auto", tabindex: "-1",
  });
  v.muted = true; v.defaultMuted = true;
  v.addEventListener("error", () => v.remove(), { once: true });
  v.addEventListener("loadeddata", () => v.classList.add("on"), { once: true });
  v.src = src;
  v.play?.().catch(() => { /* autoplay blocked: the scene doesn't need it */ });
  return v;
}
