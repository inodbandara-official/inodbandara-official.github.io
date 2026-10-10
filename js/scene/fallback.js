/* =============================================================================
   FALLBACK — no WebGL, no problem.

   A 2D canvas running the same idea with its own cheap perspective projection:
   the same three depth shells, the same routed traffic, the same amber core.
   It is quieter than the WebGL scene by design, and it costs almost nothing, so
   the machine that couldn't run the real one isn't punished for showing up.
   ============================================================================= */
import { el, clamp, damp } from "../core/dom.js";
import { state, onTick, on } from "../core/state.js";
import { PALETTE }          from "../core/tokens.js";

const hex = n => "#" + n.toString(16).padStart(6, "0");

export function mountFallback(host, profile) {
  const canvas = el("canvas", { class: "scene__2d" });
  host.appendChild(canvas);
  const ctx = canvas.getContext("2d", { alpha: true });

  let w = 0, h = 0, dpr = 1;
  const N = state.view.mobile ? 34 : 66;
  const nodes = [];
  const links = [];
  const packets = [];

  for (let i = 0; i < N; i++) {
    const shell = i % 3;
    const r = [0.26, 0.42, 0.62][shell];
    const a = (i / N) * Math.PI * 2 * 3.3 + shell;
    nodes.push({
      x: Math.cos(a) * r, y: (Math.random() - 0.5) * r * 0.9, z: Math.sin(a) * r,
      shell, energy: 0, phase: Math.random() * Math.PI * 2,
    });
  }
  nodes.forEach((n, i) => {
    const near = nodes.map((m, j) => ({ j, d: j === i ? 9 : dist(n, m) })).sort((a, b) => a.d - b.d);
    for (let k = 0; k < 2; k++) if (near[k] && near[k].d < 0.4) links.push({ a: i, b: near[k].j, charge: 0 });
  });
  for (let i = 0; i < (state.view.mobile ? 12 : 26); i++)
    packets.push({ l: (Math.random() * links.length) | 0, t: Math.random(), s: 0.1 + Math.random() * 0.2 });

  function resize() {
    dpr = Math.min(state.view.dpr, 2);
    w = state.view.w; h = state.view.h;
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = w + "px"; canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  on("resize", resize);

  let boot = 0, px = 0, py = 0;
  const S = () => Math.min(w, h);

  const project = (n, rot) => {
    const c = Math.cos(rot), s = Math.sin(rot);
    const x = n.x * c - n.z * s, z = n.x * s + n.z * c;
    const depth = 1 / (1.7 + z);
    return { sx: w / 2 + x * S() * depth * 2.1 + px * 26, sy: h / 2 + n.y * S() * depth * 2.1 + py * 16, d: depth };
  };

  const stop = onTick((dt, t) => {
    boot = damp(boot, 1, 1.2, dt);
    px = damp(px, state.pointer.nx, 2.2, dt);
    py = damp(py, state.pointer.ny, 2.2, dt);
    const rot = state.flags.reduced ? 0.4 : t * 0.045;
    const scrollDrift = state.scroll.progress * 0.6;

    ctx.clearRect(0, 0, w, h);

    /* atmosphere: two large soft sources, one cool one violet */
    glow(ctx, w * 0.28, h * 0.3 - scrollDrift * h * 0.15, S() * 0.85, PALETTE.key, 0.22 * boot);
    glow(ctx, w * 0.76, h * 0.68 - scrollDrift * h * 0.1, S() * 0.7, PALETTE.violet, 0.16 * boot);

    /* links */
    ctx.lineWidth = 1;
    for (const l of links) {
      l.charge = damp(l.charge, 0, 2.4, dt);
      const A = project(nodes[l.a], rot), B = project(nodes[l.b], rot);
      ctx.strokeStyle = rgba(PALETTE.signal, (0.05 + l.charge * 0.22) * boot * Math.min(A.d, B.d) * 1.6);
      ctx.beginPath(); ctx.moveTo(A.sx, A.sy); ctx.lineTo(B.sx, B.sy); ctx.stroke();
    }

    /* traffic */
    for (const p of packets) {
      const l = links[p.l]; if (!l) continue;
      p.t += p.s * dt;
      if (p.t >= 1) {
        p.t = 0; nodes[l.b].energy = 1; l.charge = 1;
        p.l = (Math.random() * links.length) | 0;
      }
      const A = project(nodes[l.a], rot), B = project(nodes[l.b], rot);
      const x = A.sx + (B.sx - A.sx) * p.t, y = A.sy + (B.sy - A.sy) * p.t;
      ctx.fillStyle = rgba(PALETTE.signal, 0.85 * boot);
      ctx.beginPath(); ctx.arc(x, y, 1.5, 0, 7); ctx.fill();
    }

    /* nodes */
    for (const n of nodes) {
      n.energy = damp(n.energy, 0, 2, dt);
      const P = project(n, rot);
      const r = (1.1 + n.energy * 2.4) * P.d * 3.2;
      ctx.fillStyle = rgba([PALETTE.signal, PALETTE.key, PALETTE.violet][n.shell], (0.3 + n.energy * 0.6) * boot);
      ctx.beginPath(); ctx.arc(P.sx, P.sy, Math.max(0.5, r), 0, 7); ctx.fill();
    }

    /* the core: concentric instrument rings around one warm centre */
    const cx = w / 2 + px * 12, cy = h / 2 + py * 8;
    const beat = 0.9 + Math.sin(t * 0.7) * 0.08;
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const rr = S() * (0.075 + i * 0.035) * beat;
      ctx.strokeStyle = rgba(PALETTE.signal, (0.2 - i * 0.05) * boot);
      ctx.beginPath();
      ctx.ellipse(cx, cy, rr, rr * (0.34 + i * 0.1), rot * (i + 1) * 0.6, 0, 7);
      ctx.stroke();
    }
    glow(ctx, cx, cy, S() * 0.11 * beat, PALETTE.amber, 0.5 * boot);
    ctx.fillStyle = rgba(PALETTE.amber, 0.9 * boot);
    ctx.beginPath(); ctx.arc(cx, cy, S() * 0.011 * beat, 0, 7); ctx.fill();
  });

  document.body.classList.add("sys-online");

  return {
    pulse() { nodes.forEach((n, i) => { if (i % 2 === 0) n.energy = 1; }); },
    hoverNode(k) { const n = nodes[(k ?? 0) * 5 % nodes.length]; if (n) n.energy = 1.2; },
    focusNode() {},
    dispose() { stop(); host.remove(); },
  };
}

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const rgba = (n, a) => "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + clamp(a, 0, 1).toFixed(3) + ")";

function glow(ctx, x, y, r, color, alpha) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(color, alpha));
  g.addColorStop(0.5, rgba(color, alpha * 0.3));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
