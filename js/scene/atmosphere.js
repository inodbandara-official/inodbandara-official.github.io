/* =============================================================================
   ATMOSPHERE — what makes the environment feel like a place with a size.

     grid        an architectural measurement plane, almost invisible
     structures  distant machine halls that give the world a horizon
     dust        suspended particulate, so light has something to sit in

   Deliberately not a starfield. This is a technological interior, not space.
   ============================================================================= */
import { PALETTE, WORLD, THEME } from "../core/tokens.js";

export function buildAtmosphere(THREE, tier, density) {
  const group = new THREE.Group();
  const disposables = [];
  const keep = o => { disposables.push(o); return o; };

  /* ---- the measurement plane ---------------------------------------------
     Drawn in a shader so the line weight stays constant and the whole thing
     dissolves into the fog instead of ending at a hard edge. */
  const gridMat = keep(new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: {
      uColor:  { value: new THREE.Color(PALETTE.signal) },
      uMajor:  { value: new THREE.Color(PALETTE.violet) },
      uTime:   { value: 0 },
      uBoot:   { value: 0 },
      uGain:   { value: 1 },
      uFade:   { value: WORLD.gridSize * 0.34 },
    },
    vertexShader: /* glsl */`
      varying vec3 vPos;
      void main(){
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uColor, uMajor;
      uniform float uTime, uBoot, uFade, uGain;
      varying vec3 vPos;

      float lines(vec2 p, float step, float w){
        vec2 g = abs(fract(p / step - 0.5) - 0.5) / fwidth(p / step);
        return 1.0 - min(min(g.x, g.y) / w, 1.0);
      }

      void main(){
        vec2 p = vPos.xy;
        float minor = lines(p, 2.0, 1.4);
        float major = lines(p, 16.0, 1.6);

        float d = length(p);
        float fall = 1.0 - smoothstep(uFade * 0.15, uFade, d);

        // a slow measurement sweep, once every several seconds
        float sweep = smoothstep(0.0, 1.0, 1.0 - abs(d - mod(uTime * 7.0, uFade * 1.6)) / 5.0) * 0.5;

        vec3 col = mix(uColor * 0.5, uMajor * 0.55, major);
        float a = (minor * 0.055 + major * 0.14 + sweep * minor * 0.12) * fall * uBoot * uGain;
        if (a < 0.002) discard;
        gl_FragColor = vec4(col, a);
      }`,
  }));
  const grid = new THREE.Mesh(keep(new THREE.PlaneGeometry(WORLD.gridSize, WORLD.gridSize)), gridMat);
  grid.rotation.x = -Math.PI / 2;
  grid.position.y = WORLD.gridY;
  group.add(grid);

  /* ---- distant structures -------------------------------------------------
     Tall, narrow, almost black. They exist to be occluded and rim-lit; you are
     meant to read scale from them, not detail. */
  const sGeo = keep(new THREE.BoxGeometry(1, 1, 1));
  /* Unlit, and dissolving upward. Two lessons are baked in here: a physically
     shaded box at this distance picks up the environment probe and turns into a
     pale slab, and a hard-edged dark box reads as a rectangle pasted on the sky.
     So: flat colour, alpha falling off toward the top of each hall and again
     with distance. What survives is a silhouette that fades into the haze —
     and the lit service band, which is the only part you are meant to notice. */
  const sMat = keep(new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.FrontSide,
    uniforms: {
      uColor: { value: new THREE.Color(0x010208) },
      uNear:  { value: WORLD.structureRing * 0.5 },
      uFar:   { value: WORLD.structureRing * 2.0 },
      uBoot:  { value: 0 },
    },
    vertexShader: /* glsl */`
      varying float vY;
      varying float vDist;
      void main(){
        vY = position.y;                       // -0.5 .. 0.5 in box space
        vec4 mv = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
        vDist = -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uColor;
      uniform float uNear, uFar, uBoot;
      varying float vY;
      varying float vDist;
      void main(){
        float up   = smoothstep(0.5, -0.15, vY);              // dissolve at the top
        float far  = 1.0 - smoothstep(uNear, uFar, vDist);    // and into the distance
        float a = up * far * uBoot;
        if (a < 0.004) discard;
        gl_FragColor = vec4(uColor, a);
      }`,
  }));
  const count = density.structures;
  const structures = new THREE.InstancedMesh(sGeo, sMat, count);
  const stripGeo = keep(new THREE.PlaneGeometry(1, 1));
  const stripMat = keep(new THREE.MeshBasicMaterial({
    color: PALETTE.signal, transparent: true, opacity: 0.42,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  }));
  const strips = new THREE.InstancedMesh(stripGeo, stripMat, count);
  strips.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);

  const d = new THREE.Object3D();
  const col = new THREE.Color();
  const strip = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + Math.random() * 0.18;
    const [lo, hi2] = WORLD.structureSpread;
    const r = WORLD.structureRing * (lo + Math.random() * (hi2 - lo));
    /* a skyline, not scenery. The top is chosen first and pinned just above
       the floor plane, then the box is grown downward from it — so no matter
       how tall a hall is, it never rises into the frame as a floating slab. */
    const h = 9 + Math.random() * 18;
    const w = 4 + Math.random() * 9;
    const top = WORLD.gridY + 1.5 + Math.random() * 3.5;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    d.position.set(x, top - h / 2, z);
    d.rotation.set(0, -a + (Math.random() - 0.5) * 0.5, 0);
    d.scale.set(w, h, w * (0.5 + Math.random() * 0.7));
    d.updateMatrix();
    structures.setMatrixAt(i, d.matrix);

    /* one lit service band per structure — the only light they emit */
    const by = top - h * (0.15 + Math.random() * 0.4);
    d.position.set(x * 0.985, by, z * 0.985);
    d.scale.set(w * 0.9, 0.16 + Math.random() * 0.3, 1);
    d.updateMatrix();
    strips.setMatrixAt(i, d.matrix);
    strip.push({ phase: Math.random() * Math.PI * 2, speed: 0.25 + Math.random() * 0.5 });
    col.setHex(Math.random() < 0.2 ? PALETTE.violet : PALETTE.signal);
    strips.setColorAt(i, col);
  }
  structures.instanceMatrix.needsUpdate = true;
  strips.instanceMatrix.needsUpdate = true;
  group.add(structures, strips);

  /* ---- suspended particulate --------------------------------------------- */
  const n = density.dust;
  const dp = new Float32Array(n * 3);
  const dc = new Float32Array(n * 3);
  const ds = new Float32Array(n);
  const dv = new Float32Array(n);
  const span = 96, hi = 46;
  for (let i = 0; i < n; i++) {
    dp[i * 3]     = (Math.random() - 0.5) * span;
    dp[i * 3 + 1] = WORLD.gridY + Math.random() * hi;
    dp[i * 3 + 2] = (Math.random() - 0.5) * span;
    const c = Math.random();
    col.setHex(c < 0.72 ? PALETTE.signal : c < 0.94 ? PALETTE.violet : PALETTE.amber)
       .multiplyScalar(0.09 + Math.random() * 0.2);
    dc[i * 3] = col.r; dc[i * 3 + 1] = col.g; dc[i * 3 + 2] = col.b;
    ds[i] = 0.5 + Math.random() * 1.35;
    dv[i] = 0.12 + Math.random() * 0.5;
  }
  const dustGeo = keep(new THREE.BufferGeometry());
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dp, 3));
  dustGeo.setAttribute("color", new THREE.BufferAttribute(dc, 3));
  dustGeo.setAttribute("size", new THREE.BufferAttribute(ds, 1));
  const dustMat = keep(new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: true,
    uniforms: { uBoot: { value: 0 }, uGain: { value: 1 } },
    vertexShader: /* glsl */`
      attribute float size;
      varying vec3 vColor; varying float vFade;
      void main(){
        vColor = color;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        float dist = -mv.z;
        vFade = smoothstep(150.0, 12.0, dist) * smoothstep(1.5, 8.0, dist);
        gl_PointSize = size * 26.0 / max(0.001, dist);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform float uBoot, uGain;
      varying vec3 vColor; varying float vFade;
      void main(){
        vec2 c = gl_PointCoord - 0.5;
        float a = smoothstep(0.5, 0.0, length(c));
        gl_FragColor = vec4(vColor * uGain, a * vFade * uBoot);
      }`,
  }));
  const dust = new THREE.Points(dustGeo, dustMat);
  dust.frustumCulled = false;
  group.add(dust);

  let boot = 0;
  let T = THEME.dark;
  const ground = new THREE.Color(0x000000);

  function setTheme(name) {
    T = THEME[name === "light" ? "light" : "dark"];
    gridMat.uniforms.uColor.value.setHex(T.signal);
    gridMat.uniforms.uMajor.value.setHex(T.second);
    gridMat.uniforms.uGain.value = T.gridGain;
    ground.setHex(name === "light" ? 0xe9e7e0 : 0x000000);
    sMat.uniforms.uColor.value.setHex(T.structure);
    stripMat.color.setHex(T.structureLine);
    const blend = T.additive ? THREE.AdditiveBlending : THREE.NormalBlending;
    stripMat.blending = blend; stripMat.needsUpdate = true;
    dustMat.blending = blend; dustMat.needsUpdate = true;
    dustMat.uniforms.uGain.value = T.dustGain;
  }
  setTheme("dark");

  return {
    group, setTheme,
    setBoot(v) { boot = v; },
    update(dt, t) {
      gridMat.uniforms.uTime.value = t;
      gridMat.uniforms.uBoot.value = boot;
      sMat.uniforms.uBoot.value = boot;
      dustMat.uniforms.uBoot.value = boot;

      /* particulate rises slowly and wraps; no wind, no chaos */
      for (let i = 0; i < n; i++) {
        dp[i * 3 + 1] += dv[i] * dt;
        dp[i * 3] += Math.sin(t * 0.12 + i) * dt * 0.06;
        if (dp[i * 3 + 1] > WORLD.gridY + hi) dp[i * 3 + 1] = WORLD.gridY;
      }
      dustGeo.attributes.position.needsUpdate = true;

      /* the service bands breathe out of phase with each other */
      for (let i = 0; i < count; i++) {
        const s = strip[i];
        const v = (0.35 + 0.5 * (0.5 + 0.5 * Math.sin(t * s.speed + s.phase))) * boot;
        col.setHex(T.signal);
        if (T.additive) col.multiplyScalar(v);
        else col.lerp(ground, Math.max(0, Math.min(0.9, 1 - v * 2.6)));
        strips.setColorAt(i, col);
      }
      strips.instanceColor.needsUpdate = true;
    },
    dispose() { disposables.forEach(x => x.dispose?.()); },
  };
}
