/* =============================================================================
   ██  THE GROUNDS  —  one world, nine places.

   Every page of this site opens onto the same night: stone, fog, rain, a low
   moon, lantern light. The core below builds that world once; each scene only
   adds the structure that belongs to its page, and every structure raises
   itself out of the ground in about four and a half seconds.

     pagoda     home          seven tiers, seven destinations — hover, click
     steles     /work         carved monuments, one per project
     torii      /about        a gate path receding into fog
     brazier    /contact      a fire, and rings going out from it
     plinths    /lab          specimens turning on their pedestals
     pillars    /impact       tally columns, one per measured number
     stairway   /experience   an ascending path through gates
     vault      /stack        a stepped wall of stacked stone
     ruin       404           a gate that didn't hold

   Built on Three.js r149, vendored in /vendor/three. No CDN, no bundler, no
   package manager. Every page's <nav> is untouched and fully keyboard-navigable
   — the pagoda's click-through is an enhancement on top, never the only route.

   Terminal: `rebuild` raises the current place again. On the home page,
   `tiers` lists the floors.
   Bails out entirely on: reduced-motion, narrow viewports, no WebGL.
   ============================================================================= */
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

const cv = document.getElementById("hero3d");
if (cv) boot();

function boot() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { cv.style.display = "none"; return; }
  if (window.innerWidth < 780) { cv.style.display = "none"; return; }

  const BUILD_S = 4.6;

  /* ------------------------------------------------------------- renderer */
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: "high-performance" });
  } catch (e) { cv.style.display = "none"; return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.76;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 400);

  /* ------------------------------------------------------------ materials */
  const M = {
    ground: new THREE.MeshStandardMaterial({ color: 0x0d0f13, roughness: 0.96, metalness: 0.02 }),
    stone:  new THREE.MeshStandardMaterial({ color: 0x2a2823, roughness: 0.92, metalness: 0.03 }),
    roof:   new THREE.MeshStandardMaterial({ color: 0x17191f, roughness: 0.78, metalness: 0.12 }),
    wood:   new THREE.MeshStandardMaterial({ color: 0x1d1a16, roughness: 0.85, metalness: 0.05 }),
    lamp:   new THREE.MeshBasicMaterial({ color: 0xffb457, toneMapped: false }),
    moon:   new THREE.MeshBasicMaterial({ color: 0xdfe6f5, toneMapped: false, fog: false }),
    rain:   new THREE.MeshBasicMaterial({ color: 0x8fa6c4, toneMapped: false, transparent: true, opacity: 0.26 })
  };

  const theme = { light: false, bg: new THREE.Color(), accent: new THREE.Color() };
  const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  function syncTheme() {
    theme.light = document.documentElement.getAttribute("data-theme") === "light";
    theme.bg.set(css("--bg") || "#0a0b0d");
    theme.accent.set(css("--accent") || "#f5b841");
    renderer.setClearColor(theme.bg, 1);
    scene.fog = new THREE.FogExp2(theme.bg.getHex(), theme.light ? 0.020 : 0.026);

    /* the daylight reading of the same grounds — pale stone, lanterns still lit */
    M.ground.color.set(theme.light ? 0xc9c6bc : 0x0d0f13);
    M.stone .color.set(theme.light ? 0xb0aca0 : 0x2a2823);
    M.roof  .color.set(theme.light ? 0x8e8b86 : 0x17191f);
    M.wood  .color.set(theme.light ? 0x9a9186 : 0x1d1a16);
    M.rain  .opacity = theme.light ? 0.16 : 0.26;
    M.moon  .color.set(theme.light ? 0xf3efe4 : 0xdfe6f5);

    moonLight.intensity = theme.light ? 1.25 : 0.38;
    ambi.intensity      = theme.light ? 0.90 : 0.19;
    fill.intensity      = theme.light ? 0.55 : 0.24;
    bloom.strength      = theme.light ? 0.28 : 0.80;
    bloom.threshold     = theme.light ? 0.86 : 0.62;
  }

  /* ---------------------------------------------------------------- lights */
  const ambi = new THREE.HemisphereLight(0x5a6c8a, 0x0a0b0d, 0.19);
  scene.add(ambi);

  const moonLight = new THREE.DirectionalLight(0xbcd0f0, 0.38);
  moonLight.position.set(-38, 26, -30);
  moonLight.castShadow = true;
  moonLight.shadow.mapSize.set(1024, 1024);
  moonLight.shadow.camera.near = 1;   moonLight.shadow.camera.far = 140;
  moonLight.shadow.camera.left = -34; moonLight.shadow.camera.right = 34;
  moonLight.shadow.camera.top = 42;   moonLight.shadow.camera.bottom = -12;
  moonLight.shadow.bias = -0.0016;
  scene.add(moonLight);

  const fill = new THREE.DirectionalLight(0xffd7a4, 0.24);
  fill.position.set(24, 14, 28);
  scene.add(fill);

  const moon = new THREE.Mesh(new THREE.SphereGeometry(3.4, 32, 32), M.moon);
  moon.position.set(-52, 34, -78);
  scene.add(moon);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), M.ground);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  /* ---------------------------------------------------------------- helpers */
  /* Object3D.position / .rotation are read-only accessors — always mutate them
     via .set(), never assign them through Object.assign(). */
  function part(geo, mat, x, y, z, ry) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    if (ry) m.rotation.y = ry;
    m.castShadow = true; m.receiveShadow = true;
    return m;
  }
  const lampGeo = new THREE.SphereGeometry(0.11, 10, 10);
  const lamps = [];
  function lantern(parent, x, y, z, group, withLight) {
    const mesh = new THREE.Mesh(lampGeo, M.lamp.clone());
    mesh.position.set(x, y, z);
    parent.add(mesh);
    let light = null;
    if (withLight) {
      light = new THREE.PointLight(0xffa94d, 0, 10, 2);
      light.position.set(x, y, z);
      parent.add(light);
    }
    lamps.push({ mesh, light, group, base: 0.55 + Math.random() * 0.2, seed: Math.random() * 6.28 });
    return mesh;
  }

  /* every structure raises itself; scenes just register what rises and when */
  const risers = [];
  function rise(obj, y1, delay, opt) {
    opt = opt || {};
    risers.push({ obj, y0: opt.from !== undefined ? opt.from : y1 - (opt.drop || 6),
                  y1, delay, dur: opt.dur || 0.30, scale: opt.scale !== false });
  }

  /* a stone lantern, the kind that lines a temple path */
  function stoneLantern(x, z, s) {
    s = s || 1;
    const g = new THREE.Group();
    g.add(part(new THREE.BoxGeometry(0.5*s, 0.18*s, 0.5*s), M.stone, 0, 0.09*s, 0));
    g.add(part(new THREE.CylinderGeometry(0.10*s, 0.13*s, 1.0*s, 8), M.stone, 0, 0.6*s, 0));
    g.add(part(new THREE.BoxGeometry(0.44*s, 0.38*s, 0.44*s), M.wood, 0, 1.3*s, 0));
    g.add(part(new THREE.ConeGeometry(0.42*s, 0.3*s, 4), M.roof, 0, 1.62*s, 0, Math.PI/4));
    g.position.set(x, 0, z);
    lantern(g, 0, 1.3*s, 0, -1, true);
    scene.add(g);
    return g;
  }

  /* a torii-style gate: two posts, a heavy lintel, a tie beam */
  function gate(w, h, x, z, ry) {
    const g = new THREE.Group();
    const pr = w * 0.045;
    for (const sx of [-1, 1]) g.add(part(new THREE.CylinderGeometry(pr*0.85, pr, h, 10), M.wood, sx*w/2, h/2, 0));
    g.add(part(new THREE.BoxGeometry(w*1.28, h*0.055, pr*2.4), M.roof, 0, h*0.98, 0));
    g.add(part(new THREE.BoxGeometry(w*1.10, h*0.040, pr*2.0), M.wood, 0, h*0.86, 0));
    g.position.set(x, 0, z);
    if (ry) g.rotation.y = ry;
    scene.add(g);
    return g;
  }

  /* ------------------------------------------------------------------ rain */
  const RAIN = 900;
  const rain = new THREE.InstancedMesh(new THREE.BoxGeometry(0.013, 0.62, 0.013), M.rain, RAIN);
  rain.frustumCulled = false;
  rain.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(rain);
  const drops = [];
  for (let i = 0; i < RAIN; i++)
    drops.push({ x:(Math.random()-0.5)*70, y:Math.random()*44, z:(Math.random()-0.5)*70, v:15 + Math.random()*16 });

  /* ---------------------------------------------------------------- embers */
  const EMB = 240;
  const embGeo = new THREE.BufferGeometry();
  const embPos = new Float32Array(EMB * 3);
  const embers = [];
  for (let i = 0; i < EMB; i++) {
    const e = { x:(Math.random()-0.5)*26, y:Math.random()*22, z:(Math.random()-0.5)*26, v:0.25+Math.random()*0.55, s:Math.random()*6.28 };
    embers.push(e);
    embPos[i*3]=e.x; embPos[i*3+1]=e.y; embPos[i*3+2]=e.z;
  }
  embGeo.setAttribute("position", new THREE.BufferAttribute(embPos, 3));
  const embMat = new THREE.PointsMaterial({ color: 0xffb35c, size: 0.075, transparent: true,
                                            opacity: 0.75, depthWrite: false, blending: THREE.AdditiveBlending });
  scene.add(new THREE.Points(embGeo, embMat));

  /* --------------------------------------------------------- post-processing */
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.80, 0.70, 0.62);
  composer.addPass(bloom);

  /* forward declarations the scenes read from — assigned each frame */
  let heroP = 0, receP = 0, buildT = 0, curX = 0, curY = 0;
  const look = new THREE.Vector3();

  /* =========================================================================
     SCENES
     Each returns { hud(), update(dt, t), nav?, api? }. The core owns the world,
     the build-up, the rain, the lanterns and the withdrawal; a scene owns its
     own structure and its own camera.
     ========================================================================= */
  const SCENES = {};

  /* ---- home: the pagoda. seven tiers, seven destinations ---- */
  SCENES.pagoda = () => {
    const TIERS = [
      { n:"01", name:"WORK",       layer:"L1/PHY",   href:"/work" },
      { n:"02", name:"IMPACT",     layer:"L2/LINK",  href:"/impact" },
      { n:"03", name:"ABOUT",      layer:"L3/NET",   href:"/about" },
      { n:"04", name:"EXPERIENCE", layer:"L4/TRANS", href:"/experience" },
      { n:"05", name:"STACK",      layer:"L5/SESS",  href:"/stack" },
      { n:"06", name:"CONTACT",    layer:"L6/PRES",  href:"/contact" },
      { n:"07", name:"LAB",        layer:"L7/APP",   href:"/lab" }
    ];
    const N = TIERS.length, LOOK_X = -7.5;
    scene.add(part(new THREE.BoxGeometry(13, 1.15, 13), M.stone, 0, 1.15/2, 0));
    for (let s = 0; s < 3; s++)
      scene.add(part(new THREE.BoxGeometry(6.4 - s*0.5, 0.3, 1.1), M.stone, 0, 0.15 + s*0.3, 7.2 + (2-s)*1.0));
    stoneLantern(-4.6, 9.4); stoneLantern(4.6, 9.4);

    const nav = [];
    let y = 1.15;
    for (let i = 0; i < N; i++) {
      const g = new THREE.Group();
      const w = 8.2 * (1 - i*0.085), bodyH = 1.45, roofH = 0.72, eaveR = w*0.86;
      const mStone = M.stone.clone(), mRoof = M.roof.clone(), mWood = M.wood.clone();
      g.add(part(new THREE.BoxGeometry(w*0.94, 0.16, w*0.94), mStone, 0, 0.08, 0));
      g.add(part(new THREE.BoxGeometry(w*0.66, bodyH, w*0.66), mWood, 0, 0.16 + bodyH/2, 0));
      const pw = w*0.36;
      for (const sx of [-1,1]) for (const sz of [-1,1])
        g.add(part(new THREE.BoxGeometry(0.16, bodyH, 0.16), mStone, sx*pw, 0.16 + bodyH/2, sz*pw));
      g.add(part(new THREE.ConeGeometry(eaveR, roofH, 4), mRoof, 0, 0.16 + bodyH + roofH/2, 0, Math.PI/4));
      g.add(part(new THREE.CylinderGeometry(eaveR*1.02, eaveR*1.02, 0.09, 4), mRoof, 0, 0.16 + bodyH + 0.045, 0, Math.PI/4));
      for (let c = 0; c < 4; c++) {
        const a = c*Math.PI/2;
        const tip = part(new THREE.BoxGeometry(0.5, 0.10, 0.14), mRoof,
                         Math.cos(a)*eaveR*0.98, 0.16 + bodyH + 0.16, Math.sin(a)*eaveR*0.98);
        tip.rotation.y = -a; tip.rotation.z = 0.34;
        g.add(tip);
        lantern(g, Math.cos(a)*eaveR*0.90, 0.16 + bodyH - 0.16, Math.sin(a)*eaveR*0.90, i, c % 2 === 0);
      }
      const tierH = 0.16 + bodyH + roofH;
      /* a generous invisible hitbox is what the ray actually tests. Picking the
         visible meshes left most of each storey dead; colorWrite:false hides it
         from the camera but not from the raycaster. */
      const hit = new THREE.Mesh(new THREE.BoxGeometry(eaveR*2.05, tierH, eaveR*2.05),
                                 new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }));
      hit.position.y = tierH/2; hit.renderOrder = -1;
      g.add(hit);
      g.position.set(0, y, 0);
      scene.add(g);
      rise(g, y, (i/N)*0.72, { drop: tierH + 1.4 });
      nav.push({ hit, group: g, h: tierH, mats: [mStone, mRoof, mWood], meta: TIERS[i], hover: 0 });
      y += tierH;
    }
    const TOP = y;
    const fin = new THREE.Group();
    fin.add(part(new THREE.CylinderGeometry(0.05, 0.13, 1.9, 8), M.stone, 0, 0.95, 0));
    for (let r = 0; r < 4; r++) {
      const ring = part(new THREE.TorusGeometry(0.22 - r*0.035, 0.032, 6, 16), M.stone, 0, 0.42 + r*0.3, 0);
      ring.rotation.x = Math.PI/2;
      fin.add(ring);
    }
    const jewel = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 14), M.lamp.clone());
    jewel.position.y = 2.0; fin.add(jewel);
    fin.position.y = TOP; scene.add(fin);
    rise(fin, TOP, 0.94, { drop: 3, dur: 0.06 });

    return {
      nav,
      hud: () => ["PAGODA", N + " TIERS · HOVER A FLOOR"],
      api: {
        get: () => ({ tiers: N }),
        list: () => TIERS.map(t => `${t.n}  ${t.name.padEnd(11)} ${t.layer.padEnd(9)} ${t.href}`).join("\n")
      },
      update(dt, t) {
        jewel.material.color.setRGB(1, 0.78, 0.45).multiplyScalar(0.6 + 0.5*Math.sin(t*1.4) + (buildT >= 1 ? 0.4 : 0));
        const ang = 0.52 + t*0.014 + curX*0.13;
        const rad = 30 - heroP*3 + receP*20;
        camera.position.set(Math.sin(ang)*rad, 7.5 + heroP*1.5 + receP*9 + curY*1.1, Math.cos(ang)*rad);
        look.set(LOOK_X, 9.0 - receP*1.5, 0);
      }
    };
  };

  /* ---- /work: carved monuments, one per project ---- */
  SCENES.steles = () => {
    const N = 5;
    for (let i = 0; i < N; i++) {
      const a = -0.55 + i * 0.28, r = 11;
      const h = 6.5 + (i % 3) * 1.6;
      const g = new THREE.Group();
      g.add(part(new THREE.BoxGeometry(3.2, 0.5, 2.0), M.stone, 0, 0.25, 0));
      g.add(part(new THREE.BoxGeometry(2.4, h, 1.0), M.stone, 0, 0.5 + h/2, 0));
      /* the inscription: a recessed panel with carved rules */
      g.add(part(new THREE.BoxGeometry(1.7, h*0.72, 0.06), M.wood, 0, 0.5 + h/2, 0.53));
      for (let k = 0; k < 6; k++)
        g.add(part(new THREE.BoxGeometry(1.2 - (k%2)*0.35, 0.055, 0.03), M.roof, -0.15, 0.5 + h*0.82 - k*(h*0.11), 0.58));
      g.add(part(new THREE.ConeGeometry(1.6, 0.6, 4), M.roof, 0, 0.5 + h + 0.3, 0, Math.PI/4));
      g.position.set(Math.sin(a)*r, 0, -Math.cos(a)*r + 6);
      g.rotation.y = -a;
      scene.add(g);
      rise(g, 0, (i/N)*0.7, { drop: h + 2 });
      lantern(g, -1.7, 1.5, 0.4, -1, i % 2 === 0);
      lantern(g,  1.7, 1.5, 0.4, -1, false);
    }
    stoneLantern(-7.5, 11); stoneLantern(7.5, 11);
    return {
      hud: () => ["MONUMENTS", N + " STELES · SELECTED WORK"],
      update(dt, t) {
        const ang = 0.20 + t*0.010 + curX*0.10;
        const rad = 21 - heroP*3 + receP*16;
        camera.position.set(Math.sin(ang)*rad, 5.5 + heroP + receP*8 + curY*0.9, Math.cos(ang)*rad + 6);
        look.set(-6.5, 4.2 - receP, 2);
      }
    };
  };

  /* ---- /about: a gate path receding into fog ---- */
  SCENES.torii = () => {
    const N = 9;
    for (let i = 0; i < N; i++) {
      const z = 4 - i * 7.5;
      const w = 7.4 - i * 0.16, h = 7.0 - i * 0.13;
      const g = gate(w, h, 0, z);
      rise(g, 0, (i/N)*0.72, { drop: h + 2 });
      lantern(g, -w/2, h*0.62, 0.35, -1, i % 2 === 0);
      lantern(g,  w/2, h*0.62, 0.35, -1, false);
      if (i % 2 === 0) { stoneLantern(-w/2 - 2.2, z, 0.9); stoneLantern(w/2 + 2.2, z, 0.9); }
    }
    scene.add(part(new THREE.BoxGeometry(5.2, 0.08, 74), M.stone, 0, 0.04, -30));
    return {
      hud: () => ["THE PATH", N + " GATES · HOW I GOT HERE"],
      update(dt, t) {
        camera.position.set(curX*1.6, 3.0 + receP*7 + curY*0.7, 12 - heroP*9 + receP*12);
        look.set(-4.2 + curX*0.6, 3.4 - receP*0.8, camera.position.z - 20);
      }
    };
  };

  /* ---- /contact: a fire, and rings going out from it ---- */
  SCENES.brazier = () => {
    const g = new THREE.Group();
    g.add(part(new THREE.CylinderGeometry(2.4, 3.0, 0.5, 12), M.stone, 0, 0.25, 0));
    g.add(part(new THREE.CylinderGeometry(0.7, 1.0, 2.2, 10), M.stone, 0, 1.4, 0));
    g.add(part(new THREE.CylinderGeometry(2.1, 1.3, 1.0, 12), M.stone, 0, 3.0, 0));
    scene.add(g);
    rise(g, 0, 0.1, { drop: 8 });
    const fire = new THREE.Mesh(new THREE.SphereGeometry(1.15, 18, 18), M.lamp.clone());
    fire.position.set(0, 3.5, 0); g.add(fire);
    const fireLight = new THREE.PointLight(0xff9a3c, 0, 34, 2);
    fireLight.position.set(0, 3.8, 0); g.add(fireLight);
    for (let i = 0; i < 4; i++) stoneLantern(Math.cos(i*Math.PI/2 + 0.8)*10, Math.sin(i*Math.PI/2 + 0.8)*10);
    /* signal rings travelling out across the ground */
    const rings = [];
    for (let i = 0; i < 5; i++) {
      const r = new THREE.Mesh(new THREE.TorusGeometry(1, 0.045, 6, 64), M.lamp.clone());
      r.rotation.x = -Math.PI/2; r.position.y = 0.12;
      scene.add(r);
      rings.push({ mesh: r, t: i * 0.2 });
    }
    return {
      hud: () => ["THE BEACON", "SIGNAL OUT · HARD PROBLEMS WELCOME"],
      update(dt, t) {
        const flick = 0.82 + 0.18*Math.sin(t*7.1)*Math.sin(t*3.3);
        fireLight.intensity = (buildT > 0.4 ? 3.0 : 0) * flick;
        fire.material.color.setRGB(1, 0.62, 0.26).multiplyScalar(0.8 + flick*0.9);
        fire.scale.setScalar(0.9 + 0.14*Math.sin(t*5.7) + 0.08*Math.sin(t*11.3));
        for (const R of rings) {
          R.t += dt * 0.22;
          if (R.t > 1) R.t -= 1;
          const s = 3 + R.t * 26;
          R.mesh.scale.set(s, s, 1);
          R.mesh.material.color.copy(theme.accent).multiplyScalar((1 - R.t) * (buildT > 0.5 ? 0.85 : 0));
        }
        const ang = 0.3 + t*0.016 + curX*0.12;
        const rad = 19 - heroP*2 + receP*15;
        camera.position.set(Math.sin(ang)*rad, 5.5 + heroP + receP*8 + curY*0.9, Math.cos(ang)*rad);
        look.set(-5.5, 3.0 - receP*0.6, 0);
      }
    };
  };

  /* ---- /lab: specimens turning on their pedestals ---- */
  SCENES.plinths = () => {
    const forms = [
      new THREE.IcosahedronGeometry(1.05, 0),
      new THREE.TorusKnotGeometry(0.66, 0.24, 90, 12),
      new THREE.OctahedronGeometry(1.15, 0),
      new THREE.TorusGeometry(0.86, 0.26, 12, 32),
      new THREE.DodecahedronGeometry(1.02, 0),
      new THREE.TetrahedronGeometry(1.25, 0)
    ];
    const specs = [];
    for (let i = 0; i < forms.length; i++) {
      const a = -0.62 + i * 0.25, r = 12;
      const x = Math.sin(a)*r, z = -Math.cos(a)*r + 7;
      const h = 2.6 + (i % 3) * 0.5;
      const g = new THREE.Group();
      g.add(part(new THREE.BoxGeometry(2.1, 0.28, 2.1), M.stone, 0, 0.14, 0));
      g.add(part(new THREE.CylinderGeometry(0.62, 0.78, h, 10), M.stone, 0, 0.28 + h/2, 0));
      g.add(part(new THREE.BoxGeometry(1.7, 0.2, 1.7), M.stone, 0, 0.28 + h + 0.1, 0));
      g.position.set(x, 0, z);
      scene.add(g);
      rise(g, 0, (i/forms.length)*0.62, { drop: h + 3 });
      const mat = new THREE.MeshStandardMaterial({ color: 0x6d6152, roughness: 0.35, metalness: 0.65 });
      const spec = new THREE.Mesh(forms[i], mat);
      spec.position.set(x, 0.28 + h + 1.3, z);
      spec.castShadow = true;
      scene.add(spec);
      lantern(g, 0, 0.28 + h + 0.1, 0.95, -1, i % 2 === 0);
      specs.push({ mesh: spec, mat, spin: 0.18 + Math.random()*0.3, seed: Math.random()*6.28,
                   y: 0.28 + h + 1.3, delay: (i/forms.length)*0.62 });
    }
    return {
      hud: () => ["THE LAB", specs.length + " SPECIMENS · WORK IN PROGRESS"],
      update(dt, t) {
        for (const S2 of specs) {
          const local = Math.min(1, Math.max(0, (buildT - S2.delay - 0.15) / 0.3));
          S2.mesh.visible = local > 0.01;
          S2.mesh.rotation.y += dt * S2.spin;
          S2.mesh.rotation.x += dt * S2.spin * 0.4;
          S2.mesh.position.y = S2.y + Math.sin(t*0.8 + S2.seed)*0.14;
          S2.mesh.scale.setScalar(local);
          S2.mat.emissive.copy(theme.accent).multiplyScalar(0.10 + 0.08*Math.sin(t*1.6 + S2.seed));
        }
        const ang = 0.22 + t*0.012 + curX*0.11;
        const rad = 20 - heroP*3 + receP*15;
        camera.position.set(Math.sin(ang)*rad, 5.0 + heroP + receP*8 + curY*0.9, Math.cos(ang)*rad + 7);
        look.set(-6.0, 3.6 - receP*0.8, 3);
      }
    };
  };

  /* ---- /impact: tally columns, one per measured number ---- */
  SCENES.pillars = () => {
    const H = [7.5, 5.2, 9.0, 4.4, 10.2, 6.1, 8.2, 5.8];
    for (let i = 0; i < H.length; i++) {
      const g = new THREE.Group();
      g.add(part(new THREE.BoxGeometry(2.3, 0.36, 2.3), M.stone, 0, 0.18, 0));
      g.add(part(new THREE.BoxGeometry(1.7, H[i], 1.7), M.stone, 0, 0.36 + H[i]/2, 0));
      const notches = 3 + (i % 3);
      for (let k = 0; k < notches; k++)
        g.add(part(new THREE.BoxGeometry(1.86, 0.10, 1.86), M.roof, 0, 0.36 + H[i]*(0.25 + k*0.18), 0));
      g.add(part(new THREE.BoxGeometry(2.1, 0.26, 2.1), M.stone, 0, 0.36 + H[i] + 0.13, 0));
      g.position.set((i - (H.length-1)/2) * 3.4, 0, 0);
      scene.add(g);
      rise(g, 0, (i/H.length)*0.68, { drop: H[i] + 2 });
      lantern(g, 0, 0.36 + H[i] + 0.42, 0, -1, i % 2 === 0);
    }
    return {
      hud: () => ["THE TALLY", H.length + " COLUMNS · MEASURED, NOT MANIFESTED"],
      update(dt, t) {
        const ang = 0.06 + t*0.008 + curX*0.09;
        const rad = 26 - heroP*3 + receP*17;
        camera.position.set(Math.sin(ang)*rad, 6.5 + heroP + receP*9 + curY, Math.cos(ang)*rad);
        look.set(-7.0, 5.0 - receP, 0);
      }
    };
  };

  /* ---- /experience: an ascending path through gates ---- */
  SCENES.stairway = () => {
    const STEPS = 46, RISE = 0.34, RUN = 1.25;
    for (let i = 0; i < STEPS; i++) {
      const y = i * RISE;
      const st = part(new THREE.BoxGeometry(7.0, RISE + 0.06, RUN + 0.04), M.stone, 0, y + RISE/2, 6 - i*RUN);
      scene.add(st);
      rise(st, y + RISE/2, (i/STEPS)*0.8, { drop: 3, dur: 0.16, scale: false });
    }
    for (let i = 0; i < 5; i++) {
      const s = 6 + i * 9;
      const y = s * RISE;
      const g = gate(6.6 - i*0.2, 6.2 - i*0.15, 0, 6 - s*RUN);
      g.position.y = y;
      rise(g, y, 0.15 + (i/5)*0.7, { drop: 6 });
      lantern(g, -3.3, 3.9, 0.3, -1, true);
      lantern(g,  3.3, 3.9, 0.3, -1, false);
    }
    return {
      hud: () => ["THE ASCENT", "5 GATES · HOW I ENDED UP HERE"],
      update(dt, t) {
        camera.position.set(curX*1.8, 4.2 + heroP*3 + receP*10 + curY*0.8, 14 - heroP*10 + receP*14);
        look.set(-4.5 + curX*0.6, 5.0 + heroP*3 - receP, camera.position.z - 22);
      }
    };
  };

  /* ---- /stack: a stepped wall of stacked stone ---- */
  SCENES.vault = () => {
    const ROWS = 7, COLS = 9;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const w = 2.3, h = 1.15, d = 1.6;
        const x = (c - (COLS-1)/2) * (w + 0.16) * (1 - r*0.03);
        const y = r * (h + 0.14) + h/2;
        const b = part(new THREE.BoxGeometry(w, h, d), (r + c) % 3 === 0 ? M.wood : M.stone, x, y, -r*0.34);
        scene.add(b);
        rise(b, y, ((r*COLS + c)/(ROWS*COLS))*0.78, { drop: 5, dur: 0.14 });
        if (c % 4 === 2 && r % 2 === 1) lantern(b, 0, 0, d/2 + 0.22, -1, r === 3);
      }
    }
    stoneLantern(-13, 6); stoneLantern(13, 6);
    return {
      hud: () => ["THE VAULT", (ROWS*COLS) + " BLOCKS · WHAT I RUN"],
      update(dt, t) {
        const ang = 0.10 + t*0.009 + curX*0.10;
        const rad = 24 - heroP*3 + receP*16;
        camera.position.set(Math.sin(ang)*rad, 5.8 + heroP*1.5 + receP*9 + curY, Math.cos(ang)*rad + 5);
        look.set(-7.0, 4.4 - receP, 0);
      }
    };
  };

  /* ---- 404: a gate that didn't hold ---- */
  SCENES.ruin = () => {
    const g = gate(8.4, 8.0, 0, 0);
    /* the lintel has come down */
    g.children[2].rotation.z = 0.42; g.children[2].position.set(1.6, 4.9, 0);
    g.children[3].rotation.z = 0.30; g.children[3].position.set(0.8, 6.2, 0);
    rise(g, 0, 0.1, { drop: 9 });
    lantern(g, -4.2, 5.0, 0.35, -1, true);
    for (let i = 0; i < 14; i++) {
      const a = Math.random()*6.28, r = 4 + Math.random()*11, s = 0.4 + Math.random()*0.9;
      const b = part(new THREE.BoxGeometry(s, s*0.6, s*0.8), M.stone, Math.cos(a)*r, s*0.3, Math.sin(a)*r);
      b.rotation.set(Math.random()*0.5, Math.random()*3, Math.random()*0.4);
      scene.add(b);
      rise(b, s*0.3, 0.2 + Math.random()*0.6, { drop: 4, dur: 0.2 });
    }
    stoneLantern(-8, 8); stoneLantern(8, 8);
    return {
      hud: () => ["NO ROUTE", "THIS GATE DIDN'T HOLD"],
      update(dt, t) {
        const ang = 0.34 + t*0.014 + curX*0.12;
        const rad = 20 + receP*14;
        camera.position.set(Math.sin(ang)*rad, 5.4 + receP*8 + curY*0.9, Math.cos(ang)*rad);
        look.set(-4.5, 3.8 - receP*0.8, 0);
      }
    };
  };

  /* =========================================================================
     BOOT THE PLACE
     ========================================================================= */
  const want = SCENES[document.body.getAttribute("data-hero")] ? document.body.getAttribute("data-hero") : "pagoda";
  const S = SCENES[want]();
  syncTheme();
  new MutationObserver(syncTheme).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  /* ---------------------------------------------------------------- input */
  let scrollT = 0, scrollTarget = 0, curTX = 0, curTY = 0;
  let buildStart = performance.now();
  const mouseNDC = new THREE.Vector2(-5, -5);
  let hasMouse = false;

  function readScroll() {
    const h = document.documentElement.scrollHeight - innerHeight;
    scrollTarget = h > 0 ? Math.min(Math.max(scrollY / h, 0), 1) : 0;
  }
  addEventListener("scroll", readScroll, { passive: true });
  addEventListener("mousemove", e => {
    curTX = (e.clientX / innerWidth) * 2 - 1;
    curTY = -((e.clientY / innerHeight) * 2 - 1);
    mouseNDC.set(curTX, curTY); hasMouse = true;
  }, { passive: true });
  addEventListener("mouseout", () => { hasMouse = false; }, { passive: true });
  readScroll();

  let needResize = true;
  addEventListener("resize", () => { needResize = true; readScroll(); }, { passive: true });
  function resize() {
    if (!needResize) return;
    needResize = false;
    const w = cv.clientWidth, h = cv.clientHeight;
    camera.aspect = w / h; camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
  }

  /* ------------------------------------------------- hover + click (pagoda) */
  const ray = new THREE.Raycaster();
  const label = document.getElementById("tierLabel");
  const NAV = S.nav || null;
  let hovered = -1;

  function pick() {
    if (!NAV || !hasMouse || receP > 0.35 || buildT < 0.98) return -1;
    ray.setFromCamera(mouseNDC, camera);
    const hits = ray.intersectObjects(NAV.map(n => n.hit), false);
    if (!hits.length) return -1;
    for (let i = 0; i < NAV.length; i++) if (NAV[i].hit === hits[0].object) return i;
    return -1;
  }
  /* Listen on the window, not the canvas: hover is a raycast from raw pointer
     coordinates, but a click goes through DOM hit-testing and <main> sits at
     z-index 1 over the canvas, so the click would never reach #hero3d. */
  addEventListener("click", e => {
    if (hovered < 0 || !NAV) return;
    if (e.target.closest && e.target.closest("a,button,input,textarea,select,label,.term,[data-open-term]")) return;
    if (String(getSelection ? getSelection() : "").length) return;
    location.href = NAV[hovered].meta.href;
  });
  const ring = document.getElementById("cursorRing");

  /* ------------------------------------------------------------------ HUD */
  const hudA = document.getElementById("netLayer"), hudB = document.getElementById("netState");
  function hud(a, b) {
    if (hudA && a != null && hudA.textContent !== a) hudA.textContent = a;
    if (hudB && b != null && hudB.textContent !== b) hudB.textContent = b;
  }

  /* ------------------------------------------------------------- the loop */
  const ease = x => 1 - Math.pow(1 - x, 3);
  const back = x => { const c = 1.70158, c3 = c + 1; return 1 + c3*Math.pow(x-1,3) + c*Math.pow(x-1,2); };
  const _m = new THREE.Matrix4(), _s = new THREE.Vector3(1,1,1), _p = new THREE.Vector3();
  const _rq = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.16, 0, 0.08));
  let last = performance.now(), enabled = true, alive = true;

  function frame(now) {
    if (!alive) return;
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.05); last = now;
    if (!enabled) return;
    resize();
    const t = now / 1000;

    /* the build-up runs on wall-clock: dt is capped at 50ms so a frame hitch
       can't jump the animation, but that cap would also stretch "four and a
       half seconds" into something much longer on a slow machine. */
    buildT = Math.min(1, Math.max(0, (now - buildStart) / (BUILD_S * 1000)));
    for (const R of risers) {
      const local = Math.min(1, Math.max(0, (buildT - R.delay) / R.dur));
      R.obj.visible = local > 0.001;
      R.obj.position.y = R.y0 + (R.y1 - R.y0) * back(local);
      if (R.scale) { const sc = 0.55 + 0.45*ease(local); R.obj.scale.set(sc, 1, sc); }
    }

    scrollT += (scrollTarget - scrollT) * Math.min(dt*4, 1);
    curX += (curTX - curX) * Math.min(dt*3, 1);
    curY += (curTY - curY) * Math.min(dt*3, 1);
    heroP = Math.min(1, scrollT / 0.30);
    receP = Math.min(1, Math.max(0, (scrollT - 0.22) / 0.58));

    /* ---- hover (pagoda only) ---- */
    if (NAV) {
      const hit = pick();
      if (hit !== hovered) {
        hovered = hit;
        if (ring) ring.classList.toggle("hover", hovered >= 0);
        /* the canvas is not the DOM hit target, so the cursor hint lives on body */
        document.body.classList.toggle("tier-pick", hovered >= 0);
        if (label) {
          if (hovered >= 0) {
            const m = NAV[hovered].meta;
            label.innerHTML = `<span class="n">${m.n}</span><b>${m.name}</b><span class="l">${m.layer}</span>`;
            label.classList.add("on");
          } else label.classList.remove("on");
        }
      }
      for (let i = 0; i < NAV.length; i++) {
        const nv = NAV[i];
        nv.hover += ((i === hovered ? 1 : 0) - nv.hover) * Math.min(dt*9, 1);
        const e = nv.hover * 0.75;
        for (const mm of nv.mats) mm.emissive.copy(theme.accent).multiplyScalar(e * (theme.light ? 0.30 : 1));
      }
      if (label && hovered >= 0) {
        _p.set(0, NAV[hovered].group.position.y + NAV[hovered].h*0.7, 0).project(camera);
        label.style.left = ((_p.x*0.5 + 0.5) * cv.clientWidth) + "px";
        label.style.top  = ((-_p.y*0.5 + 0.5) * cv.clientHeight) + "px";
      }
    }

    /* ---- lanterns ---- */
    for (const L of lamps) {
      const nv = (NAV && L.group >= 0) ? NAV[L.group] : null;
      const lit = nv ? (buildT > (L.group / NAV.length) * 0.72 + 0.28) : buildT > 0.25;
      const flicker = 0.82 + 0.18*Math.sin(t*(2.1 + L.base) + L.seed)*Math.sin(t*5.3 + L.seed*2);
      const amt = (lit ? 1 : 0) * flicker * (nv ? 1 + nv.hover*2.4 : 1);
      if (L.light) L.light.intensity = L.base * amt * (theme.light ? 0.5 : 1.7);
      L.mesh.material.color.setRGB(1, 0.70, 0.34).multiplyScalar(0.55 + amt*0.75);
      L.mesh.scale.setScalar(0.85 + amt*0.35);
    }

    /* ---- rain ---- */
    for (let i = 0; i < RAIN; i++) {
      const d = drops[i];
      d.y -= d.v * dt;
      if (d.y < -1) { d.y += 44; d.x = (Math.random()-0.5)*70; d.z = (Math.random()-0.5)*70; }
      _m.compose(_p.set(d.x, d.y, d.z), _rq, _s);
      rain.setMatrixAt(i, _m);
    }
    rain.instanceMatrix.needsUpdate = true;

    /* ---- embers ---- */
    const ep = embGeo.attributes.position.array;
    for (let i = 0; i < EMB; i++) {
      const e = embers[i];
      e.y += e.v * dt;
      if (e.y > 24) { e.y = -1; e.x = (Math.random()-0.5)*26; e.z = (Math.random()-0.5)*26; }
      ep[i*3]   = e.x + Math.sin(t*0.5 + e.s)*0.7;
      ep[i*3+1] = e.y;
      ep[i*3+2] = e.z + Math.cos(t*0.4 + e.s)*0.7;
    }
    embGeo.attributes.position.needsUpdate = true;

    /* ---- the scene owns its camera; the core owns the withdrawal ---- */
    S.update(dt, t);
    camera.lookAt(look);
    cv.style.opacity = (1 - receP*0.66).toFixed(3);
    embMat.opacity = 0.75 * (1 - receP*0.8);

    /* ---- HUD ---- */
    const h = S.hud();
    if (buildT < 1) hud(h[0], "RAISING — " + Math.round(buildT*100) + "%");
    else if (NAV && hovered >= 0) hud(NAV[hovered].meta.layer,
      NAV[hovered].meta.n + " · " + NAV[hovered].meta.name + " — CLICK TO ENTER");
    else hud(h[0], h[1]);

    composer.render();
  }

  document.addEventListener("visibilitychange", () => { enabled = !document.hidden; last = performance.now(); });
  cv.addEventListener("webglcontextlost", e => { e.preventDefault(); alive = false; }, false);
  cv.addEventListener("webglcontextrestored", () => location.reload(), false);

  needResize = true;
  requestAnimationFrame(frame);

  /* --------------------------------------------------------------- public */
  window.NET3D = {
    scene: want,
    api: Object.assign({
      rebuild: () => { buildStart = performance.now(); buildT = 0; return want; }
    }, S.api || {}),
    toggle(on) {
      enabled = (typeof on === "boolean") ? on : !enabled;
      cv.style.visibility = enabled ? "" : "hidden";
      if (enabled) last = performance.now();
      return enabled;
    },
    stats: () => Object.assign({
      scene: want,
      renderer: "Three.js r149 + bloom",
      built: Math.round(buildT*100) + "%",
      lanterns: lamps.length,
      depth: (scrollT*100).toFixed(1) + "%"
    }, S.api && S.api.get ? S.api.get() : {})
  };
}
