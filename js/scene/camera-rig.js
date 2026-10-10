/* =============================================================================
   CAMERA RIG — the visitor is standing in the room, not riding a turntable.

   Position comes from four stacked, damped contributions:
     path      where scroll has moved you through the environment
     parallax  a small pointer-driven shift, so the world has depth
     drift     a slow idle breath, so a still page is never a still image
     focus     a nudge toward whatever the page is currently about

   Nothing snaps. Every contribution is critically damped and frame-rate
   independent, so a 144Hz screen and a 30fps laptop see the same motion.
   ============================================================================= */
import { damp, clamp, smooth } from "../core/dom.js";
import { CAMERA }              from "../core/tokens.js";
import { state }               from "../core/state.js";

export function createRig(THREE, camera, path) {
  const pos    = new THREE.Vector3().copy(camera.position);
  const look   = new THREE.Vector3(0, 0.3, 0);
  const wantP  = new THREE.Vector3();
  const wantL  = new THREE.Vector3();
  const focusOffset = new THREE.Vector3();
  const focusTarget = new THREE.Vector3();
  const tmp = new THREE.Vector3();

  let px = 0, py = 0;           // damped pointer
  let progress = 0;             // damped scroll progress
  let focusAmt = 0, focusWant = 0;

  /** Sample the keyframed path at 0..1. */
  function sample(p, outPos, outLook) {
    const k = path;
    let i = 0;
    while (i < k.length - 2 && p > k[i + 1].at) i++;
    const a = k[i], b = k[Math.min(i + 1, k.length - 1)];
    const span = Math.max(1e-5, b.at - a.at);
    const t = smooth(clamp((p - a.at) / span, 0, 1));
    outPos.set(
      a.pos[0] + (b.pos[0] - a.pos[0]) * t,
      a.pos[1] + (b.pos[1] - a.pos[1]) * t,
      a.pos[2] + (b.pos[2] - a.pos[2]) * t
    );
    outLook.set(
      a.look[0] + (b.look[0] - a.look[0]) * t,
      a.look[1] + (b.look[1] - a.look[1]) * t,
      a.look[2] + (b.look[2] - a.look[2]) * t
    );
  }

  sample(0, pos, look);
  camera.position.copy(pos);
  camera.lookAt(look);

  return {
    /** Point the camera toward a world position (a node, the core, nothing). */
    focusOn(v) {
      if (!v) { focusWant = 0; return; }
      focusTarget.copy(v); focusWant = 1;
    },

    update(dt) {
      const reduced = state.flags.reduced;
      const D = 1 - Math.exp(-1.6 * dt);

      progress = damp(progress, state.scroll.progress, 2.4, dt);
      sample(progress, wantP, wantL);

      if (!reduced) {
        px = damp(px, state.pointer.nx, 2.6, dt);
        py = damp(py, state.pointer.ny, 2.6, dt);
        wantP.x += px * CAMERA.parallax.x;
        wantP.y += py * CAMERA.parallax.y;
        wantL.x -= px * 0.5;
        wantL.y -= py * 0.28;

        const t = state.clock.t;
        wantP.x += Math.sin(t * 0.11) * CAMERA.driftAmp;
        wantP.y += Math.sin(t * 0.077 + 1.2) * CAMERA.driftAmp * 0.62;
        wantP.z += Math.sin(t * 0.053 + 2.4) * CAMERA.driftAmp * 0.5;
      }

      focusAmt = damp(focusAmt, focusWant, 1.9, dt);
      if (focusAmt > 0.002) {
        tmp.copy(focusTarget).sub(wantL).multiplyScalar(focusAmt * 0.55);
        wantL.add(tmp);
        focusOffset.copy(focusTarget).normalize().multiplyScalar(focusAmt * 1.6);
        wantP.add(focusOffset);
      }

      pos.lerp(wantP, D);
      look.lerp(wantL, D);
      camera.position.copy(pos);
      camera.lookAt(look);
    },

    get progress() { return progress; },
  };
}
