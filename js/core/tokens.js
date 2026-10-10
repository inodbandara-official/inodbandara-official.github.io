/* =============================================================================
   DESIGN TOKENS  —  the single source for anything with a number in it.
   CSS owns surface/typography tokens (styles.css :root); this file owns the
   values the WebGL layer and the motion system need. Nothing below should ever
   be re-typed as a literal inside a component.
   ============================================================================= */

/* --- palette -----------------------------------------------------------------
   The environment is lit deep blue; cyan carries signal; violet gives depth.
   Amber is the portfolio's signature and is spent sparingly — it belongs to the
   person, not the machine, so it burns at the centre of the core and nowhere
   else in the world. ------------------------------------------------------- */
export const PALETTE = {
  void:      0x040611,
  deep:      0x070a14,
  panel:     0x0a1020,
  slate:     0x0d1428,

  signal:    0x53d7f2,   // electric cyan   — data in motion
  key:       0x2f6fe0,   // deep blue       — key light
  violet:    0x7b6cf6,   // ultraviolet     — secondary illumination
  magenta:   0xd8548c,   // rare accent
  turquoise: 0x35dfc0,   // rare accent
  amber:     0xf5b841,   // signature       — the core, and only the core
  coral:     0xff7d5e,

  metal:     0x121a2e,   // brushed dark metal
  glassTint: 0x2c5074,   // smoked glass
  ceramic:   0x27334d,
};

/* --- the same world under two lighting conditions ---------------------------
   Dark is a machine hall at night: emitters read as light, additive blending is
   correct, metal is nearly black and lit only by the probe.
   Light is the same hall with the lights on: additive blending would blow out
   to white, so emissive elements switch to normal blending and darken instead
   of brighten. Both are the same geometry — only the physics of the room change. */
export const THEME = {
  dark: {
    fog: 0x040611, fogNear: 14, fogFar: 150,
    signal: 0x53d7f2, second: 0x7b6cf6, tertiary: 0x2f6fe0,
    metal: 0x121a2e, ceramic: 0x27334d, glass: 0x2c5074,
    structure: 0x010208, structureEnv: 0.22, structureLine: 0x53d7f2,
    ambient: 0.30, hemi: 0.30, key: 1.05, fill: 120, rim: 95,
    glassOpacity: 0.13, edgeOpacity: 0.8, gridGain: 0.5,
    additive: true, exposure: 1.06, dustGain: 1.0, bloom: 1.0,
    saturation: 1.18, envIntensity: 1.0,
  },
  light: {
    fog: 0xdcdbd3, fogNear: 20, fogFar: 165,
    signal: 0x0e6f92, second: 0x4c3db4, tertiary: 0x1a4f9e,
    metal: 0x7d879f, ceramic: 0xa9b2c4, glass: 0x53789f,
    structure: 0xcbc9c1, structureEnv: 0.22, structureLine: 0x0e6f92,
    ambient: 0.9, hemi: 0.55, key: 1.5, fill: 45, rim: 34,
    glassOpacity: 0.3, edgeOpacity: 1.2, gridGain: 3.2,
    additive: false, exposure: 0.94, dustGain: 2.4, bloom: 0.22,
    saturation: 1.05, envIntensity: 0.8,
  },
};

/* --- motion language ---------------------------------------------------------
   One vocabulary, four speeds. Everything that moves picks a name from here. */
export const MOTION = {
  micro:  0.20,   // hover, press, cursor state       150–250ms
  ui:     0.40,   // panel, reveal, nav                300–500ms
  env:    1.10,   // environment reconfiguration       800–1500ms
  atmos:  7.00,   // drift, breathing                  seconds
  camera: 2.60,   // camera moves — always the slowest
  /* damping constants (per-second) for the rAF loop */
  damp: { pointer: 3.2, camera: 1.5, focus: 2.4, scroll: 6.0, hover: 9.0 },
  ease: "cubic-bezier(.22,.61,.36,1)",
};

/* --- camera ---------------------------------------------------------------- */
export const CAMERA = {
  fov: 34,
  near: 0.1,
  far: 260,
  home: { x: 0, y: 1.4, z: 20 },
  /* how far the pointer is allowed to push the camera. Small on purpose: the
     visitor is standing in the room, not riding a turntable. */
  parallax: { x: 2.0, y: 1.15 },
  driftAmp: 0.42,
};

/* --- scene density ---------------------------------------------------------
   Performance is part of the portfolio; a systems engineer does not ship 20fps.
   Every count in the scene is derived from one of these three budgets. */
export const DENSITY = {
  high:   { nodes: 132, links: 300, packets: 150, dust: 1500, structures: 26, shellRings: 3, bloom: true, dpr: 2.0 },
  medium: { nodes:  96, links: 210, packets: 100, dust:  900, structures: 18, shellRings: 3, bloom: true, dpr: 1.75 },
  low:    { nodes:  58, links: 120, packets:  46, dust:  420, structures: 10, shellRings: 2, bloom: false, dpr: 1.5 },
};

/* --- world scale ----------------------------------------------------------- */
export const WORLD = {
  coreRadius:   3.0,
  shellRadii:   [5.0, 7.8, 11.2],
  maxLink:      4.2,      // longer than this and the graph reads as a net, not a system
  gridY:       -6.2,
  gridSize:     220,
  fogNear:      14,
  fogFar:       150,
  /* the halls sit well beyond the graph: they are horizon, not scenery */
  structureRing: 128,
  structureSpread: [0.8, 1.4],
};

/* --- how long the system takes to come up on first load -------------------- */
export const BOOT = { fade: 0.35, power: 1.35, network: 1.05, total: 2.0 };
