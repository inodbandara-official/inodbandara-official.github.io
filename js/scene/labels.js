/* =============================================================================
   HOLOGRAPHIC UI — small panels pinned to real positions in the 3D world.

   Text stays DOM: it is crisp at every DPR, it is selectable, it is readable by
   a screen reader if it ever needs to be, and it costs nothing to render. Only
   the position comes from WebGL.

   The copy is deliberately structural — a node id, a tier, a status. It never
   states a fact about a person, a client or a result; anything that carries a
   claim lives in the HTML where it can be checked.
   ============================================================================= */
import { el }    from "../core/dom.js";
import { state } from "../core/state.js";

export function createLabels(THREE, camera, host) {
  const layer = el("div", { class: "holo", "aria-hidden": "true" });
  host.appendChild(layer);

  const items = [];
  const v = new THREE.Vector3();

  function add({ anchor, id, meta, status = "ok", kind = "node", href = null }) {
    const node = el("div", { class: "holo__tag holo__tag--" + kind });
    node.innerHTML =
      '<i class="holo__stem"></i>' +
      '<span class="holo__box">' +
        '<b class="holo__id">' + id + "</b>" +
        (meta ? '<em class="holo__meta">' + meta + "</em>" : "") +
        '<i class="holo__dot" data-s="' + status + '"></i>' +
      "</span>";
    layer.appendChild(node);
    const it = { anchor, node, href, visible: false, strength: 0 };
    items.push(it);
    return it;
  }

  const TAG_W = 210, TAG_H = 22;

  /** `keepOut` is a list of viewport-space rectangles the tags must not enter,
   *  measured from the type itself rather than guessed, so it stays correct at
   *  every breakpoint. A label crossing display type is worse than no label. */
  function update(keepOut = null) {
    const { w, h } = state.view;
    for (const it of items) {
      v.copy(it.anchor).project(camera);
      const behind = v.z > 1;
      const x = (v.x * 0.5 + 0.5) * w;
      const y = (-v.y * 0.5 + 0.5) * h;
      /* the tag body extends to the right of its anchor; test that, not the point */
      let blocked = false;
      if (keepOut) for (const k of keepOut) {
        if (x + TAG_W > k.left && x < k.right && y + TAG_H > k.top && y - TAG_H < k.bottom) {
          blocked = true; break;
        }
      }
      const onscreen = !behind && x > -10 && x < w + 80 && y > -60 && y < h + 60;
      const on = onscreen && !blocked;
      if (on !== it.visible) {
        it.visible = on;
        it.node.classList.toggle("on", on);
      }
      /* Position is kept current for anything on screen, blocked or not: a tag
         suppressed behind the headline still becomes visible when its node is
         hovered, and it must appear at the node — not at wherever it was when
         it was last allowed to draw. */
      if (!onscreen) continue;
      it.node.style.transform = "translate3d(" + Math.round(x) + "px," + Math.round(y) + "px,0)";
      /* nearer tags read stronger; far ones recede into the atmosphere */
      it.node.style.setProperty("--z", String(Math.max(0.25, 1 - (v.z + 0.2) * 0.9).toFixed(3)));
    }
  }

  function setActive(it, on) { it?.node.classList.toggle("hot", !!on); }
  function clear() { items.length = 0; layer.innerHTML = ""; }
  function dispose() { layer.remove(); }

  return { add, update, setActive, clear, dispose, layer };
}
