/* =============================================================================
   ██  NET3D  —  the site's third dimension.
   Hand-written WebGL2. No Three.js, no CDN, no build step, no dependencies —
   because the rest of this site is framework-free and it felt rude to stop now.

   What you're looking at: a 7-layer network mesh (L1 PHY → L7 APP). Scrolling
   flies the camera down through the layers. Packets route along the links.
   Every so often a node takes a flood, hardens, and comes back — which is the
   entire thesis of this portfolio, rendered in about 500 lines of maths.

   Terminal hooks: `net`, `attack`, `harden`.  (type ` to open the shell)
   Degrades to nothing on: no WebGL, reduced-motion, narrow viewports.
   ============================================================================= */
(function () {
"use strict";

var cv = document.getElementById("net3d");
if (!cv) return;

/* ---- bail-outs: respect the user, respect the battery ---- */
if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { cv.style.display = "none"; return; }
if (window.innerWidth < 780) { cv.style.display = "none"; return; }

var gl = null;
try {
  gl = cv.getContext("webgl2", { alpha: true, antialias: true, premultipliedAlpha: false, powerPreference: "low-power" });
} catch (e) { /* ancient browser, moving on */ }
if (!gl) { cv.style.display = "none"; return; }

/* =============================================================================
   TUNING
   ============================================================================= */
var LAYERS      = 7;      // OSI-flavoured depth planes
var PER_LAYER   = 9;      // nodes per plane
var GAP         = 9.0;    // world units between planes
var FOV         = 55 * Math.PI / 180;
var MAX_PACKETS = 340;
var MAX_SHIELDS = 6;
var RING_SEGS   = 44;     // segments per hardening ring
var SHIELD_LIFE = 2.4;    // seconds a hardening ring stays legible

var LAYER_NAMES = ["L1/PHY", "L2/LINK", "L3/NET", "L4/TRANS", "L5/SESS", "L6/PRES", "L7/APP"];

var THREATS = [
  "SYN FLOOD", "PORT SCAN", "BRUTE FORCE", "DNS AMP", "TLS DOWNGRADE",
  "PRIV ESCALATION", "LATERAL MOVE", "CREDENTIAL STUFF", "SUPPLY CHAIN PROBE"
];

/* =============================================================================
   TINY MAT4  (column-major, because that's what GL wants)
   ============================================================================= */
function mPerspective(out, fovy, aspect, near, far) {
  var f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
  out[0] = f / aspect; out[1] = 0; out[2] = 0;              out[3] = 0;
  out[4] = 0;          out[5] = f; out[6] = 0;              out[7] = 0;
  out[8] = 0;          out[9] = 0; out[10] = (far + near) * nf; out[11] = -1;
  out[12] = 0;         out[13] = 0; out[14] = 2 * far * near * nf; out[15] = 0;
  return out;
}
/* view = Rx(pitch) * Ry(yaw) * Translate(-camera) */
function mView(out, yaw, pitch, cx, cy, cz) {
  var cyw = Math.cos(yaw), syw = Math.sin(yaw);
  var cp  = Math.cos(pitch), sp = Math.sin(pitch);
  var m00 = cyw,        m01 = 0,   m02 = syw;
  var m10 = sp * syw,   m11 = cp,  m12 = -sp * cyw;
  var m20 = -cp * syw,  m21 = sp,  m22 = cp * cyw;
  out[0] = m00; out[1] = m10; out[2] = m20; out[3] = 0;
  out[4] = m01; out[5] = m11; out[6] = m21; out[7] = 0;
  out[8] = m02; out[9] = m12; out[10] = m22; out[11] = 0;
  out[12] = -(m00 * cx + m01 * cy + m02 * cz);
  out[13] = -(m10 * cx + m11 * cy + m12 * cz);
  out[14] = -(m20 * cx + m21 * cy + m22 * cz);
  out[15] = 1;
  return out;
}

/* =============================================================================
   SHADERS
   ============================================================================= */
var VS_POINT = `#version 300 es
precision highp float;
in vec3  aPos;
in float aSize;    // world-space radius
in float aKind;    // 0 node · 1 packet · 2 hostile · 3 node-under-attack
in float aAlpha;
uniform mat4  uProj, uView;
uniform float uK;        // (viewportHeight/2) / tan(fov/2)
uniform float uMaxPS;
uniform vec2  uCursor;   // cursor in NDC
out float vKind, vFade, vHi, vAlpha;
void main(){
  vec4 vp = uView * vec4(aPos, 1.0);
  gl_Position = uProj * vp;
  float d = max(-vp.z, 0.001);
  gl_PointSize = clamp(aSize * uK / d, 1.0, uMaxPS);
  // fog at the far end, and a soft dissolve as geometry passes the camera
  vFade  = smoothstep(120.0, 22.0, d) * smoothstep(0.8, 7.0, d);
  vAlpha = aAlpha;
  vec2 ndc = gl_Position.xy / max(gl_Position.w, 0.0001);
  vHi = 1.0 - smoothstep(0.0, 0.30, distance(ndc, uCursor));
  vKind = aKind;
}`;

var FS_POINT = `#version 300 es
precision highp float;
in float vKind, vFade, vHi, vAlpha;
uniform vec3 uAccent, uText, uAlert;
uniform float uOpacity;
out vec4 outColor;
void main(){
  vec2 c = gl_PointCoord * 2.0 - 1.0;
  float r = length(c);
  if (r > 1.0) discard;
  float a; vec3 col;
  if (vKind < 0.5) {                       // node — ring + core, brightens near cursor
    float ring = smoothstep(0.74, 0.62, r) * smoothstep(0.42, 0.54, r);
    float core = smoothstep(0.28, 0.0, r);
    float halo = smoothstep(1.0, 0.5, r) * 0.16 * vHi;
    a   = ring * 0.95 + core * (0.55 + vHi * 0.45) + halo;
    col = mix(uText, uAccent, 0.30 + vHi * 0.70);
  } else if (vKind < 1.5) {                // packet in flight
    a = smoothstep(1.0, 0.0, r); a *= a;
    col = uAccent;
  } else if (vKind < 2.5) {                // hostile packet
    a = smoothstep(1.0, 0.0, r); a *= a * 1.15;
    col = uAlert;
  } else {                                 // node currently under attack
    float ring = smoothstep(0.80, 0.60, r) * smoothstep(0.38, 0.56, r);
    float core = smoothstep(0.34, 0.0, r);
    a = ring + core * 0.9;
    col = uAlert;
  }
  outColor = vec4(col, a * vFade * vAlpha * uOpacity);
}`;

var VS_LINE = `#version 300 es
precision highp float;
in vec3  aPos;
in float aAlpha;
in float aTint;   // 0 link · 1 hardening ring
uniform mat4 uProj, uView;
out float vA, vTint;
void main(){
  vec4 vp = uView * vec4(aPos, 1.0);
  gl_Position = uProj * vp;
  float d = max(-vp.z, 0.001);
  vA = aAlpha * smoothstep(130.0, 18.0, d) * smoothstep(0.8, 8.0, d);
  vTint = aTint;
}`;

var FS_LINE = `#version 300 es
precision highp float;
in float vA, vTint;
uniform vec3 uAccent, uText, uAlert;
uniform float uOpacity;
out vec4 outColor;
void main(){
  vec3 col = mix(mix(uText, uAccent, 0.35), uAlert, vTint);
  outColor = vec4(col, vA * uOpacity);
}`;

/* =============================================================================
   GL PLUMBING
   ============================================================================= */
function compile(type, src) {
  var s = gl.createShader(type);
  gl.shaderSource(s, src); gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.warn("[net3d] shader:", gl.getShaderInfoLog(s));
    gl.deleteShader(s); return null;
  }
  return s;
}
function program(vsSrc, fsSrc) {
  var vs = compile(gl.VERTEX_SHADER, vsSrc), fs = compile(gl.FRAGMENT_SHADER, fsSrc);
  if (!vs || !fs) return null;
  var p = gl.createProgram();
  gl.attachShader(p, vs); gl.attachShader(p, fs); gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    console.warn("[net3d] link:", gl.getProgramInfoLog(p)); return null;
  }
  gl.deleteShader(vs); gl.deleteShader(fs);
  return p;
}

var pgPoint = program(VS_POINT, FS_POINT);
var pgLine  = program(VS_LINE,  FS_LINE);
if (!pgPoint || !pgLine) { cv.style.display = "none"; return; }

function locs(p, names) { var o = {}; for (var i = 0; i < names.length; i++) o[names[i]] = gl.getUniformLocation(p, names[i]); return o; }
var uP = locs(pgPoint, ["uProj", "uView", "uK", "uMaxPS", "uCursor", "uAccent", "uText", "uAlert", "uOpacity"]);
var uL = locs(pgLine,  ["uProj", "uView", "uAccent", "uText", "uAlert", "uOpacity"]);

var aP = {
  pos:   gl.getAttribLocation(pgPoint, "aPos"),
  size:  gl.getAttribLocation(pgPoint, "aSize"),
  kind:  gl.getAttribLocation(pgPoint, "aKind"),
  alpha: gl.getAttribLocation(pgPoint, "aAlpha")
};
var aL = {
  pos:   gl.getAttribLocation(pgLine, "aPos"),
  alpha: gl.getAttribLocation(pgLine, "aAlpha"),
  tint:  gl.getAttribLocation(pgLine, "aTint")
};

var maxPS = 64;
try { var r = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE); if (r && r[1]) maxPS = Math.min(r[1], 300); } catch (e) {}

/* =============================================================================
   THE MESH  —  nodes, links, and the traffic on them
   ============================================================================= */
function rnd(a, b) { return a + Math.random() * (b - a); }

var nodes = [];   // {bx,by,bz, x,y,z, layer, seed, atk}
var links = [];   // [aIdx, bIdx, alphaBase]
var byLayer = []; // layer -> [idx]

(function buildMesh() {
  for (var L = 0; L < LAYERS; L++) {
    byLayer[L] = [];
    for (var k = 0; k < PER_LAYER; k++) {
      var ang = (k / PER_LAYER) * Math.PI * 2 + L * 0.62;
      var rad = 5.6 + (k % 3) * 2.4 + rnd(-0.9, 0.9);
      byLayer[L].push(nodes.length);
      nodes.push({
        bx: Math.cos(ang) * rad, by: Math.sin(ang) * rad * 0.72, bz: -L * GAP + rnd(-1.2, 1.2),
        x: 0, y: 0, z: 0, layer: L, seed: Math.random() * 6.283, atk: 0
      });
    }
  }
  // vertical links: each node reaches into the next plane (that's the routing path)
  for (var Ly = 0; Ly < LAYERS - 1; Ly++) {
    var cur = byLayer[Ly], nxt = byLayer[Ly + 1];
    for (var i = 0; i < cur.length; i++) {
      var fanout = Math.random() < 0.35 ? 2 : 1;
      for (var f = 0; f < fanout; f++) {
        links.push([cur[i], nxt[(i + f + (Math.random() < 0.4 ? 1 : 0)) % nxt.length], rnd(0.28, 0.55)]);
      }
    }
  }
  // intra-plane ring links: the redundancy that stops one dead node killing a layer
  for (var Lr = 0; Lr < LAYERS; Lr++) {
    var ring = byLayer[Lr];
    for (var j = 0; j < ring.length; j++) {
      if (Math.random() < 0.55) links.push([ring[j], ring[(j + 1) % ring.length], rnd(0.16, 0.32)]);
    }
  }
})();

var packets = [];   // {a,b,t,spd,kind}
var shields = [];   // {n,t}

function spawnPacket() {
  if (packets.length >= MAX_PACKETS || !links.length) return;
  var e = links[(Math.random() * links.length) | 0];
  packets.push({ a: e[0], b: e[1], t: 0, spd: rnd(0.22, 0.62), kind: 1 });
}

/* --- the signature move: node gets flooded, hardens, survives --- */
var attack = null;   // {node, t, phase, threat}
function launchAttack(forced) {
  if (attack) return false;
  var visible = [];
  for (var i = 0; i < nodes.length; i++) {
    var d = camZ - nodes[i].bz;
    if (d > 4 && d < 60) visible.push(i);
  }
  var target = visible.length ? visible[(Math.random() * visible.length) | 0] : (Math.random() * nodes.length) | 0;
  attack = { node: target, t: 0, phase: 0, threat: THREATS[(Math.random() * THREATS.length) | 0], forced: !!forced };
  for (var k = 0; k < 34; k++) {
    var src = (Math.random() * nodes.length) | 0;
    if (src === target) continue;
    packets.push({ a: src, b: target, t: -Math.random() * 0.55, spd: rnd(0.75, 1.5), kind: 2 });
  }
  return true;
}
function harden(idx) {
  if (shields.length >= MAX_SHIELDS) shields.shift();
  shields.push({ n: idx, t: 0 });
}

/* =============================================================================
   BUFFERS
   ============================================================================= */
var PT_STRIDE = 6;  // x,y,z,size,kind,alpha
var LN_STRIDE = 5;  // x,y,z,alpha,tint
/* headroom: an attack injects a burst on top of the normal packet cap */
var ptData = new Float32Array((nodes.length + MAX_PACKETS + 80) * PT_STRIDE);
var lnData = new Float32Array((links.length * 2 + MAX_SHIELDS * RING_SEGS * 2) * LN_STRIDE);
var ptBuf  = gl.createBuffer();
var lnBuf  = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, ptBuf); gl.bufferData(gl.ARRAY_BUFFER, ptData.byteLength, gl.DYNAMIC_DRAW);
gl.bindBuffer(gl.ARRAY_BUFFER, lnBuf); gl.bufferData(gl.ARRAY_BUFFER, lnData.byteLength, gl.DYNAMIC_DRAW);

/* =============================================================================
   CAMERA + INPUT
   ============================================================================= */
var scrollT = 0, scrollTarget = 0;
var curX = 0, curY = 0, curTX = 0, curTY = 0;   // cursor in NDC, smoothed
var camZ = 10, camX = 0, camY = 0;
var DEPTH = (LAYERS - 1) * GAP;

function readScroll() {
  var h = document.documentElement.scrollHeight - window.innerHeight;
  scrollTarget = h > 0 ? Math.min(Math.max(window.scrollY / h, 0), 1) : 0;
}
window.addEventListener("scroll", readScroll, { passive: true });
window.addEventListener("mousemove", function (e) {
  curTX = (e.clientX / window.innerWidth) * 2 - 1;
  curTY = -((e.clientY / window.innerHeight) * 2 - 1);
}, { passive: true });
readScroll();

/* resize on demand only — reading clientWidth every frame forces a reflow */
var dpr = 1, W = 1, H = 1, needResize = true;
function resize() {
  if (!needResize) return;
  needResize = false;
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = Math.max(1, Math.round(cv.clientWidth * dpr));
  H = Math.max(1, Math.round(cv.clientHeight * dpr));
  if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
  gl.viewport(0, 0, W, H);
}
window.addEventListener("resize", function () { needResize = true; readScroll(); }, { passive: true });

/* =============================================================================
   THEME  —  colours track the CSS tokens, additive glow only in the dark
   ============================================================================= */
var COL = { accent: [0.96, 0.72, 0.25], text: [0.90, 0.89, 0.87], alert: [1.0, 0.30, 0.30], opacity: 0.95, additive: true };
function syncTheme() {
  var light = document.documentElement.getAttribute("data-theme") === "light";
  if (light) {
    COL.accent = [0.66, 0.42, 0.0]; COL.text = [0.09, 0.09, 0.11]; COL.alert = [0.70, 0.15, 0.12];
    COL.opacity = 0.55; COL.additive = false;
  } else {
    COL.accent = [0.96, 0.72, 0.25]; COL.text = [0.90, 0.89, 0.87]; COL.alert = [1.0, 0.30, 0.30];
    COL.opacity = 0.95; COL.additive = true;
  }
}
syncTheme();
new MutationObserver(syncTheme).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

/* =============================================================================
   HUD
   ============================================================================= */
var hudLayer = document.getElementById("netLayer");
var hudState = document.getElementById("netState");
var stateHold = 0;
function setState(txt, hold) {
  if (hudState) hudState.textContent = txt;
  stateHold = hold || 0;
  if (hudState) hudState.classList.toggle("alert", /FLOOD|SCAN|FORCE|AMP|DOWNGRADE|ESCALATION|MOVE|STUFF|PROBE|UNDER/.test(txt));
}

/* =============================================================================
   RENDER LOOP
   ============================================================================= */
var proj = new Float32Array(16), view = new Float32Array(16);
var running = true, enabled = true, last = performance.now(), acc = 0, nextAttack = rnd(9, 16);

function frame(now) {
  if (!running) return;
  requestAnimationFrame(frame);
  var dt = Math.min((now - last) / 1000, 0.05); last = now;
  if (!enabled) return;

  resize();
  syncCamera(dt);
  simulate(dt);
  draw();
}

function syncCamera(dt) {
  scrollT += (scrollTarget - scrollT) * Math.min(dt * 4.0, 1);
  curX += (curTX - curX) * Math.min(dt * 3.2, 1);
  curY += (curTY - curY) * Math.min(dt * 3.2, 1);
  camZ = 10 - scrollT * (DEPTH - 4);
  camX = curX * 2.6;
  camY = curY * 1.8;
  var L = Math.min(LAYERS - 1, Math.max(0, Math.round((10 - camZ) / GAP)));
  if (hudLayer && hudLayer.textContent !== LAYER_NAMES[L]) hudLayer.textContent = LAYER_NAMES[L];
}

function simulate(dt) {
  var t = last / 1000;

  // node drift — slow, so the mesh breathes instead of sitting there
  for (var i = 0; i < nodes.length; i++) {
    var n = nodes[i];
    n.x = n.bx + Math.sin(t * 0.30 + n.seed) * 0.42;
    n.y = n.by + Math.cos(t * 0.24 + n.seed * 1.7) * 0.42;
    n.z = n.bz + Math.sin(t * 0.18 + n.seed * 0.9) * 0.30;
    if (n.atk > 0) n.atk -= dt;
  }

  // normal traffic
  acc += dt;
  var want = 1 / 24;
  while (acc > want) { acc -= want; spawnPacket(); }

  for (var p = packets.length - 1; p >= 0; p--) {
    var pk = packets[p];
    pk.t += pk.spd * dt;
    if (pk.t > 1) {
      if (pk.kind === 2 && attack && pk.b === attack.node) nodes[pk.b].atk = 0.35;
      packets.splice(p, 1);
    }
  }

  // shields expand and fade
  for (var s = shields.length - 1; s >= 0; s--) {
    shields[s].t += dt;
    if (shields[s].t > SHIELD_LIFE) shields.splice(s, 1);
  }

  // attack state machine: flood → impact → harden → nominal
  if (attack) {
    attack.t += dt;
    if (attack.phase === 0) {
      setState("⚠ " + attack.threat + " @ NODE-" + String(attack.node).padStart(2, "0"), 99);
      attack.phase = 1;
    } else if (attack.phase === 1 && attack.t > 1.35) {
      nodes[attack.node].atk = 0.6;
      harden(attack.node);
      // neighbours harden too — that's what a baseline is for
      for (var e = 0; e < links.length; e++) {
        if (links[e][0] === attack.node || links[e][1] === attack.node) {
          if (Math.random() < 0.35) harden(links[e][0] === attack.node ? links[e][1] : links[e][0]);
        }
      }
      for (var q = packets.length - 1; q >= 0; q--) if (packets[q].kind === 2) packets.splice(q, 1);
      setState("HARDENED — NODE-" + String(attack.node).padStart(2, "0") + " HOLDING", 3.2);
      attack.phase = 2;
    } else if (attack.phase === 2 && attack.t > 4.4) {
      attack = null;
      setState("NOMINAL", 0);
      nextAttack = rnd(14, 26);
    }
  } else {
    nextAttack -= dt;
    if (nextAttack <= 0) launchAttack(false);
    if (stateHold > 0) { stateHold -= dt; if (stateHold <= 0) setState("NOMINAL", 0); }
  }
}

function draw() {
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, COL.additive ? gl.ONE : gl.ONE_MINUS_SRC_ALPHA);

  mPerspective(proj, FOV, W / H, 0.1, 220);
  mView(view, curX * 0.075, curY * 0.055, camX, camY, camZ);
  var K = (H / 2) / Math.tan(FOV / 2);

  /* ---- lines: links + hardening rings ---- */
  var li = 0;
  function ln(x, y, z, a, tint) {
    lnData[li++] = x; lnData[li++] = y; lnData[li++] = z; lnData[li++] = a; lnData[li++] = tint;
  }
  for (var e = 0; e < links.length; e++) {
    var A = nodes[links[e][0]], B = nodes[links[e][1]];
    var a = links[e][2] * (A.atk > 0 || B.atk > 0 ? 3.2 : 1);
    var tint = (A.atk > 0 || B.atk > 0) ? 1 : 0;
    ln(A.x, A.y, A.z, a, tint);
    ln(B.x, B.y, B.z, a, tint);
  }
  for (var s = 0; s < shields.length; s++) {
    var sh = shields[s], nd = nodes[sh.n];
    var prog = sh.t / SHIELD_LIFE;
    var rad = 0.6 + prog * 5.4;
    var alp = (1 - prog) * 1.5;
    for (var g = 0; g < RING_SEGS; g++) {
      var a0 = (g / RING_SEGS) * Math.PI * 2, a1 = ((g + 1) / RING_SEGS) * Math.PI * 2;
      ln(nd.x + Math.cos(a0) * rad, nd.y + Math.sin(a0) * rad, nd.z, alp, 0.55);
      ln(nd.x + Math.cos(a1) * rad, nd.y + Math.sin(a1) * rad, nd.z, alp, 0.55);
    }
  }
  gl.useProgram(pgLine);
  gl.uniformMatrix4fv(uL.uProj, false, proj);
  gl.uniformMatrix4fv(uL.uView, false, view);
  gl.uniform3fv(uL.uAccent, COL.accent); gl.uniform3fv(uL.uText, COL.text); gl.uniform3fv(uL.uAlert, COL.alert);
  gl.uniform1f(uL.uOpacity, COL.opacity);
  gl.bindBuffer(gl.ARRAY_BUFFER, lnBuf);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, lnData, 0, li);
  var lsb = LN_STRIDE * 4;
  gl.enableVertexAttribArray(aL.pos);   gl.vertexAttribPointer(aL.pos,   3, gl.FLOAT, false, lsb, 0);
  gl.enableVertexAttribArray(aL.alpha); gl.vertexAttribPointer(aL.alpha, 1, gl.FLOAT, false, lsb, 12);
  gl.enableVertexAttribArray(aL.tint);  gl.vertexAttribPointer(aL.tint,  1, gl.FLOAT, false, lsb, 16);
  gl.drawArrays(gl.LINES, 0, li / LN_STRIDE);

  /* ---- points: nodes + packets ---- */
  var pi = 0;
  function pt(x, y, z, size, kind, alpha) {
    ptData[pi++] = x; ptData[pi++] = y; ptData[pi++] = z;
    ptData[pi++] = size; ptData[pi++] = kind; ptData[pi++] = alpha;
  }
  for (var i = 0; i < nodes.length; i++) {
    var n = nodes[i];
    pt(n.x, n.y, n.z, n.atk > 0 ? 0.78 : 0.56, n.atk > 0 ? 3 : 0, 1);
  }
  for (var p = 0; p < packets.length; p++) {
    var pk = packets[p];
    if (pk.t < 0) continue;
    var A2 = nodes[pk.a], B2 = nodes[pk.b], tt = pk.t;
    var fade = Math.min(1, Math.sin(tt * Math.PI) * 2.2);
    pt(A2.x + (B2.x - A2.x) * tt, A2.y + (B2.y - A2.y) * tt, A2.z + (B2.z - A2.z) * tt,
       pk.kind === 2 ? 0.24 : 0.19, pk.kind, fade);
  }
  gl.useProgram(pgPoint);
  gl.uniformMatrix4fv(uP.uProj, false, proj);
  gl.uniformMatrix4fv(uP.uView, false, view);
  gl.uniform1f(uP.uK, K);
  gl.uniform1f(uP.uMaxPS, maxPS);
  gl.uniform2f(uP.uCursor, curX, curY);
  gl.uniform3fv(uP.uAccent, COL.accent); gl.uniform3fv(uP.uText, COL.text); gl.uniform3fv(uP.uAlert, COL.alert);
  gl.uniform1f(uP.uOpacity, COL.opacity);
  gl.bindBuffer(gl.ARRAY_BUFFER, ptBuf);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, ptData, 0, pi);
  var psb = PT_STRIDE * 4;
  gl.enableVertexAttribArray(aP.pos);   gl.vertexAttribPointer(aP.pos,   3, gl.FLOAT, false, psb, 0);
  gl.enableVertexAttribArray(aP.size);  gl.vertexAttribPointer(aP.size,  1, gl.FLOAT, false, psb, 12);
  gl.enableVertexAttribArray(aP.kind);  gl.vertexAttribPointer(aP.kind,  1, gl.FLOAT, false, psb, 16);
  gl.enableVertexAttribArray(aP.alpha); gl.vertexAttribPointer(aP.alpha, 1, gl.FLOAT, false, psb, 20);
  gl.drawArrays(gl.POINTS, 0, pi / PT_STRIDE);
}

/* pause when the tab is hidden — no point burning a GPU nobody is looking at */
document.addEventListener("visibilitychange", function () {
  enabled = !document.hidden;
  last = performance.now();
});
cv.addEventListener("webglcontextlost", function (e) { e.preventDefault(); running = false; }, false);
cv.addEventListener("webglcontextrestored", function () { location.reload(); }, false);

resize();
setState("NOMINAL", 0);
requestAnimationFrame(frame);

/* =============================================================================
   PUBLIC API  —  wired into the terminal in app.js
   ============================================================================= */
window.NET3D = {
  attack: function () { return launchAttack(true); },
  harden: function () {
    for (var i = 0; i < 5; i++) harden((Math.random() * nodes.length) | 0);
    setState("BASELINE APPLIED — " + nodes.length + " NODES", 3.0);
    return true;
  },
  toggle: function (on) {
    enabled = (typeof on === "boolean") ? on : !enabled;
    cv.style.opacity = enabled ? "" : "0";
    if (enabled) { last = performance.now(); }
    return enabled;
  },
  stats: function () {
    return { nodes: nodes.length, links: links.length, layers: LAYERS,
             packets: packets.length, layer: LAYER_NAMES[Math.min(LAYERS - 1, Math.max(0, Math.round((10 - camZ) / GAP)))],
             depth: (scrollT * 100).toFixed(1) + "%", renderer: "WebGL2 (hand-rolled)" };
  }
};

})();
