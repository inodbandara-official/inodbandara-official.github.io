/* =============================================================================
   THE SYSTEM CORE — the infrastructure layer underneath modern software, built
   as an object you could machine.

   Read from the outside in:
     shell      smoked-glass geodesic housing, with hard edge lines
     endpoints  twelve machined modules on the shell vertices — where the
                network physically attaches
     gimbals    three counter-rotating metal rings; the moving parts
     lattice    the internal structure the housing protects
     channels   luminous conduits carrying energy outward from the centre
     heart      a single amber emitter — the only warm thing in the world

   Nothing here is a sci-fi reactor: there is no glow-for-glow's-sake surface.
   Every luminous element is a channel, an endpoint, or the heart.
   ============================================================================= */
import { PALETTE, WORLD, THEME } from "../core/tokens.js";
import { damp }                   from "../core/dom.js";

export function buildCore(THREE, tier) {
  const R = WORLD.coreRadius;
  const group = new THREE.Group();
  const disposables = [];
  const keep = o => { disposables.push(o); return o; };

  /* --- shell -------------------------------------------------------------- */
  const shellGeo = keep(new THREE.IcosahedronGeometry(R, 1));
  const shell = new THREE.Mesh(shellGeo, keep(new THREE.MeshPhysicalMaterial({
    color: PALETTE.glassTint,
    metalness: 0.0, roughness: 0.55,
    transparent: true, opacity: 0.075,
    envMapIntensity: 0.22, specularIntensity: 0.25,
    side: THREE.DoubleSide, flatShading: true, depthWrite: false,
  })));
  const shellEdges = new THREE.LineSegments(
    keep(new THREE.EdgesGeometry(shellGeo, 1)),
    keep(new THREE.LineBasicMaterial({ color: PALETTE.signal, transparent: true, opacity: 0.34 }))
  );
  const shellGrp = new THREE.Group();
  shellGrp.add(shell, shellEdges);
  group.add(shellGrp);

  /* --- endpoints: one machined module per shell vertex --------------------- */
  const anchorGeo = keep(new THREE.IcosahedronGeometry(R * 1.005, 0));
  const anchors = uniqueVertices(THREE, anchorGeo);
  const epGeo = keep(new THREE.BoxGeometry(0.34, 0.34, 0.5));
  const epMat = keep(new THREE.MeshStandardMaterial({
    color: PALETTE.metal, metalness: 0.95, roughness: 0.3, envMapIntensity: 0.9,
  }));
  const endpoints = new THREE.InstancedMesh(epGeo, epMat, anchors.length);
  const capGeo = keep(new THREE.PlaneGeometry(0.2, 0.2));
  const capMat = keep(new THREE.MeshBasicMaterial({
    color: PALETTE.signal, transparent: true, opacity: 0.9, side: THREE.DoubleSide,
  }));
  const caps = new THREE.InstancedMesh(capGeo, capMat, anchors.length);
  caps.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(anchors.length * 3), 3);

  const dummy = new THREE.Object3D();
  const up = new THREE.Vector3(0, 1, 0);
  anchors.forEach((v, i) => {
    dummy.position.copy(v);
    dummy.lookAt(v.clone().multiplyScalar(2));
    dummy.updateMatrix();
    endpoints.setMatrixAt(i, dummy.matrix);
    dummy.position.copy(v).multiplyScalar(1.09);
    dummy.updateMatrix();
    caps.setMatrixAt(i, dummy.matrix);
    caps.setColorAt(i, new THREE.Color(PALETTE.signal));
  });
  endpoints.instanceMatrix.needsUpdate = true;
  caps.instanceMatrix.needsUpdate = true;
  shellGrp.add(endpoints, caps);

  /* --- gimbals: the moving parts ------------------------------------------ */
  const ringMat = keep(new THREE.MeshStandardMaterial({
    color: PALETTE.metal, metalness: 1.0, roughness: 0.22, envMapIntensity: 1.15,
  }));
  const seg = tier === "low" ? [80, 8] : [160, 14];
  const gimbals = [
    ring(THREE, keep, ringMat, R * 1.28, 0.045, seg, [Math.PI / 2, 0, 0]),
    ring(THREE, keep, ringMat, R * 1.46, 0.032, seg, [0, 0, Math.PI / 2.4]),
    ring(THREE, keep, ringMat, R * 1.64, 0.024, seg, [Math.PI / 3.1, Math.PI / 5, 0]),
  ];
  gimbals.forEach(g => group.add(g));

  /* thin index marks riding the outer gimbal — a scale, like a real instrument */
  const marks = new THREE.LineSegments(
    keep(tickRing(THREE, R * 1.72, 48, 0.12)),
    keep(new THREE.LineBasicMaterial({ color: PALETTE.signal, transparent: true, opacity: 0.22 }))
  );
  marks.rotation.x = Math.PI / 2;
  group.add(marks);

  /* --- internal lattice ---------------------------------------------------- */
  const latGeo = keep(new THREE.OctahedronGeometry(R * 0.62, 1));
  const lattice = new THREE.Mesh(latGeo, keep(new THREE.MeshStandardMaterial({
    color: PALETTE.ceramic, metalness: 0.65, roughness: 0.42,
    flatShading: true, envMapIntensity: 0.55,
  })));
  const latEdges = new THREE.LineSegments(
    keep(new THREE.EdgesGeometry(latGeo, 1)),
    keep(new THREE.LineBasicMaterial({ color: PALETTE.violet, transparent: true, opacity: 0.5 }))
  );
  const latGrp = new THREE.Group();
  latGrp.add(lattice, latEdges);
  group.add(latGrp);

  /* --- channels: conduits from the heart out through the lattice ----------- */
  const chGeo = keep(new THREE.CylinderGeometry(0.017, 0.045, R * 0.94, 6, 1, true));
  const chMat = keep(new THREE.MeshBasicMaterial({
    color: PALETTE.signal, transparent: true, opacity: 0.8,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  const channels = new THREE.InstancedMesh(chGeo, chMat, anchors.length);
  channels.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(anchors.length * 3), 3);
  const chPhase = new Float32Array(anchors.length);
  anchors.forEach((v, i) => {
    const dir = v.clone().normalize();
    dummy.position.copy(dir).multiplyScalar(R * 0.5);
    dummy.quaternion.setFromUnitVectors(up, dir);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    channels.setMatrixAt(i, dummy.matrix);
    chPhase[i] = Math.random() * Math.PI * 2;
  });
  channels.instanceMatrix.needsUpdate = true;
  latGrp.add(channels);

  /* --- heart --------------------------------------------------------------- */
  const heart = new THREE.Mesh(
    keep(new THREE.IcosahedronGeometry(0.66, 1)),
    keep(new THREE.MeshBasicMaterial({ color: PALETTE.amber }))
  );
  const halo = new THREE.Mesh(
    keep(new THREE.SphereGeometry(1.9, 24, 18)),
    keep(new THREE.MeshBasicMaterial({
      color: PALETTE.amber, transparent: true, opacity: 0.09,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide,
    }))
  );
  group.add(heart, halo);

  /* --------------------------------------------------------------------- */
  const cTmp = new THREE.Color();
  let energy = 0, target = 0, boot = 0;
  let T = THEME.dark;

  /* The core is the same machine in both themes; only what the room does to it
     changes. Emissive parts stop adding light and start absorbing it. */
  function setTheme(name) {
    T = THEME[name === "light" ? "light" : "dark"];
    shell.material.color.setHex(T.glass);
    shell.material.envMapIntensity = name === "light" ? 0.18 : 0.22;
    shellEdges.material.color.setHex(T.signal);
    epMat.color.setHex(T.metal);
    ringMat.color.setHex(T.metal);
    lattice.material.color.setHex(T.ceramic);
    latEdges.material.color.setHex(T.second);
    marks.material.color.setHex(T.signal);
    const blend = T.additive ? THREE.AdditiveBlending : THREE.NormalBlending;
    chMat.blending = blend; chMat.needsUpdate = true;
    halo.material.blending = blend; halo.material.needsUpdate = true;
    capMat.needsUpdate = true;
  }
  setTheme("dark");

  return {
    group, setTheme,
    anchors,                       // world-space attach points for the network
    /** 0..1 — how far the core has powered up. Driven by the boot sequence. */
    setBoot(v) { boot = v; },
    /** A momentary surge: terminal command, packet burst, section change. */
    pulse(v = 1) { target = Math.min(2.2, target + v); },

    update(dt, t) {
      target = damp(target, 0, 1.6, dt);
      energy = damp(energy, target, 4.5, dt);
      const b = boot;

      shellGrp.rotation.y += dt * 0.055;
      shellGrp.rotation.x = Math.sin(t * 0.09) * 0.05;
      gimbals[0].rotation.z += dt * 0.16;
      gimbals[1].rotation.y -= dt * 0.11;
      gimbals[2].rotation.x += dt * 0.075;
      marks.rotation.z -= dt * 0.04;
      latGrp.rotation.y -= dt * 0.13;
      latGrp.rotation.z = Math.sin(t * 0.14) * 0.08;

      /* the heart breathes; it does not strobe */
      const beat = 0.86 + Math.sin(t * 0.7) * 0.09 + energy * 0.22;
      heart.scale.setScalar((0.55 + 0.45 * b) * beat);
      halo.scale.setScalar((0.6 + 0.4 * b) * (1 + energy * 0.16));
      halo.material.opacity = (0.045 + energy * 0.05) * b;

      shell.material.opacity = T.glassOpacity * 0.6 * b;
      shellEdges.material.opacity = (T.edgeOpacity * 0.75 + energy * 0.16) * b;
      latEdges.material.opacity = (T.edgeOpacity * 1.2 + energy * 0.2) * b;
      marks.material.opacity = T.edgeOpacity * 0.7 * b;

      /* each conduit carries its own travelling pulse */
      for (let i = 0; i < anchors.length; i++) {
        const p = 0.5 + 0.5 * Math.sin(t * 1.15 + chPhase[i]);
        const v = (0.40 + p * 0.75 + energy * 0.5) * b;
        cTmp.setHex(T.signal).multiplyScalar(v);
        channels.setColorAt(i, cTmp);
        cTmp.setHex(p > 0.75 ? T.signal : T.tertiary).multiplyScalar((0.5 + p) * b);
        caps.setColorAt(i, cTmp);
      }
      channels.instanceColor.needsUpdate = true;
      caps.instanceColor.needsUpdate = true;

      return energy;
    },

    dispose() { disposables.forEach(d => d.dispose?.()); },
  };
}

/* --- helpers ---------------------------------------------------------------- */
function ring(THREE, keep, mat, radius, tube, seg, rot) {
  const m = new THREE.Mesh(keep(new THREE.TorusGeometry(radius, tube, seg[1], seg[0])), mat);
  m.rotation.set(...rot);
  return m;
}

function tickRing(THREE, radius, count, len) {
  const pos = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const l = i % 6 === 0 ? len * 2.2 : len;
    pos.push(Math.cos(a) * radius, Math.sin(a) * radius, 0);
    pos.push(Math.cos(a) * (radius + l), Math.sin(a) * (radius + l), 0);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  return g;
}

/** Icosahedron geometry is non-indexed; collapse it back to its 12 vertices. */
function uniqueVertices(THREE, geo) {
  const p = geo.attributes.position;
  const out = [], seen = new Set();
  for (let i = 0; i < p.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(p, i);
    const k = v.toArray().map(n => n.toFixed(3)).join(",");
    if (seen.has(k)) continue;
    seen.add(k); out.push(v);
  }
  return out;
}
