/* =============================================================================
   ██  NET3D  —  the site's third dimension.
   Hand-written WebGL2. No Three.js, no CDN, no build step, no dependencies —
   because the rest of this site is framework-free and it felt rude to stop now.

   One small core (GL plumbing, mat4, a line/point batcher, camera, theme) and
   four scenes. A page picks its scene with  <body data-scene="...">  :

     mesh      home        7-layer network. packets route. a node gets flooded,
                           hardens, and holds. the thesis, rendered.
     cluster   /work       pods scheduling onto nodes. rolling deploys. a node
                           goes NotReady and its pods reschedule elsewhere.
     rack      /stack      three racks, 40U each. drive LEDs, fans, thermal
                           gradient. a disk fails and rebuilds.
     pipeline  /experience commit → build → test → scan → package → deploy.
                           artifacts flow. some builds fail and roll back.

   Terminal hooks (type ` anywhere):  net · attack · harden · kubectl · rack · build
   Degrades to nothing on: no WebGL2, reduced-motion, narrow viewport, hidden tab.
   ============================================================================= */
(function () {
"use strict";

var cv = document.getElementById("net3d");
if (!cv) return;
if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { cv.style.display = "none"; return; }
if (window.innerWidth < 780) { cv.style.display = "none"; return; }

var gl = null;
try {
  gl = cv.getContext("webgl2", { alpha: true, antialias: true, premultipliedAlpha: false, powerPreference: "low-power" });
} catch (e) { /* ancient browser, moving on */ }
if (!gl) { cv.style.display = "none"; return; }

var FOV = 55 * Math.PI / 180;
var MAX_LINE_VERTS = 14000;
var MAX_POINTS     = 2400;

/* =============================================================================
   TINY MAT4  (column-major, because that's what GL wants)
   ============================================================================= */
function mPerspective(out, fovy, aspect, near, far) {
  var f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
  out[0] = f / aspect; out[1] = 0; out[2] = 0; out[3] = 0;
  out[4] = 0; out[5] = f; out[6] = 0; out[7] = 0;
  out[8] = 0; out[9] = 0; out[10] = (far + near) * nf; out[11] = -1;
  out[12] = 0; out[13] = 0; out[14] = 2 * far * near * nf; out[15] = 0;
  return out;
}
/* view = Rx(pitch) * Ry(yaw) * Translate(-camera) */
function mView(out, yaw, pitch, cx, cy, cz) {
  var cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  var m00 = cyw,       m01 = 0,  m02 = syw;
  var m10 = sp * syw,  m11 = cp, m12 = -sp * cyw;
  var m20 = -cp * syw, m21 = sp, m22 = cp * cyw;
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
in float aSize;   // world-space radius
in float aKind;
in float aAlpha;
uniform mat4  uProj, uView;
uniform float uK;       // (viewportHeight/2) / tan(fov/2)
uniform float uMaxPS;
uniform vec2  uCursor;
out float vKind, vFade, vHi, vAlpha;
void main(){
  vec4 vp = uView * vec4(aPos, 1.0);
  gl_Position = uProj * vp;
  float d = max(-vp.z, 0.001);
  gl_PointSize = clamp(aSize * uK / d, 1.0, uMaxPS);
  vFade  = smoothstep(150.0, 26.0, d) * smoothstep(0.8, 7.0, d);
  vAlpha = aAlpha;
  vec2 ndc = gl_Position.xy / max(gl_Position.w, 0.0001);
  vHi = 1.0 - smoothstep(0.0, 0.30, distance(ndc, uCursor));
  vKind = aKind;
}`;

/* kinds — 0 ring · 1 dot accent · 2 dot alert · 3 ring alert
           4 dot ok · 5 dot muted · 6 square accent · 7 square dim  */
var FS_POINT = `#version 300 es
precision highp float;
in float vKind, vFade, vHi, vAlpha;
uniform vec3 uAccent, uText, uAlert, uOk;
uniform float uOpacity;
out vec4 outColor;
void main(){
  vec2 c = gl_PointCoord * 2.0 - 1.0;
  float r = length(c);
  float k = vKind;
  float a; vec3 col;
  float sq = max(abs(c.x), abs(c.y));
  float dot_ = smoothstep(1.0, 0.0, r); dot_ *= dot_;
  float ring = smoothstep(0.76, 0.62, r) * smoothstep(0.42, 0.54, r);
  float core = smoothstep(0.28, 0.0, r);
  if (k < 0.5)        { if (r > 1.0) discard; a = ring * 0.95 + core * (0.55 + vHi * 0.45) + smoothstep(1.0,0.5,r)*0.16*vHi; col = mix(uText, uAccent, 0.30 + vHi * 0.70); }
  else if (k < 1.5)   { if (r > 1.0) discard; a = dot_;        col = uAccent; }
  else if (k < 2.5)   { if (r > 1.0) discard; a = dot_ * 1.15; col = uAlert; }
  else if (k < 3.5)   { if (r > 1.0) discard; a = smoothstep(0.80,0.60,r)*smoothstep(0.38,0.56,r) + core*0.9; col = uAlert; }
  else if (k < 4.5)   { if (r > 1.0) discard; a = dot_;        col = uOk; }
  else if (k < 5.5)   { if (r > 1.0) discard; a = dot_ * 0.8;  col = uText; }
  else if (k < 6.5)   { a = smoothstep(1.0, 0.72, sq);        col = uAccent; }
  else                { a = smoothstep(1.0, 0.72, sq) * 0.7;  col = mix(uText, uAccent, 0.25); }
  outColor = vec4(col, a * vFade * vAlpha * uOpacity);
}`;

var VS_LINE = `#version 300 es
precision highp float;
in vec3  aPos;
in float aAlpha;
in float aTint;
uniform mat4 uProj, uView;
out float vA, vTint;
void main(){
  vec4 vp = uView * vec4(aPos, 1.0);
  gl_Position = uProj * vp;
  float d = max(-vp.z, 0.001);
  vA = aAlpha * smoothstep(165.0, 20.0, d) * smoothstep(0.8, 8.0, d);
  vTint = aTint;
}`;

/* tint — 0 link · 1 alert · 2 ok · 3 accent */
var FS_LINE = `#version 300 es
precision highp float;
in float vA, vTint;
uniform vec3 uAccent, uText, uAlert, uOk;
uniform float uOpacity;
out vec4 outColor;
void main(){
  vec3 c0 = mix(uText, uAccent, 0.35);
  vec3 col = vTint < 1.0 ? mix(c0, uAlert, vTint)
           : vTint < 2.0 ? mix(uAlert, uOk, vTint - 1.0)
                         : mix(uOk, uAccent, clamp(vTint - 2.0, 0.0, 1.0));
  outColor = vec4(col, vA * uOpacity);
}`;

function compile(type, src) {
  var s = gl.createShader(type);
  gl.shaderSource(s, src); gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn("[net3d] shader:", gl.getShaderInfoLog(s)); return null; }
  return s;
}
function program(vsSrc, fsSrc) {
  var vs = compile(gl.VERTEX_SHADER, vsSrc), fs = compile(gl.FRAGMENT_SHADER, fsSrc);
  if (!vs || !fs) return null;
  var p = gl.createProgram();
  gl.attachShader(p, vs); gl.attachShader(p, fs); gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { console.warn("[net3d] link:", gl.getProgramInfoLog(p)); return null; }
  gl.deleteShader(vs); gl.deleteShader(fs);
  return p;
}
var pgPoint = program(VS_POINT, FS_POINT), pgLine = program(VS_LINE, FS_LINE);
if (!pgPoint || !pgLine) { cv.style.display = "none"; return; }

function locs(p, names) { var o = {}; for (var i = 0; i < names.length; i++) o[names[i]] = gl.getUniformLocation(p, names[i]); return o; }
var uP = locs(pgPoint, ["uProj","uView","uK","uMaxPS","uCursor","uAccent","uText","uAlert","uOk","uOpacity"]);
var uL = locs(pgLine,  ["uProj","uView","uAccent","uText","uAlert","uOk","uOpacity"]);
var aP = { pos: gl.getAttribLocation(pgPoint,"aPos"), size: gl.getAttribLocation(pgPoint,"aSize"),
           kind: gl.getAttribLocation(pgPoint,"aKind"), alpha: gl.getAttribLocation(pgPoint,"aAlpha") };
var aL = { pos: gl.getAttribLocation(pgLine,"aPos"), alpha: gl.getAttribLocation(pgLine,"aAlpha"),
           tint: gl.getAttribLocation(pgLine,"aTint") };

var maxPS = 64;
try { var rg = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE); if (rg && rg[1]) maxPS = Math.min(rg[1], 300); } catch (e) {}

/* =============================================================================
   BATCHER  —  scenes only ever call these. Both arrays flush once per frame.
   Writes past capacity are dropped rather than corrupting the GL buffer.
   ============================================================================= */
var PT_STRIDE = 6, LN_STRIDE = 5;
var ptData = new Float32Array(MAX_POINTS * PT_STRIDE);
var lnData = new Float32Array(MAX_LINE_VERTS * LN_STRIDE);
var ptBuf = gl.createBuffer(), lnBuf = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, ptBuf); gl.bufferData(gl.ARRAY_BUFFER, ptData.byteLength, gl.DYNAMIC_DRAW);
gl.bindBuffer(gl.ARRAY_BUFFER, lnBuf); gl.bufferData(gl.ARRAY_BUFFER, lnData.byteLength, gl.DYNAMIC_DRAW);
var pi = 0, li = 0;

var B = {
  point: function (x, y, z, size, kind, alpha) {
    if (pi + PT_STRIDE > ptData.length) return;
    ptData[pi++] = x; ptData[pi++] = y; ptData[pi++] = z;
    ptData[pi++] = size; ptData[pi++] = kind; ptData[pi++] = alpha;
  },
  line: function (x1, y1, z1, x2, y2, z2, alpha, tint) {
    if (li + LN_STRIDE * 2 > lnData.length) return;
    lnData[li++] = x1; lnData[li++] = y1; lnData[li++] = z1; lnData[li++] = alpha; lnData[li++] = tint || 0;
    lnData[li++] = x2; lnData[li++] = y2; lnData[li++] = z2; lnData[li++] = alpha; lnData[li++] = tint || 0;
  },
  /* axis-aligned wireframe box, centred */
  box: function (cx, cy, cz, w, h, d, alpha, tint) {
    var x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2, z0 = cz - d / 2, z1 = cz + d / 2;
    B.line(x0,y0,z1, x1,y0,z1, alpha, tint); B.line(x1,y0,z1, x1,y1,z1, alpha, tint);
    B.line(x1,y1,z1, x0,y1,z1, alpha, tint); B.line(x0,y1,z1, x0,y0,z1, alpha, tint);
    B.line(x0,y0,z0, x1,y0,z0, alpha, tint); B.line(x1,y0,z0, x1,y1,z0, alpha, tint);
    B.line(x1,y1,z0, x0,y1,z0, alpha, tint); B.line(x0,y1,z0, x0,y0,z0, alpha, tint);
    B.line(x0,y0,z0, x0,y0,z1, alpha, tint); B.line(x1,y0,z0, x1,y0,z1, alpha, tint);
    B.line(x1,y1,z0, x1,y1,z1, alpha, tint); B.line(x0,y1,z0, x0,y1,z1, alpha, tint);
  },
  /* open rectangle on the XY plane (the front face of a chassis, a gate, …) */
  rect: function (cx, cy, cz, w, h, alpha, tint) {
    var x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2;
    B.line(x0,y0,cz, x1,y0,cz, alpha, tint); B.line(x1,y0,cz, x1,y1,cz, alpha, tint);
    B.line(x1,y1,cz, x0,y1,cz, alpha, tint); B.line(x0,y1,cz, x0,y0,cz, alpha, tint);
  },
  /* circle on the XY plane */
  ring: function (cx, cy, cz, rad, segs, alpha, tint) {
    for (var g = 0; g < segs; g++) {
      var a0 = g / segs * Math.PI * 2, a1 = (g + 1) / segs * Math.PI * 2;
      B.line(cx + Math.cos(a0) * rad, cy + Math.sin(a0) * rad, cz,
             cx + Math.cos(a1) * rad, cy + Math.sin(a1) * rad, cz, alpha, tint);
    }
  },
  /* flat quad on the XZ plane — platforms, floors */
  plate: function (cx, cy, cz, w, d, alpha, tint) {
    var x0 = cx - w / 2, x1 = cx + w / 2, z0 = cz - d / 2, z1 = cz + d / 2;
    B.line(x0,cy,z0, x1,cy,z0, alpha, tint); B.line(x1,cy,z0, x1,cy,z1, alpha, tint);
    B.line(x1,cy,z1, x0,cy,z1, alpha, tint); B.line(x0,cy,z1, x0,cy,z0, alpha, tint);
  }
};

/* =============================================================================
   THEME  —  colours track the CSS tokens; additive glow only in the dark
   ============================================================================= */
var COL = {};
function syncTheme() {
  var light = document.documentElement.getAttribute("data-theme") === "light";
  if (light) {
    COL.accent = [0.66,0.42,0.0]; COL.text = [0.09,0.09,0.11];
    COL.alert  = [0.70,0.15,0.12]; COL.ok = [0.11,0.42,0.20];
    COL.opacity = 0.55; COL.additive = false;
  } else {
    COL.accent = [0.96,0.72,0.25]; COL.text = [0.90,0.89,0.87];
    COL.alert  = [1.0,0.30,0.30];  COL.ok = [0.36,0.86,0.52];
    COL.opacity = 0.95; COL.additive = true;
  }
}
syncTheme();
new MutationObserver(syncTheme).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

/* =============================================================================
   INPUT + HUD
   ============================================================================= */
var scrollT = 0, scrollTarget = 0, curX = 0, curY = 0, curTX = 0, curTY = 0;
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

var hudA = document.getElementById("netLayer"), hudB = document.getElementById("netState");
var stateHold = 0;
function hud(a, b, isAlert, hold) {
  if (hudA && a != null && hudA.textContent !== a) hudA.textContent = a;
  if (hudB && b != null && hudB.textContent !== b) hudB.textContent = b;
  if (hudB) hudB.classList.toggle("alert", !!isAlert);
  if (hold != null) stateHold = hold;
}

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

/* shared context handed to every scene */
var ctx = {
  t: 0, dt: 0, scroll: 0, cursor: { x: 0, y: 0 },
  cam: { x: 0, y: 0, z: 10, yaw: 0, pitch: 0 },
  hud: hud, rnd: function (a, b) { return a + Math.random() * (b - a); },
  pad2: function (n) { return String(n).padStart(2, "0"); }
};

/* =============================================================================
   SCENE 1 — MESH  (home)
   A 7-layer network. Traffic routes between planes. Periodically a node takes
   a flood, hardens, and holds. Scrolling flies down through the layers.
   ============================================================================= */
var SCENES = {};

SCENES.mesh = function () {
  var LAYERS = 7, PER_LAYER = 9, GAP = 9.0, MAX_PACKETS = 340, SHIELD_LIFE = 2.4;
  var NAMES = ["L1/PHY","L2/LINK","L3/NET","L4/TRANS","L5/SESS","L6/PRES","L7/APP"];
  var THREATS = ["SYN FLOOD","PORT SCAN","BRUTE FORCE","DNS AMP","TLS DOWNGRADE",
                 "PRIV ESCALATION","LATERAL MOVE","CREDENTIAL STUFF","SUPPLY CHAIN PROBE"];
  var DEPTH = (LAYERS - 1) * GAP;
  var nodes = [], links = [], byLayer = [], packets = [], shields = [];
  var attack = null, nextAttack = 0, acc = 0;

  function rnd(a, b) { return a + Math.random() * (b - a); }

  for (var L = 0; L < LAYERS; L++) {
    byLayer[L] = [];
    for (var k = 0; k < PER_LAYER; k++) {
      var ang = (k / PER_LAYER) * Math.PI * 2 + L * 0.62;
      var rad = 5.6 + (k % 3) * 2.4 + rnd(-0.9, 0.9);
      byLayer[L].push(nodes.length);
      nodes.push({ bx: Math.cos(ang) * rad, by: Math.sin(ang) * rad * 0.72, bz: -L * GAP + rnd(-1.2, 1.2),
                   x: 0, y: 0, z: 0, layer: L, seed: Math.random() * 6.283, atk: 0 });
    }
  }
  for (var Ly = 0; Ly < LAYERS - 1; Ly++) {
    var cur = byLayer[Ly], nxt = byLayer[Ly + 1];
    for (var i = 0; i < cur.length; i++) {
      var fan = Math.random() < 0.35 ? 2 : 1;
      for (var f = 0; f < fan; f++)
        links.push([cur[i], nxt[(i + f + (Math.random() < 0.4 ? 1 : 0)) % nxt.length], rnd(0.28, 0.55)]);
    }
  }
  for (var Lr = 0; Lr < LAYERS; Lr++) {
    var ring = byLayer[Lr];
    for (var j = 0; j < ring.length; j++)
      if (Math.random() < 0.55) links.push([ring[j], ring[(j + 1) % ring.length], rnd(0.16, 0.32)]);
  }

  function harden(idx) { if (shields.length >= 6) shields.shift(); shields.push({ n: idx, t: 0 }); }
  function launch() {
    if (attack) return false;
    var vis = [];
    for (var i = 0; i < nodes.length; i++) { var d = ctx.cam.z - nodes[i].bz; if (d > 4 && d < 60) vis.push(i); }
    var target = vis.length ? vis[(Math.random() * vis.length) | 0] : (Math.random() * nodes.length) | 0;
    attack = { node: target, t: 0, phase: 0, threat: THREATS[(Math.random() * THREATS.length) | 0] };
    for (var k = 0; k < 34; k++) {
      var src = (Math.random() * nodes.length) | 0;
      if (src !== target) packets.push({ a: src, b: target, t: -Math.random() * 0.55, spd: rnd(0.75, 1.5), kind: 2 });
    }
    return true;
  }

  nextAttack = rnd(9, 16);

  return {
    name: "mesh",
    update: function (dt) {
      var t = ctx.t;
      ctx.cam.z = 10 - ctx.scroll * (DEPTH - 4);
      ctx.cam.x = ctx.cursor.x * 2.6;
      ctx.cam.y = ctx.cursor.y * 1.8;
      ctx.cam.yaw = ctx.cursor.x * 0.075;
      ctx.cam.pitch = ctx.cursor.y * 0.055;

      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        n.x = n.bx + Math.sin(t * 0.30 + n.seed) * 0.42;
        n.y = n.by + Math.cos(t * 0.24 + n.seed * 1.7) * 0.42;
        n.z = n.bz + Math.sin(t * 0.18 + n.seed * 0.9) * 0.30;
        if (n.atk > 0) n.atk -= dt;
      }
      acc += dt;
      while (acc > 1 / 24) { acc -= 1 / 24; if (packets.length < MAX_PACKETS && links.length) {
        var e = links[(Math.random() * links.length) | 0];
        packets.push({ a: e[0], b: e[1], t: 0, spd: rnd(0.22, 0.62), kind: 1 });
      } }
      for (var p = packets.length - 1; p >= 0; p--) {
        var pk = packets[p]; pk.t += pk.spd * dt;
        if (pk.t > 1) { if (pk.kind === 2 && attack && pk.b === attack.node) nodes[pk.b].atk = 0.35; packets.splice(p, 1); }
      }
      for (var s = shields.length - 1; s >= 0; s--) { shields[s].t += dt; if (shields[s].t > SHIELD_LIFE) shields.splice(s, 1); }

      var Lnow = Math.min(LAYERS - 1, Math.max(0, Math.round((10 - ctx.cam.z) / GAP)));
      if (attack) {
        attack.t += dt;
        if (attack.phase === 0) { ctx.hud(NAMES[Lnow], "⚠ " + attack.threat + " @ NODE-" + ctx.pad2(attack.node), true); attack.phase = 1; }
        else if (attack.phase === 1 && attack.t > 1.35) {
          nodes[attack.node].atk = 0.6; harden(attack.node);
          for (var e2 = 0; e2 < links.length; e2++)
            if (links[e2][0] === attack.node || links[e2][1] === attack.node)
              if (Math.random() < 0.35) harden(links[e2][0] === attack.node ? links[e2][1] : links[e2][0]);
          for (var q = packets.length - 1; q >= 0; q--) if (packets[q].kind === 2) packets.splice(q, 1);
          ctx.hud(NAMES[Lnow], "HARDENED — NODE-" + ctx.pad2(attack.node) + " HOLDING", false);
          attack.phase = 2;
        } else if (attack.phase === 2 && attack.t > 4.4) { attack = null; ctx.hud(NAMES[Lnow], "NOMINAL", false); nextAttack = rnd(14, 26); }
        else ctx.hud(NAMES[Lnow], null);
      } else {
        nextAttack -= dt;
        if (nextAttack <= 0) launch();
        ctx.hud(NAMES[Lnow], "NOMINAL", false);
      }
    },
    draw: function () {
      for (var e = 0; e < links.length; e++) {
        var A = nodes[links[e][0]], Bn = nodes[links[e][1]];
        var hot = A.atk > 0 || Bn.atk > 0;
        B.line(A.x,A.y,A.z, Bn.x,Bn.y,Bn.z, links[e][2] * (hot ? 3.2 : 1), hot ? 1 : 0);
      }
      for (var s = 0; s < shields.length; s++) {
        var sh = shields[s], nd = nodes[sh.n], prog = sh.t / SHIELD_LIFE;
        B.ring(nd.x, nd.y, nd.z, 0.6 + prog * 5.4, 44, (1 - prog) * 1.5, 0.55);
      }
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        B.point(n.x, n.y, n.z, n.atk > 0 ? 0.78 : 0.56, n.atk > 0 ? 3 : 0, 1);
      }
      for (var p = 0; p < packets.length; p++) {
        var pk = packets[p]; if (pk.t < 0) continue;
        var A2 = nodes[pk.a], B2 = nodes[pk.b], tt = pk.t;
        B.point(A2.x + (B2.x - A2.x) * tt, A2.y + (B2.y - A2.y) * tt, A2.z + (B2.z - A2.z) * tt,
                pk.kind === 2 ? 0.24 : 0.19, pk.kind, Math.min(1, Math.sin(tt * Math.PI) * 2.2));
      }
    },
    api: {
      attack: function () { return launch(); },
      harden: function () { for (var i = 0; i < 5; i++) harden((Math.random() * nodes.length) | 0);
                            ctx.hud(null, "BASELINE APPLIED — " + nodes.length + " NODES", false); return true; },
      stats: function () { return { nodes: nodes.length, links: links.length, layers: LAYERS, packets: packets.length,
                                    layer: NAMES[Math.min(LAYERS-1, Math.max(0, Math.round((10 - ctx.cam.z) / GAP)))] }; }
    }
  };
};

/* =============================================================================
   SCENE 2 — CLUSTER  (/work)
   A 3×3 node grid. Pods schedule in, run, get rolled. A node goes NotReady and
   the scheduler moves its pods elsewhere — which is the whole point of a cluster.
   ============================================================================= */
SCENES.cluster = function () {
  /* spread wide enough that the outer nodes sit past the text column */
  var GX = 3, GZ = 3, SPACE_X = 14, SPACE_Z = 14, PLATE = 7, POD = 0.9, SLOT = 2.0;
  var nodes = [], pods = [], podSeq = 1, rollT = 16, failT = 30, roll = null, gen = 1;

  for (var i = 0; i < GX * GZ; i++) {
    nodes.push({ id: i, x: (i % GX - 1) * SPACE_X, y: -3, z: -Math.floor(i / GX) * SPACE_Z,
                 down: 0, seed: Math.random() * 6.28 });
  }
  function freeSlot(n) {
    var used = {};
    for (var i = 0; i < pods.length; i++) if (pods[i].node === n.id && pods[i].state !== "term") used[pods[i].slot] = 1;
    for (var s = 0; s < 9; s++) if (!used[s]) return s;
    return -1;
  }
  function schedule(nodeId) {
    var n = nodes[nodeId]; if (!n || n.down > 0) return null;
    var slot = freeSlot(n); if (slot < 0) return null;
    var p = { id: podSeq++, node: nodeId, slot: slot, state: "pending", t: 0, gen: gen, seed: Math.random() * 6.28 };
    pods.push(p); return p;
  }
  function scheduleAnywhere() {
    var order = nodes.map(function (n) { return n.id; }).sort(function () { return Math.random() - 0.5; });
    for (var i = 0; i < order.length; i++) { var p = schedule(order[i]); if (p) return p; }
    return null;
  }
  function podPos(p) {
    var n = nodes[p.node];
    var sx = (p.slot % 3 - 1) * SLOT, sz = (Math.floor(p.slot / 3) - 1) * SLOT;
    var y = n.y + 0.62;
    if (p.state === "pending") y += Math.max(0, (1 - p.t / 0.9)) * 7;
    if (p.state === "term")    y += (p.t / 0.8) * 6;
    return [n.x + sx, y, n.z + sz];
  }
  function running() { var c = 0; for (var i = 0; i < pods.length; i++) if (pods[i].state === "running") c++; return c; }

  /* seed the cluster: 4–6 pods per healthy node */
  for (var n0 = 0; n0 < nodes.length; n0++) {
    var count = 4 + ((Math.random() * 3) | 0);
    for (var c0 = 0; c0 < count; c0++) { var pp = schedule(n0); if (pp) { pp.state = "running"; pp.t = 1; } }
  }

  function startRoll() { if (roll) return false; gen++; roll = { node: 0, t: 0, done: 0 }; return true; }
  function downNode(id) {
    var n = nodes[id == null ? (Math.random() * nodes.length) | 0 : id];
    if (n.down > 0) return null;
    n.down = 7;
    var moved = 0;
    for (var i = 0; i < pods.length; i++) {
      if (pods[i].node === n.id && pods[i].state !== "term") { pods[i].state = "term"; pods[i].t = 0; moved++; }
    }
    for (var m = 0; m < moved; m++) scheduleAnywhere();
    return { node: n.id, moved: moved };
  }

  return {
    name: "cluster",
    update: function (dt) {
      ctx.cam.z = 18 - ctx.scroll * 42;
      ctx.cam.y = 5.5 + ctx.cursor.y * 1.2;
      ctx.cam.x = ctx.cursor.x * 3.0;
      ctx.cam.yaw = ctx.cursor.x * 0.09;
      /* positive pitch tilts the camera DOWN in this view matrix — the grid sits
         below the eye, so this is what puts it in frame rather than under it */
      ctx.cam.pitch = 0.30 + ctx.cursor.y * 0.05;

      for (var i = 0; i < nodes.length; i++) if (nodes[i].down > 0) nodes[i].down -= dt;

      for (var p = pods.length - 1; p >= 0; p--) {
        var pd = pods[p]; pd.t += dt;
        if (pd.state === "pending" && pd.t > 0.9) { pd.state = "running"; pd.t = 0; }
        else if (pd.state === "term" && pd.t > 0.8) pods.splice(p, 1);
      }

      if (roll) {
        roll.t += dt;
        if (roll.t > 0.85) {
          roll.t = 0;
          var target = nodes[roll.node];
          if (target && target.down <= 0) {
            var replaced = 0;
            for (var q = 0; q < pods.length; q++) {
              if (pods[q].node === target.id && pods[q].state === "running" && pods[q].gen < gen && replaced < 3) {
                pods[q].state = "term"; pods[q].t = 0; replaced++;
              }
            }
            for (var r = 0; r < replaced; r++) schedule(target.id);
            roll.done += replaced;
            if (replaced === 0) roll.node++;
          } else roll.node++;
          if (roll.node >= nodes.length) { roll = null; ctx.hud(null, "ROLLOUT COMPLETE — " + running() + " PODS READY", false); rollT = 22; }
        }
        if (roll) ctx.hud("CLUSTER", "ROLLING UPDATE — NODE-" + ctx.pad2(roll.node) + " (" + running() + " READY)", false);
      } else {
        rollT -= dt; failT -= dt;
        if (rollT <= 0) { startRoll(); rollT = 26; }
        if (failT <= 0) {
          var ev = downNode();
          failT = 34;
          if (ev) ctx.hud("CLUSTER", "⚠ NODE-" + ctx.pad2(ev.node) + " NOTREADY — RESCHEDULING " + ev.moved + " PODS", true);
        } else {
          var anyDown = nodes.some(function (n) { return n.down > 0; });
          if (!anyDown) ctx.hud("CLUSTER", nodes.length + " NODES · " + running() + " PODS RUNNING", false);
        }
      }
    },
    draw: function () {
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i], bad = n.down > 0;
        var tint = bad ? 1 : 0, a = bad ? 0.75 : 0.34;
        B.plate(n.x, n.y, n.z, PLATE, PLATE, a, tint);
        /* slot guides */
        for (var g = -1; g <= 1; g++) {
          B.line(n.x - PLATE/2, n.y, n.z + g*SLOT, n.x + PLATE/2, n.y, n.z + g*SLOT, a*0.35, tint);
          B.line(n.x + g*SLOT, n.y, n.z - PLATE/2, n.x + g*SLOT, n.y, n.z + PLATE/2, a*0.35, tint);
        }
        /* the node's own status light, pulsing when healthy */
        var pulse = bad ? (0.5 + 0.5*Math.sin(ctx.t*9)) : (0.55 + 0.45*Math.sin(ctx.t*1.6 + n.seed));
        B.point(n.x, n.y + 0.14, n.z - PLATE/2 - 0.5, 0.30, bad ? 2 : 4, pulse);
        /* corner posts give the platform some height */
        for (var cx = -1; cx <= 1; cx += 2) for (var cz = -1; cz <= 1; cz += 2)
          B.line(n.x + cx*PLATE/2, n.y, n.z + cz*PLATE/2, n.x + cx*PLATE/2, n.y - 0.9, n.z + cz*PLATE/2, a*0.6, tint);
      }
      for (var p = 0; p < pods.length; p++) {
        var pd = pods[p], pos = podPos(pd);
        var a2 = pd.state === "term" ? Math.max(0, 1 - pd.t / 0.8)
               : pd.state === "pending" ? Math.min(1, pd.t / 0.35) : 1;
        /* amber = current generation, dim = awaiting the roll, red = terminating.
           green is reserved for node health so it stays meaningful. */
        var tint2 = pd.state === "term" ? 1 : (pd.gen >= gen ? 3 : 0);
        B.box(pos[0], pos[1], pos[2], POD, POD, POD, a2 * 0.58, tint2);
        if (pd.state === "running")
          B.point(pos[0], pos[1], pos[2], 0.16, 1, 0.35 + 0.35 * Math.sin(ctx.t * 2.2 + pd.seed));
      }
    },
    api: {
      get: function () { return { nodes: nodes.length, pods: pods.length, running: running(), generation: gen }; },
      rollout: function () { return startRoll(); },
      drain: function (id) { return downNode(id); },
      scale: function (n) { var made = 0; for (var i = 0; i < n; i++) if (scheduleAnywhere()) made++; return made; }
    }
  };
};

/* =============================================================================
   SCENE 3 — RACK  (/stack)
   Three racks, 40U each. Drive LEDs blink on their own I/O pattern, fans turn,
   the chassis runs warmer toward the top. Occasionally a disk fails and rebuilds.
   ============================================================================= */
SCENES.rack = function () {
  /* two flanking racks rather than three — the middle one only ever sat behind
     the text column where nothing of it could be seen */
  var RACKS = 2, UNITS = 40, RU = 0.52, RW = 7.2, RD = 2.8, TOP = 3, SPAN = 15.5;
  var racks = [], failT = 12, evt = null;

  for (var r = 0; r < RACKS; r++) {
    var units = [];
    for (var u = 0; u < UNITS; u++) {
      units.push({
        seed: Math.random() * 6.28,
        io: 0.4 + Math.random() * 3.0,           // I/O rate — drives blink at their own pace
        fan: (u % 11 === 0),                      // PSU / chassis fan slots
        sw:  (u % 17 === 5),                      // a switch every so often
        fail: 0, rebuild: -1
      });
    }
    racks.push({ x: (r - (RACKS - 1) / 2) * SPAN, units: units, id: r + 1 });
  }
  function unitY(u) { return TOP - u * RU - RU / 2; }
  var BOTTOM = unitY(UNITS - 1) - RU;

  /* only disks fail here — fans and switches are skipped, so keep drawing until
     we land on a chassis that actually has an array in it */
  function failDisk() {
    if (evt) return null;
    for (var tries = 0; tries < 40; tries++) {
      var r = (Math.random() * RACKS) | 0, u = (Math.random() * UNITS) | 0;
      var unit = racks[r].units[u];
      if (unit.fan || unit.sw || unit.fail) continue;
      unit.fail = 1; unit.rebuild = -1;
      evt = { r: r, u: u, t: 0, phase: 0 };
      return { rack: racks[r].id, u: UNITS - u };
    }
    return null;
  }

  return {
    name: "rack",
    update: function (dt) {
      var span = TOP - BOTTOM;
      ctx.cam.z = 15.5;
      ctx.cam.y = TOP - 2.5 - ctx.scroll * (span - 6);
      ctx.cam.x = ctx.cursor.x * 3.4;
      ctx.cam.yaw = ctx.cursor.x * 0.16;
      ctx.cam.pitch = ctx.cursor.y * 0.06;

      if (evt) {
        evt.t += dt;
        var unit = racks[evt.r].units[evt.u];
        if (evt.phase === 0) {
          ctx.hud("RACK-" + ctx.pad2(racks[evt.r].id), "⚠ DISK FAIL — U" + ctx.pad2(UNITS - evt.u) + " DEGRADED", true);
          evt.phase = 1;
        } else if (evt.phase === 1 && evt.t > 3.0) { unit.rebuild = 0; evt.phase = 2; }
        else if (evt.phase === 2) {
          unit.rebuild += dt / 4.5;
          ctx.hud(null, "REBUILDING U" + ctx.pad2(UNITS - evt.u) + " — " + Math.min(99, (unit.rebuild * 100) | 0) + "%", false);
          if (unit.rebuild >= 1) { unit.fail = 0; unit.rebuild = -1; evt = null; failT = 18; ctx.hud(null, "ARRAY HEALTHY — " + (RACKS * UNITS) + "U ONLINE", false); }
        }
      } else {
        failT -= dt;
        if (failT <= 0) { if (!failDisk()) failT = 3; }
        else ctx.hud("RACK-01→" + ctx.pad2(RACKS), (RACKS * UNITS) + "U · ALL ARRAYS HEALTHY", false);
      }
    },
    draw: function () {
      var t = ctx.t;
      for (var r = 0; r < racks.length; r++) {
        var rk = racks[r];
        /* rack frame: four uprights plus a top rail */
        for (var fx = -1; fx <= 1; fx += 2) for (var fz = -1; fz <= 1; fz += 2)
          B.line(rk.x + fx*RW/2, TOP + 0.4, fz*RD/2, rk.x + fx*RW/2, BOTTOM - 0.4, fz*RD/2, 0.30, 0);
        B.line(rk.x - RW/2, TOP + 0.4, RD/2, rk.x + RW/2, TOP + 0.4, RD/2, 0.30, 0);
        B.line(rk.x - RW/2, BOTTOM - 0.4, RD/2, rk.x + RW/2, BOTTOM - 0.4, RD/2, 0.30, 0);

        for (var u = 0; u < rk.units.length; u++) {
          var un = rk.units[u], y = unitY(u);
          /* thermal: chassis nearer the top of the rack sits warmer */
          var heat = 1 - (y - BOTTOM) / (TOP - BOTTOM);
          var base = 0.36 + heat * 0.28;
          var tint = un.fail ? 1 : (un.sw ? 3 : 0);
          var a = un.fail ? 0.8 : base;

          /* front face + two depth edges reads as a chassis without 12 lines each */
          B.rect(rk.x, y, RD/2, RW - 0.5, RU - 0.10, a, tint);
          B.line(rk.x - (RW-0.5)/2, y + (RU-0.10)/2, RD/2, rk.x - (RW-0.5)/2, y + (RU-0.10)/2, -RD/2, a*0.45, tint);
          B.line(rk.x + (RW-0.5)/2, y + (RU-0.10)/2, RD/2, rk.x + (RW-0.5)/2, y + (RU-0.10)/2, -RD/2, a*0.45, tint);

          if (un.fan) {
            /* PSU / fan unit — two spinning impellers */
            for (var fi = -1; fi <= 1; fi += 2) {
              var fcx = rk.x + fi * 1.5, frad = RU * 0.34;
              B.ring(fcx, y, RD/2 + 0.01, frad, 10, a * 1.3, 0);
              var rot = t * (2.2 + un.seed * 0.3) * (fi > 0 ? 1 : -1);
              for (var sp = 0; sp < 3; sp++) {
                var ang = rot + sp * 2.094;
                B.line(fcx, y, RD/2 + 0.01, fcx + Math.cos(ang) * frad, y + Math.sin(ang) * frad, RD/2 + 0.01, a * 1.1, 0);
              }
            }
          } else {
            /* drive activity LEDs — each on its own I/O rhythm */
            for (var d = 0; d < 6; d++) {
              var lx = rk.x - RW/2 + 0.75 + d * 0.62;
              var ph = Math.sin(t * un.io * (1 + d * 0.21) + un.seed + d);
              var lit = Math.pow(Math.max(0, ph), 6);
              var kind = 4, al = 0.16 + lit * 0.84;
              if (un.fail && d === 2) { kind = 2; al = 0.55 + 0.45 * Math.sin(t * 8); }
              else if (un.rebuild >= 0) { kind = 1; al = (d / 6 < un.rebuild) ? 0.95 : 0.14; }
              B.point(lx, y, RD/2 + 0.02, 0.11, kind, al);
            }
            /* power LED, steady */
            B.point(rk.x + RW/2 - 0.55, y, RD/2 + 0.02, 0.12, un.fail ? 2 : 4, un.fail ? 0.9 : 0.7);
          }
          /* rebuild progress bar sweeping the chassis */
          if (un.rebuild >= 0) {
            var bx = rk.x - (RW-0.5)/2 + (RW-0.5) * Math.min(1, un.rebuild);
            B.line(rk.x - (RW-0.5)/2, y - (RU-0.10)/2 + 0.02, RD/2 + 0.02, bx, y - (RU-0.10)/2 + 0.02, RD/2 + 0.02, 1.0, 2);
          }
        }
      }
    },
    api: {
      get: function () { return { racks: RACKS, units: RACKS * UNITS, degraded: evt ? 1 : 0 }; },
      fail: function () { return failDisk(); }
    }
  };
};

/* =============================================================================
   SCENE 4 — PIPELINE  (/experience)
   commit → build → test → scan → package → deploy. Artifacts fly the corridor.
   Some fail their stage, turn red, and roll back the way they came.
   ============================================================================= */
SCENES.pipeline = function () {
  var STAGES = ["COMMIT","BUILD","TEST","SCAN","PACKAGE","DEPLOY"];
  /* the corridor is deliberately wider than the text column — gates should frame
     the content from the edges of the viewport, not sit on top of it */
  var GATE_Z = -8, GATE_GAP = 13, GW = 21, GH = 12.5;
  var gates = [], arts = [], spawn = 0, buildNo = 1040, lastMsg = 0;

  for (var i = 0; i < STAGES.length; i++) gates.push({ i: i, z: GATE_Z - i * GATE_GAP, flash: 0, fail: 0 });
  var END_Z = gates[gates.length - 1].z - 10;

  function gateOf(z) { for (var i = gates.length - 1; i >= 0; i--) if (z <= gates[i].z) return i; return -1; }

  return {
    name: "pipeline",
    update: function (dt) {
      ctx.cam.z = 6 - ctx.scroll * (Math.abs(END_Z) - 6);
      ctx.cam.x = ctx.cursor.x * 1.6;
      ctx.cam.y = ctx.cursor.y * 1.1;
      ctx.cam.yaw = ctx.cursor.x * 0.10;
      ctx.cam.pitch = ctx.cursor.y * 0.05;

      for (var g = 0; g < gates.length; g++) { if (gates[g].flash > 0) gates[g].flash -= dt * 2.2; if (gates[g].fail > 0) gates[g].fail -= dt; }

      spawn -= dt;
      if (spawn <= 0 && arts.length < 26) {
        spawn = 0.75;
        /* keep artifacts out toward the rails so they never fly through the copy */
        arts.push({ z: 2, x: ctx.rnd(3.2, 8.2) * (Math.random() < 0.5 ? -1 : 1), y: ctx.rnd(-4.6, 4.6), v: ctx.rnd(9, 13),
                    state: "ok", passed: -1, build: ++buildNo, seed: Math.random() * 6.28 });
      }
      for (var a = arts.length - 1; a >= 0; a--) {
        var ar = arts[a];
        ar.z -= ar.v * dt;
        var gi = gateOf(ar.z);
        if (gi > ar.passed && gi >= 0) {
          ar.passed = gi;
          gates[gi].flash = 1;
          /* the honest bit: not every build survives its stage */
          if (ar.state === "ok" && (gi === 2 || gi === 3) && Math.random() < 0.17) {
            ar.state = "fail"; ar.v = -ar.v * 1.6; gates[gi].fail = 1.6;
            ctx.hud("PIPELINE", "✕ BUILD #" + ar.build + " FAILED AT " + STAGES[gi] + " — ROLLING BACK", true);
            lastMsg = 3.2;
          }
        }
        if (ar.state === "fail" && ar.z > 4) arts.splice(a, 1);
        else if (ar.z < END_Z) {
          if (ar.state === "ok" && lastMsg <= 0) ctx.hud("PIPELINE", "✓ BUILD #" + ar.build + " DEPLOYED", false);
          arts.splice(a, 1);
        }
      }
      if (lastMsg > 0) lastMsg -= dt;
      else {
        var ok = 0; for (var k = 0; k < arts.length; k++) if (arts[k].state === "ok") ok++;
        ctx.hud("PIPELINE", ok + " IN FLIGHT · " + STAGES.length + " STAGES", false);
      }
    },
    draw: function () {
      var t = ctx.t;
      /* corridor rails — dashes give the depth a speed read */
      for (var z = 4; z > END_Z; z -= 2.6) {
        var a = 0.13;
        for (var sx = -1; sx <= 1; sx += 2) for (var sy = -1; sy <= 1; sy += 2)
          B.line(sx * GW/2, sy * GH/2, z, sx * GW/2, sy * GH/2, z - 1.1, a, 0);
      }
      /* gates */
      for (var g = 0; g < gates.length; g++) {
        var gt = gates[g];
        var a2 = 0.30 + Math.max(0, gt.flash) * 0.8;
        var tint = gt.fail > 0 ? 1 : (g === gates.length - 1 ? 2 : 0);
        B.rect(0, 0, gt.z, GW, GH, a2, tint);
        B.rect(0, 0, gt.z, GW - 0.9, GH - 0.9, a2 * 0.45, tint);
        /* corner ticks, so each gate reads as a station not just a frame */
        for (var cx = -1; cx <= 1; cx += 2) for (var cy = -1; cy <= 1; cy += 2) {
          B.line(cx*GW/2, cy*GH/2, gt.z, cx*GW/2, cy*GH/2, gt.z + 0.9, a2 * 0.7, tint);
          B.point(cx*GW/2, cy*GH/2, gt.z, 0.17, gt.fail > 0 ? 2 : (g === gates.length-1 ? 4 : 1), 0.5 + Math.max(0,gt.flash)*0.5);
        }
        /* stage index ticks along the bottom rail */
        for (var n = 0; n <= g; n++)
          B.point(-GW/2 + 0.5 + n * 0.42, -GH/2 - 0.45, gt.z, 0.12, 5, 0.5);
      }
      /* artifacts */
      for (var a3 = 0; a3 < arts.length; a3++) {
        var ar = arts[a3];
        var wob = Math.sin(t * 2 + ar.seed) * 0.12;
        var tint2 = ar.state === "fail" ? 1 : 3;
        B.box(ar.x + wob, ar.y + wob * 0.6, ar.z, 0.55, 0.55, 0.55, 0.9, tint2);
        B.point(ar.x + wob, ar.y + wob * 0.6, ar.z, 0.20, ar.state === "fail" ? 2 : 1, 0.85);
        /* trail */
        B.line(ar.x + wob, ar.y + wob*0.6, ar.z, ar.x + wob, ar.y + wob*0.6, ar.z + (ar.v > 0 ? 1.8 : -1.8), 0.35, tint2);
      }
    },
    api: {
      get: function () { return { stages: STAGES.slice(), inFlight: arts.length, lastBuild: buildNo }; },
      trigger: function () {
        arts.push({ z: 2, x: 5.5, y: 0, v: 11, state: "ok", passed: -1, build: ++buildNo, seed: 0 });
        return buildNo;
      }
    }
  };
};

/* =============================================================================
   BOOT  —  pick the scene the page asked for
   ============================================================================= */
var want = document.body.getAttribute("data-scene") || "mesh";
if (!SCENES[want]) want = "mesh";
var scene = SCENES[want]();

var proj = new Float32Array(16), view = new Float32Array(16);
var running = true, enabled = true, last = performance.now();

function frame(now) {
  if (!running) return;
  requestAnimationFrame(frame);
  var dt = Math.min((now - last) / 1000, 0.05); last = now;
  if (!enabled) return;

  resize();
  ctx.t = now / 1000; ctx.dt = dt;
  ctx.scroll += (scrollTarget - ctx.scroll) * Math.min(dt * 4.0, 1);
  curX += (curTX - curX) * Math.min(dt * 3.2, 1);
  curY += (curTY - curY) * Math.min(dt * 3.2, 1);
  ctx.cursor.x = curX; ctx.cursor.y = curY;
  ctx.aspect = W / H;

  scene.update(dt);

  pi = 0; li = 0;
  scene.draw();

  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, COL.additive ? gl.ONE : gl.ONE_MINUS_SRC_ALPHA);

  mPerspective(proj, FOV, W / H, 0.1, 260);
  mView(view, ctx.cam.yaw, ctx.cam.pitch, ctx.cam.x, ctx.cam.y, ctx.cam.z);

  if (li > 0) {
    gl.useProgram(pgLine);
    gl.uniformMatrix4fv(uL.uProj, false, proj); gl.uniformMatrix4fv(uL.uView, false, view);
    gl.uniform3fv(uL.uAccent, COL.accent); gl.uniform3fv(uL.uText, COL.text);
    gl.uniform3fv(uL.uAlert, COL.alert); gl.uniform3fv(uL.uOk, COL.ok);
    gl.uniform1f(uL.uOpacity, COL.opacity);
    gl.bindBuffer(gl.ARRAY_BUFFER, lnBuf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, lnData, 0, li);
    var lsb = LN_STRIDE * 4;
    gl.enableVertexAttribArray(aL.pos);   gl.vertexAttribPointer(aL.pos,   3, gl.FLOAT, false, lsb, 0);
    gl.enableVertexAttribArray(aL.alpha); gl.vertexAttribPointer(aL.alpha, 1, gl.FLOAT, false, lsb, 12);
    gl.enableVertexAttribArray(aL.tint);  gl.vertexAttribPointer(aL.tint,  1, gl.FLOAT, false, lsb, 16);
    gl.drawArrays(gl.LINES, 0, li / LN_STRIDE);
  }
  if (pi > 0) {
    gl.useProgram(pgPoint);
    gl.uniformMatrix4fv(uP.uProj, false, proj); gl.uniformMatrix4fv(uP.uView, false, view);
    gl.uniform1f(uP.uK, (H / 2) / Math.tan(FOV / 2));
    gl.uniform1f(uP.uMaxPS, maxPS);
    gl.uniform2f(uP.uCursor, curX, curY);
    gl.uniform3fv(uP.uAccent, COL.accent); gl.uniform3fv(uP.uText, COL.text);
    gl.uniform3fv(uP.uAlert, COL.alert); gl.uniform3fv(uP.uOk, COL.ok);
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
}

document.addEventListener("visibilitychange", function () { enabled = !document.hidden; last = performance.now(); });
cv.addEventListener("webglcontextlost", function (e) { e.preventDefault(); running = false; }, false);
cv.addEventListener("webglcontextrestored", function () { location.reload(); }, false);

resize();
requestAnimationFrame(frame);

/* =============================================================================
   PUBLIC API  —  the terminal in app.js talks to this
   ============================================================================= */
window.NET3D = {
  scene: scene.name,
  api: scene.api,
  toggle: function (on) {
    enabled = (typeof on === "boolean") ? on : !enabled;
    cv.style.opacity = enabled ? "" : "0";
    if (enabled) last = performance.now();
    return enabled;
  },
  stats: function () {
    var s = { scene: scene.name, renderer: "WebGL2 (hand-rolled)", depth: (ctx.scroll * 100).toFixed(1) + "%" };
    var extra = scene.api && (scene.api.stats ? scene.api.stats() : scene.api.get ? scene.api.get() : {});
    for (var k in extra) s[k] = extra[k];
    return s;
  },
  /* kept for the home page's terminal verbs */
  attack: function () { return scene.api && scene.api.attack ? scene.api.attack() : false; },
  harden: function () { return scene.api && scene.api.harden ? scene.api.harden() : false; }
};

})();
