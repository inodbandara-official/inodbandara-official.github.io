/* =============================================================================
   THE NETWORK — services, links and traffic.

   Nodes sit on three depth shells around the core: the near shell is the
   application surface, the middle shell the services, the far shell the
   substrate. Links are built from nearest neighbours plus deliberate
   cross-shell hops, so the topology reads as tiered infrastructure rather than
   a random point cloud.

   Traffic is routed, not sprayed: a packet travels one link, arrives, lights
   the node it reached, then chooses an onward link from that node's adjacency.
   That is the whole of REQUEST → SERVICE → DATABASE → RESPONSE, drawn instead
   of written down.
   ============================================================================= */
import { PALETTE, WORLD, THEME } from "../core/tokens.js";
import { damp, clamp }    from "../core/dom.js";

export function buildNetwork(THREE, tier, density, content) {
  const group = new THREE.Group();
  const disposables = [];
  const keep = o => { disposables.push(o); return o; };

  /* ---- node placement ---------------------------------------------------- */
  const shells = WORLD.shellRadii;
  const perShell = [0.34, 0.36, 0.30].map(f => Math.round(density.nodes * f));
  const nodes = [];
  shells.forEach((radius, s) => {
    const n = perShell[s];
    for (let i = 0; i < n; i++) {
      const p = fibonacci(i, n, radius);
      /* flattened in Y: this is an environment with a floor and a sky, not a ball */
      p.y *= 0.68;
      p.x += (Math.random() - 0.5) * radius * 0.11;
      p.y += (Math.random() - 0.5) * radius * 0.09;
      p.z += (Math.random() - 0.5) * radius * 0.11;
      nodes.push({
        pos: new THREE.Vector3(p.x, p.y, p.z),
        home: new THREE.Vector3(p.x, p.y, p.z),
        shell: s, energy: 0, base: 0.045 + (2 - s) * 0.012,
        scale: 1, content: null,
        phase: Math.random() * Math.PI * 2,
      });
    }
  });

  /* ---- content binding ---------------------------------------------------
     Real portfolio entries become real nodes. A project is not "represented
     by" a dot near some geometry; it *is* one of the services in the graph. */
  const contentNodes = [];
  if (content?.length) {
    const pool = nodes.map((n, i) => i).filter(i => nodes[i].shell <= 1);
    /* spread the picks so labels never stack up on one side of the frame */
    const step = Math.max(1, Math.floor(pool.length / content.length));
    content.forEach((c, k) => {
      const idx = pool[(k * step + 3) % pool.length];
      const n = nodes[idx];
      n.content = c;
      n.base = 0.115;
      n.pos.multiplyScalar(1.02);
      n.home.copy(n.pos);
      contentNodes.push({ index: idx, node: n, ...c });
    });
  }

  /* ---- links -------------------------------------------------------------
     k-nearest inside a shell, plus a measured number of hops down a tier. */
  const links = [];
  const adjacency = nodes.map(() => []);
  const addLink = (a, b) => {
    if (a === b) return;
    const key = a < b ? a + ":" + b : b + ":" + a;
    if (addLink.seen.has(key)) return;
    addLink.seen.add(key);
    const i = links.length;
    links.push({ a, b, charge: 0, len: nodes[a].pos.distanceTo(nodes[b].pos) });
    adjacency[a].push(i); adjacency[b].push(i);
  };
  addLink.seen = new Set();

  nodes.forEach((n, i) => {
    const near = nodes
      .map((m, j) => ({ j, d: j === i ? Infinity : n.pos.distanceTo(m.pos), shell: m.shell }))
      .sort((x, y) => x.d - y.d);
    const k = n.content ? 4 : 2 + (Math.random() < 0.35 ? 1 : 0);
    for (let c = 0; c < k && c < near.length; c++) {
      if (near[c].d > Math.min(WORLD.maxLink, shells[n.shell] * 0.62)) break;
      addLink(i, near[c].j);
      if (links.length >= density.links) break;
    }
    /* one hop inward, occasionally — the tiers have to actually talk */
    if (n.shell > 0 && Math.random() < 0.4) {
      const inward = near.find(x => x.shell === n.shell - 1 && x.d < WORLD.maxLink * 1.5);
      if (inward) addLink(i, inward.j);
    }
  });

  /* ---- geometry: nodes ---------------------------------------------------- */
  const nodeGeo = keep(new THREE.OctahedronGeometry(1, 0));
  const nodeMat = keep(new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.95 }));
  const nodeMesh = new THREE.InstancedMesh(nodeGeo, nodeMat, nodes.length);
  nodeMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(nodes.length * 3), 3);
  nodeMesh.frustumCulled = false;
  group.add(nodeMesh);

  /* a soft additive bloom disc behind the bigger nodes; sells them as emitters */
  const glowGeo = keep(new THREE.PlaneGeometry(1, 1));
  const glowMat = keep(new THREE.MeshBasicMaterial({
    transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending,
    depthWrite: false, map: keep(radialTexture(THREE)),
  }));
  const glowMesh = new THREE.InstancedMesh(glowGeo, glowMat, nodes.length);
  glowMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(nodes.length * 3), 3);
  glowMesh.frustumCulled = false;
  group.add(glowMesh);

  /* ---- geometry: links ---------------------------------------------------- */
  const lp = new Float32Array(links.length * 6);
  const lc = new Float32Array(links.length * 6);
  links.forEach((l, i) => {
    const a = nodes[l.a].pos, b = nodes[l.b].pos;
    lp.set([a.x, a.y, a.z, b.x, b.y, b.z], i * 6);
  });
  const linkGeo = keep(new THREE.BufferGeometry());
  linkGeo.setAttribute("position", new THREE.BufferAttribute(lp, 3));
  linkGeo.setAttribute("color", new THREE.BufferAttribute(lc, 3));
  const linkMesh = new THREE.LineSegments(linkGeo, keep(new THREE.LineBasicMaterial({
    vertexColors: true, transparent: true, opacity: 0.8,
    blending: THREE.AdditiveBlending, depthWrite: false,
  })));
  linkMesh.frustumCulled = false;
  group.add(linkMesh);

  /* ---- geometry: packets -------------------------------------------------- */
  const pCount = Math.min(density.packets, links.length);
  const pp = new Float32Array(pCount * 3);
  const pc = new Float32Array(pCount * 3);
  const ps = new Float32Array(pCount);
  const packets = [];
  for (let i = 0; i < pCount; i++) {
    const li = Math.floor(Math.random() * links.length);
    packets.push({
      link: li, dir: Math.random() < 0.5 ? 1 : -1,
      t: Math.random(), speed: 0.09 + Math.random() * 0.16,
      alt: Math.random() < 0.16,      // a minority of traffic runs on the second channel
    });
    ps[i] = 2 + Math.random() * 2.6;
  }
  const pktGeo = keep(new THREE.BufferGeometry());
  pktGeo.setAttribute("position", new THREE.BufferAttribute(pp, 3));
  pktGeo.setAttribute("color", new THREE.BufferAttribute(pc, 3));
  pktGeo.setAttribute("size", new THREE.BufferAttribute(ps, 1));
  const pktMat = keep(new THREE.ShaderMaterial({
    uniforms: { uScale: { value: 1 }, uMap: { value: keep(radialTexture(THREE)) }, uOpacity: { value: 1 } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      attribute float size;
      varying vec3 vColor;
      uniform float uScale;
      void main(){
        vColor = color;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * uScale / max(0.001, -mv.z) * 30.0;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D uMap;
      uniform float uOpacity;
      varying vec3 vColor;
      void main(){
        vec4 t = texture2D(uMap, gl_PointCoord);
        gl_FragColor = vec4(vColor, t.a * uOpacity);
      }`,
    vertexColors: true,
  }));
  const pktMesh = new THREE.Points(pktGeo, pktMat);
  pktMesh.frustumCulled = false;
  group.add(pktMesh);

  /* --------------------------------------------------------------------- */
  const dummy = new THREE.Object3D();
  const col = new THREE.Color();
  let T = THEME.dark;
  let shellColor = [T.signal, T.tertiary, T.second];
  let boot = 0, hovered = null, focused = null, globalEnergy = 0;
  const ground = new THREE.Color(0x000000);

  /* Brightness means the opposite thing in each theme. On black, "quiet" is
     a colour scaled toward zero. On paper, scaling toward zero gives you a
     hard black scribble — quiet there means fading toward the page. One
     helper, so no call site has to know which room it is in. */
  const tone = (c, v) => T.additive ? c.multiplyScalar(v)
                                    : c.lerp(ground, clamp(1 - v * 3.1, 0, 0.9));

  /* On a light ground, additive traffic would burn straight to white. The graph
     switches to normal blending and darkens instead. */
  function setTheme(name) {
    T = THEME[name === "light" ? "light" : "dark"];
    shellColor = [T.signal, T.tertiary, T.second];
    ground.setHex(name === "light" ? 0xe9e7e0 : 0x000000);
    const blend = T.additive ? THREE.AdditiveBlending : THREE.NormalBlending;
    for (const m of [linkMesh.material, pktMat, glowMat]) { m.blending = blend; m.needsUpdate = true; }
    linkMesh.material.opacity = T.additive ? 0.8 : 0.95;
    glowMat.opacity = T.additive ? 0.5 : 0.22;
    nodeMat.opacity = T.additive ? 0.95 : 1;
  }
  setTheme("dark");
  const tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3();

  function update(dt, t, camera) {
    globalEnergy = damp(globalEnergy, 0, 1.4, dt);

    /* --- packets ---------------------------------------------------------- */
    for (let i = 0; i < packets.length; i++) {
      const p = packets[i];
      const l = links[p.link];
      if (!l) continue;
      p.t += p.speed * dt * (0.6 / Math.max(0.35, l.len * 0.1)) * (1 + globalEnergy);
      if (p.t >= 1) {
        /* arrived: light the node, then route onward from its adjacency */
        const arrived = p.dir > 0 ? l.b : l.a;
        nodes[arrived].energy = Math.min(1.6, nodes[arrived].energy + 0.85);
        l.charge = Math.min(1.4, l.charge + 0.8);
        const out = adjacency[arrived];
        const next = out.length ? out[(Math.random() * out.length) | 0] : (Math.random() * links.length) | 0;
        p.link = next;
        p.dir = links[next].a === arrived ? 1 : -1;
        p.t = 0;
        p.speed = 0.09 + Math.random() * 0.16;
      }
      const link = links[p.link];
      tmpA.copy(nodes[link.a].pos); tmpB.copy(nodes[link.b].pos);
      const tt = p.dir > 0 ? p.t : 1 - p.t;
      pp[i * 3]     = tmpA.x + (tmpB.x - tmpA.x) * tt;
      pp[i * 3 + 1] = tmpA.y + (tmpB.y - tmpA.y) * tt;
      pp[i * 3 + 2] = tmpA.z + (tmpB.z - tmpA.z) * tt;
      tone(col.setHex(p.alt ? T.second : T.signal), boot);
      pc[i * 3] = col.r; pc[i * 3 + 1] = col.g; pc[i * 3 + 2] = col.b;
    }
    pktGeo.attributes.position.needsUpdate = true;
    pktGeo.attributes.color.needsUpdate = true;
    pktMat.uniforms.uScale.value = 1;
    pktMat.uniforms.uOpacity.value = boot;

    /* --- links ------------------------------------------------------------ */
    for (let i = 0; i < links.length; i++) {
      const l = links[i];
      l.charge = damp(l.charge, 0, 2.6, dt);
      const hot = (hovered != null && (l.a === hovered || l.b === hovered)) ||
                  (focused != null && (l.a === focused || l.b === focused));
      const tier = Math.max(nodes[l.a].shell, nodes[l.b].shell);
      const base = [0.20, 0.11, 0.05][tier];
      const v = (base + l.charge * 0.30 + (hot ? 0.5 : 0)) * boot;
      tone(col.setHex(hot ? PALETTE.amber : shellColor[nodes[l.a].shell]), v);
      lc[i * 6] = col.r; lc[i * 6 + 1] = col.g; lc[i * 6 + 2] = col.b;
      lc[i * 6 + 3] = col.r; lc[i * 6 + 4] = col.g; lc[i * 6 + 5] = col.b;
    }
    linkGeo.attributes.color.needsUpdate = true;

    /* --- nodes ------------------------------------------------------------ */
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      n.energy = damp(n.energy, 0, 2.2, dt);
      /* every node breathes very slightly, so the field is never static */
      const drift = Math.sin(t * 0.35 + n.phase) * 0.05;
      n.pos.copy(n.home).multiplyScalar(1 + drift * 0.012);
      n.pos.y = n.home.y + drift * 0.14;

      const isHot = i === hovered || i === focused;
      const s = (n.base * (1 + n.energy * 0.5 + (isHot ? 1.1 : 0))) * boot;
      dummy.position.copy(n.pos);
      dummy.scale.setScalar(Math.max(0.0001, s));
      dummy.rotation.set(t * 0.2 + n.phase, t * 0.15 + n.phase, 0);
      dummy.updateMatrix();
      nodeMesh.setMatrixAt(i, dummy.matrix);

      const lit = 0.58 + n.energy * 0.85 + (isHot ? 0.9 : 0);
      tone(col.setHex(isHot ? PALETTE.amber : n.content ? PALETTE.turquoise : shellColor[n.shell]), lit * boot);
      nodeMesh.setColorAt(i, col);

      /* glow billboard only where it earns its place */
      const gs = n.content || n.energy > 0.05 || isHot
        ? (n.base * 13 * (0.45 + n.energy * 0.55 + (isHot ? 1.1 : 0))) * boot : 0.0001;
      dummy.scale.setScalar(gs);
      dummy.rotation.set(0, 0, 0);
      if (camera) dummy.quaternion.copy(camera.quaternion);
      dummy.updateMatrix();
      glowMesh.setMatrixAt(i, dummy.matrix);
      if (T.additive) col.multiplyScalar(0.34);
      glowMesh.setColorAt(i, col);
    }
    nodeMesh.instanceMatrix.needsUpdate = true;
    nodeMesh.instanceColor.needsUpdate = true;
    glowMesh.instanceMatrix.needsUpdate = true;
    glowMesh.instanceColor.needsUpdate = true;
  }

  /** Screen-space pick against the content nodes only. Precise, and it costs
   *  ten projections instead of a full raycast against 130 instances. */
  function pick(camera, px, py, w, h, radius = 52) {
    let best = null, bestD = radius * radius;
    for (const c of contentNodes) {
      tmpA.copy(c.node.pos).project(camera);
      if (tmpA.z > 1) continue;
      const sx = (tmpA.x * 0.5 + 0.5) * w, sy = (-tmpA.y * 0.5 + 0.5) * h;
      const d = (sx - px) * (sx - px) + (sy - py) * (sy - py);
      if (d < bestD) { bestD = d; best = c; }
    }
    return best;
  }

  return {
    group, nodes, links, contentNodes, setTheme,
    setBoot(v) { boot = clamp(v, 0, 1); },
    hover(i)   { hovered = i; if (i != null) nodes[i] && (nodes[i].energy = 1.4); },
    focus(i)   { focused = i; if (i != null && nodes[i]) nodes[i].energy = 1.6; },
    /** index of the node bound to content item `k` */
    contentIndex(k) { return contentNodes[k]?.index ?? null; },
    pulse(v = 1) {
      globalEnergy = Math.min(2, globalEnergy + v);
      for (let i = 0; i < nodes.length; i += 3) nodes[i].energy = Math.min(1.6, nodes[i].energy + v * 0.5);
    },
    update, pick,
    dispose() { disposables.forEach(d => d.dispose?.()); },
  };
}

/* --- helpers ---------------------------------------------------------------- */
function fibonacci(i, n, r) {
  const y = 1 - (i / (n - 1)) * 2;
  const rad = Math.sqrt(Math.max(0, 1 - y * y));
  const theta = Math.PI * (3 - Math.sqrt(5)) * i;
  return { x: Math.cos(theta) * rad * r, y: y * r, z: Math.sin(theta) * rad * r };
}

/** A soft radial falloff, generated once. No texture files to load or 404. */
function radialTexture(THREE, size = 64) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0.0, "rgba(255,255,255,1)");
  grad.addColorStop(0.25, "rgba(255,255,255,.55)");
  grad.addColorStop(1.0, "rgba(255,255,255,0)");
  g.fillStyle = grad; g.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.LinearFilter;
  return tex;
}
