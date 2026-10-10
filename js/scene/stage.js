/* =============================================================================
   STAGE — renderer, colour pipeline, lighting and the environment probe.

   Colour management is explicit on purpose: the scene renders linear into a
   half-float buffer, bloom happens in linear, and tone-mapping + sRGB encoding
   are done once in the final composite pass. Doing it any other way in this
   Three revision means either washed-out darks or double-encoded highlights.
   ============================================================================= */
import * as THREE            from "../../vendor/three/three.module.js";
import { EffectComposer }    from "../../vendor/three/jsm/postprocessing/EffectComposer.js";
import { RenderPass }        from "../../vendor/three/jsm/postprocessing/RenderPass.js";
import { ShaderPass }        from "../../vendor/three/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass }   from "../../vendor/three/jsm/postprocessing/UnrealBloomPass.js";
import { PALETTE, CAMERA, WORLD, THEME } from "../core/tokens.js";
import { state }             from "../core/state.js";

THREE.ColorManagement.enabled = true;

/* --- final composite: ACES tone map → vignette → grain → sRGB ---------------
   One pass, four jobs, no full-screen blur. Chromatic aberration is applied at
   the very edge of the frame only, where it reads as a lens and not a glitch. */
const CompositeShader = {
  uniforms: {
    tDiffuse:   { value: null },
    uTime:      { value: 0 },
    uVignette:  { value: 1.06 },
    uGrain:     { value: 0.028 },
    uAberration:{ value: 0.0016 },
    uExposure:  { value: 1.02 },
    uSaturation:{ value: 1.18 },
    uFade:      { value: 0.0 },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform float uTime, uVignette, uGrain, uAberration, uExposure, uSaturation, uFade;
    varying vec2 vUv;

    vec3 aces(vec3 x){
      const float a=2.51, b=0.03, c=2.43, d=0.59, e=0.14;
      return clamp((x*(a*x+b))/(x*(c*x+d)+e), 0.0, 1.0);
    }
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }

    void main(){
      vec2 c = vUv - 0.5;
      float r2 = dot(c,c);

      // lens dispersion, edges only
      float disp = uAberration * r2 * 4.0;
      vec3 col;
      col.r = texture2D(tDiffuse, vUv + c * disp).r;
      col.g = texture2D(tDiffuse, vUv).g;
      col.b = texture2D(tDiffuse, vUv - c * disp).b;

      col = aces(col * uExposure);

      // a controlled lift in chroma: the room is lit with colour, and ACES
      // pulls some of it back out. This puts a measured amount of it back.
      float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col = mix(vec3(luma), col, uSaturation);

      // vignette — a soft falloff, never a black ring
      float vig = smoothstep(0.98, 0.16, r2 * uVignette);
      col *= mix(0.62, 1.0, vig);

      // film grain, animated so it never bands
      float g = hash(vUv * 900.0 + uTime * 60.0) - 0.5;
      col += g * uGrain;

      col = pow(max(col, 0.0), vec3(1.0/2.2));      // linear -> sRGB
      col *= (1.0 - uFade);                          // boot / handoff fade
      gl_FragColor = vec4(col, 1.0);
    }`,
};

/* --- backdrop: the lit room the whole scene sits in -------------------------
   Four soft sources over a vertical base, authored in linear so it tone-maps
   with everything else. Values are low on purpose: this is the light in the
   room, not a painted poster behind the objects. */
const BackdropShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTop:     { value: new THREE.Color(0x05070f) },
    uBottom:  { value: new THREE.Color(0x03050c) },
    uGlowA:   { value: new THREE.Color(PALETTE.signal) },
    uGlowB:   { value: new THREE.Color(PALETTE.violet) },
    uGlowC:   { value: new THREE.Color(PALETTE.magenta) },
    uGain:    { value: 1.0 },
    uTime:    { value: 0 },
    uDrift:   { value: new THREE.Vector2(0, 0) },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: /* glsl */`
    uniform vec3 uTop, uBottom, uGlowA, uGlowB, uGlowC;
    uniform float uGain, uTime;
    uniform vec2 uDrift;
    varying vec2 vUv;

    float blob(vec2 uv, vec2 c, float r){
      float d = length((uv - c) * vec2(1.0, 0.72));
      return pow(max(0.0, 1.0 - d / r), 2.4);
    }

    void main(){
      vec2 uv = vUv + uDrift * 0.03;
      vec3 col = mix(uBottom, uTop, smoothstep(0.0, 1.0, vUv.y));
      col += uGlowA * blob(uv, vec2(0.14, 0.94), 0.85) * 0.040 * uGain;
      col += uGlowB * blob(uv, vec2(0.92, 0.66), 0.80) * 0.044 * uGain;
      col += uGlowC * blob(uv, vec2(0.72, 0.08), 0.70) * 0.022 * uGain;
      col += uGlowA * blob(uv, vec2(0.52, 0.44), 0.45) * 0.018 * uGain
             * (0.8 + 0.2 * sin(uTime * 0.25));
      gl_FragColor = vec4(col, 1.0);
    }`,
};

export function createStage(canvas, tier) {
  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: tier !== "low", alpha: true,
    powerPreference: "high-performance", stencil: false, depth: true,
  });
  renderer.outputEncoding = THREE.LinearEncoding;   // composite pass encodes
  renderer.toneMapping    = THREE.NoToneMapping;    // composite pass tone-maps
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(state.view.dpr, tier === "low" ? 1.5 : tier === "medium" ? 1.75 : 2));
  renderer.setSize(state.view.w, state.view.h, false);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(PALETTE.void, WORLD.fogNear, WORLD.fogFar);

  const camera = new THREE.PerspectiveCamera(CAMERA.fov, state.view.aspect, CAMERA.near, CAMERA.far);
  camera.position.set(CAMERA.home.x, CAMERA.home.y, CAMERA.home.z);

  /* --- lighting: colour arrives as light, not as painted surfaces --------- */
  const lights = {
    ambient: new THREE.AmbientLight(PALETTE.key, 0.42),
    hemi:    new THREE.HemisphereLight(PALETTE.signal, PALETTE.void, 0.38),
    key:     new THREE.DirectionalLight(PALETTE.signal, 1.15),
    fill:    new THREE.PointLight(PALETTE.violet, 90, 78, 2),
    rim:     new THREE.PointLight(PALETTE.key, 70, 90, 2),
    accent:  new THREE.PointLight(PALETTE.magenta, 22, 34, 2),
    heart:   new THREE.PointLight(PALETTE.amber, 12, 14, 2),
  };
  lights.key.position.set(-9, 12, 8);
  lights.fill.position.set(13, -3, -9);
  lights.rim.position.set(-12, 6, -16);
  lights.accent.position.set(7, 9, 6);
  lights.heart.position.set(0, 0, 0);
  Object.values(lights).forEach(l => scene.add(l));

  /* --- environment probe -------------------------------------------------
     A tiny procedural room: cool panels above, violet to one side, one warm
     card. Metal needs something to reflect or it renders as a black hole. */
  const env = buildEnvironment(renderer);
  scene.environment = env;

  /* --- post -------------------------------------------------------------
     The backdrop is drawn first, as a pass, and the scene renders on top of it
     without clearing. It has to exist: the composite writes opaque alpha, so a
     transparent canvas would paint the page black — invisible against a dark
     theme, catastrophic against a light one. Doing it in GL rather than CSS
     also means the sky is inside the tone-mapping, so it grades with the rest
     of the frame instead of sitting behind it. */
  const composer = new EffectComposer(renderer);
  composer.setSize(state.view.w, state.view.h);
  composer.setPixelRatio(renderer.getPixelRatio());

  const backdrop = new ShaderPass(BackdropShader);
  composer.addPass(backdrop);

  const renderPass = new RenderPass(scene, camera);
  renderPass.clear = false;        // keep the backdrop
  renderPass.clearDepth = true;    // but never inherit stale depth
  composer.addPass(renderPass);

  let bloom = null;
  if (tier !== "low") {
    bloom = new UnrealBloomPass(
      new THREE.Vector2(state.view.w, state.view.h),
      tier === "high" ? 0.62 : 0.5,   // strength
      0.62,                            // radius
      0.72                             // threshold — only genuine emitters bloom
    );
    composer.addPass(bloom);
  }
  const composite = new ShaderPass(CompositeShader);
  composite.renderToScreen = true;
  composer.addPass(composite);

  /* --- the room has two lighting states; the geometry never changes -------- */
  let themeKey = "dark";
  function setTheme(name) {
    themeKey = name === "light" ? "light" : "dark";
    const T = THEME[themeKey];
    scene.fog.color.setHex(T.fog);
    scene.fog.near = T.fogNear; scene.fog.far = T.fogFar;
    lights.ambient.intensity = T.ambient;
    lights.hemi.intensity = T.hemi;
    lights.key.intensity = T.key;
    lights.fill.intensity = T.fill;
    lights.rim.intensity = T.rim;
    if (bloom) bloom.strength = (tier === "high" ? 0.62 : 0.5) * T.bloom;
    composite.uniforms.uExposure.value = T.exposure;
    composite.uniforms.uSaturation.value = T.saturation;

    const b = backdrop.uniforms;
    b.uTop.value.setHex(themeKey === "light" ? 0xf3f1ea : 0x05070f);
    b.uBottom.value.setHex(themeKey === "light" ? 0xdedcd4 : 0x03050c);
    b.uGlowA.value.setHex(T.signal);
    b.uGlowB.value.setHex(T.second);
    b.uGlowC.value.setHex(themeKey === "light" ? 0xa83567 : 0xd8548c);
    b.uGain.value = themeKey === "light" ? 1.5 : 1.0;
    return T;
  }
  setTheme("dark");

  function resize() {
    const { w, h, aspect, dpr } = state.view;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    const px = Math.min(dpr, tier === "low" ? 1.5 : tier === "medium" ? 1.75 : 2);
    renderer.setPixelRatio(px);
    renderer.setSize(w, h, false);
    composer.setPixelRatio(px);
    composer.setSize(w, h);
    bloom?.setSize(w, h);
  }

  function dispose() {
    composer.passes.forEach(p => p.dispose?.());
    env?.dispose?.();
    renderer.dispose();
  }

  return { THREE, renderer, scene, camera, composer, composite, backdrop, bloom, lights, resize, dispose, setTheme,
           get theme() { return themeKey; } };
}

function buildEnvironment(renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  const room = new THREE.Scene();
  const panel = (hex, intensity, w, h, pos, rot) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(intensity), side: THREE.DoubleSide })
    );
    m.position.set(...pos);
    if (rot) m.rotation.set(...rot);
    room.add(m);
  };
  room.background = new THREE.Color(PALETTE.void);
  /* Striped, not flat. A uniform panel reflects as flat grey and every metal in
     the scene turns to putty; alternating bright and dark bands give a specular
     highlight something to break across. */
  for (let i = -3; i <= 3; i++) {
    panel(PALETTE.signal, i % 2 ? 4.2 : 0.35, 16, 1.5, [0, 8, i * 2.1], [Math.PI / 2, 0, 0]);
  }
  panel(PALETTE.violet, 2.6, 8, 14, [-10, 1, 0], [0, Math.PI / 2, 0]);      // violet wall
  panel(PALETTE.key,    2.0, 8, 14, [10, -1, 0], [0, -Math.PI / 2, 0]);     // blue wall
  panel(PALETTE.turquoise, 1.1, 5, 5, [0, 2, -11], [0, 0, 0]);              // cool backlight
  panel(PALETTE.amber,  1.6, 2.5, 2.5, [4, -3, 9], [0, Math.PI, 0]);        // one warm card
  panel(PALETTE.void,   1.0, 26, 26, [0, -9, 0], [-Math.PI / 2, 0, 0]);     // dark floor

  const target = pmrem.fromScene(room, 0.04);
  room.traverse(o => { o.geometry?.dispose(); o.material?.dispose(); });
  pmrem.dispose();
  return target.texture;
}
