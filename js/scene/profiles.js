/* =============================================================================
   SCENE PROFILES — one world, framed differently per page.

   Every page shows the same system; what changes is where the camera stands in
   it, which tier of the graph is emphasised, and which real portfolio entries
   are bound to nodes. That is what keeps the site feeling like one continuous
   environment instead of ten separate pages that each happen to have a canvas.
   ============================================================================= */
import { CONFIG, projSlug } from "../data/profile.js";

const pad = i => String(i + 1).padStart(2, "0");

/* Content bound to nodes. `id` is structural (a node name); `meta` is the real
   thing it points at. Nothing here is invented — every label reads from CONFIG. */
const projectNodes = () => CONFIG.projects.map((p, i) => ({
  id: "SVC_" + pad(i), meta: p.title, kind: "service",
  href: "/work/" + projSlug(p), status: "ok",
}));

const stackNodes = () => CONFIG.stack.map((g, i) => ({
  id: "MOD_" + pad(i), meta: g.group.replace(/&amp;/g, "&"), kind: "module", status: "ok",
}));

const layerNodes = () => {
  const seen = new Set(); const out = [];
  CONFIG.experience.forEach(e => {
    const r = (e.role || "").toLowerCase();
    const k = r.includes("network") ? "NETWORK"
            : r.includes("software") ? "APPLICATION"
            : (r.includes("research") || r.includes("intelligence")) ? "DATA"
            : (r.includes("systems") || r.includes("devops")) ? "SYSTEMS" : "FOUNDATION";
    if (seen.has(k)) return;
    seen.add(k);
    out.push({ id: "TIER_" + pad(out.length), meta: k, kind: "tier", status: "ok" });
  });
  return out;
};

/* Camera keyframes, sampled by scroll progress. Slow, wide, and always looking
   at something — the camera never orbits for the sake of orbiting. */
const PATHS = {
  home: [
    { at: 0.00, pos: [0.0,  1.8, 23.0], look: [0,  0.3, 0] },   // establishing
    { at: 0.26, pos: [-5.2, 2.9, 14.2], look: [0,  0.1, 0] },   // approach the graph
    { at: 0.52, pos: [4.0, -1.4,  9.6], look: [0, -0.5, 0] },   // among the tiers
    { at: 0.78, pos: [-3.0, 4.2, 13.0], look: [0,  1.0, 0] },   // rise over the field
    { at: 1.00, pos: [0.0,  0.7,  7.4], look: [0,  0.0, 0] },   // converge on the core
  ],
  page: [
    { at: 0.00, pos: [7.5,  2.6, 18.5], look: [0, 0.4, 0] },
    { at: 0.55, pos: [-6.0, 1.2, 15.0], look: [0, 0.0, 0] },
    { at: 1.00, pos: [1.5, -1.8, 11.0], look: [0, -0.4, 0] },
  ],
  inward: [
    { at: 0.00, pos: [0.0, 2.2, 15.5], look: [0, 0.4, 0] },
    { at: 0.60, pos: [1.8, 0.4,  8.2], look: [0, 0.0, 0] },
    { at: 1.00, pos: [-0.6, -0.6, 5.6], look: [0, 0.0, 0] },
  ],
  /* Experience descends the stack: the camera starts above the tiers and sinks
     through them as you read down the timeline. */
  vertical: [
    { at: 0.00, pos: [-3.0,  7.0, 18.0], look: [0,  3.2, 0] },
    { at: 0.50, pos: [-4.5,  0.5, 16.5], look: [0,  0.0, 0] },
    { at: 1.00, pos: [-2.0, -6.0, 15.0], look: [0, -3.2, 0] },
  ],
  wide: [
    { at: 0.00, pos: [0.0, 3.0, 27.0], look: [0, 0.6, 0] },
    { at: 1.00, pos: [0.0, 0.5, 19.0], look: [0, 0.0, 0] },
  ],
};

/* `offset` moves the whole world inside the frame so the typography always has
   a clear column to live in. On the home page the environment sits right of
   centre; the headline owns the left third. */
const BASE = {
  path: PATHS.page, emphasis: "network", scale: 0.62, offset: [7.2, -0.9, -4.5],
  content: [], coreLabel: true, exposure: 1, bloom: 1,
};

export function profileFor(page) {
  switch (page) {
    case "home":
      return { ...BASE, path: PATHS.home, emphasis: "all", content: projectNodes(),
               scale: 0.72, offset: [6.8, -0.4, -3.0] };

    case "work":
      return { ...BASE, path: PATHS.page, emphasis: "network", content: projectNodes(),
               scale: 0.6, offset: [7.4, -1.0, -5.0] };

    case "project":  /* a single case study: one service, inspected up close */
      return {
        ...BASE, path: PATHS.inward, emphasis: "network", scale: 0.6,
        offset: [7.0, -0.8, -5.0],
        content: projectNodes(), focusContent: Number(document.body.dataset.focusNode || 0),
      };

    case "stack":
      return { ...BASE, path: PATHS.page, emphasis: "network", content: stackNodes(),
               scale: 0.62, offset: [7.2, -0.8, -4.5] };

    case "experience":
      return { ...BASE, path: PATHS.vertical, emphasis: "structures", content: layerNodes(),
               scale: 0.66, offset: [7.6, -0.5, -4.5] };

    case "impact":
      return { ...BASE, path: PATHS.wide, emphasis: "network", content: [], exposure: 1.04,
               scale: 0.7, offset: [6.0, -1.0, -3.0] };

    case "about":
      return { ...BASE, path: PATHS.inward, emphasis: "core", content: [], scale: 0.55,
               offset: [6.4, -1.0, -3.0] };

    case "contact":
      return { ...BASE, path: PATHS.inward, emphasis: "core", scale: 0.56, exposure: 1.03,
               offset: [6.0, -1.2, -2.5],
               content: [{ id: "LINK_00", meta: "ESTABLISH CONNECTION", kind: "link", status: "ok" }] };

    case "lab":
      return { ...BASE, path: PATHS.page, emphasis: "network", scale: 0.88, exposure: 1.02,
               offset: [6.6, -0.8, -4.0], content: [] };

    case "404":
    case "error":
      return { ...BASE, path: PATHS.wide, emphasis: "network", scale: 0.72, offset: [5.4, -0.4, -3.0],
               content: [{ id: "NODE_??", meta: "UNREACHABLE", kind: "dead", status: "down" }] };

    default:
      return { ...BASE };
  }
}

/** Which page are we on? Derived from the body id the HTML already carries. */
export function detectPage() {
  const id = document.body.id || "";
  if (id) return id.replace(/Page$/, "").toLowerCase();
  if (document.getElementById("projects") && document.getElementById("impactGrid")) return "home";
  return "home";
}
