"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/* ===========================================================================
   ScrollRunner — a sprinting stick figure that crosses the top of the viewport
   as the reader scrolls.

   Jesse sells loopscholing: he is paid to correct how people run. A figure with
   sloppy mechanics on his own homepage argues against him, so the skeleton below
   is built from his own copy rather than from a cartoon of running:

     "de voet waarop je landt recht neerzet en onder je lichaam plaatst.
      Het onderbeen hangt dan recht naar beneden."      -> no overstriding
     "je voet af te wikkelen over de grote teen"        -> plantarflexed toe-off
     "zwaait je onderbeen ... naar boven richting het zitvlak"
                                                        -> heel recovers under the glute
     "de armen bewegen tegengesteld aan de benen"       -> opposite arm, opposite leg
     "de ellebogen zijn licht gebogen ... de romphouding
      is rechtop of licht voorover"                     -> ~90 degree elbows, tall trunk

   The figure is a joint model (hip - knee - ankle - toe, shoulder - elbow - hand)
   driven by the pose tables further down. Every frame is interpolated from those
   tables, so the mechanics can be corrected by eye later by editing a number
   instead of redrawing artwork.

   Behaviour: his horizontal position is scroll progress through the document,
   and his stride phase is a pure function of that horizontal position — he only
   takes a step when the page actually moves. Nothing runs on a timer, so he
   never sprints on the spot, and a reader who lands mid-page (restored scroll,
   hash link) gets the correct position and the correct pose on the first frame.
   =========================================================================== */

/* ---- coordinate conventions ----------------------------------------------
   Every joint angle is degrees measured from "straight down", turning positive
   toward the running direction (+x). SVG's y axis points down, so the unit
   vector for an angle is (sin, cos): 0 = down, +90 = forward, 180 = up.

   Lengths are in figure units where a standing body is ~100 tall (crown to
   ground) and the hip sits 52 above the ground. Those are real human ratios,
   which is what keeps the poses honest at any pixel size.
--------------------------------------------------------------------------- */
const DEG = Math.PI / 180;

type Pt = { x: number; y: number };

function seg(from: Pt, deg: number, len: number): Pt {
  const r = deg * DEG;
  return { x: from.x + Math.sin(r) * len, y: from.y + Math.cos(r) * len };
}

const THIGH = 25; // hip -> knee
const SHANK = 22; // knee -> ankle
const FOOT = 8; // ankle -> ball of the foot (a sprinter contacts here, never the heel)
const TORSO = 30; // hip -> shoulder
const UPPER_ARM = 20; // shoulder -> elbow
const FOREARM = 17; // elbow -> hand
const HEAD_CY = 42; // hip -> centre of the head
const HEAD_R = 8;

/** Ground line in figure units. The hip floats above it; see hipHeight(). */
const GROUND_Y = 52;

/**
 * Lean from the ankles, not folded at the waist: the whole body line rotates
 * about the ground contact, so ankle - hip - shoulder - head stays one straight
 * tall line tipped ~5 degrees into the run.
 */
const LEAN = 5;

/* ---- the stride cycle -----------------------------------------------------
   Phase 0..1 is one full cycle of the RIGHT leg, starting at touchdown. The
   left leg samples the same table half a cycle later; each arm samples ARM_KEYS
   at its own leg's phase (see the note on that table for the opposition).

   thigh — hip angle, + = knee driven forward
   knee  — flexion, 0 = straight, larger = heel folding toward the glute
   ankle — 90 = foot square to the shin, >90 dorsiflexed (toes pulled up),
           <90 plantarflexed (toes pointed)
--------------------------------------------------------------------------- */
type LegPose = { thigh: number; knee: number; ankle: number };

const LEG_KEYS: readonly (LegPose & { t: number })[] = [
  // TOUCHDOWN. Ball of the foot lands under the body with the shin hanging back
  // from the knee (-8 degrees) and the knee already soft at 26 degrees. This is
  // the anti-overstride frame: a straight leg reaching out in front is the fault
  // Jesse is hired to remove, so it is not reachable from this table.
  { t: 0.0, thigh: 18, knee: 26, ankle: 82 },

  // MIDSTANCE. Deepest knee flexion, hip at its lowest, shin rotating over a
  // planted forefoot (ankle dorsiflexing to 100 as the heel settles).
  { t: 0.11, thigh: 16, knee: 40, ankle: 100 },

  // TOE-OFF. Hip extended behind and the ankle driven to 45 — "afwikkelen over
  // de grote teen". The knee keeps 25 degrees of flex: a sprinter never locks it
  // straight to push. Ground contact ends here.
  { t: 0.22, thigh: -14, knee: 25, ankle: 45 },

  // FOLD. The knee collapses to 100 degrees within a fifth of a step of leaving
  // the ground. A leg that stays long behind is the classic recreational fault —
  // it is slow to bring through — so the fold has to happen this fast.
  { t: 0.28, thigh: -14, knee: 100, ankle: 92 },

  // HEEL RECOVERY. Knee at its most flexed, which puts the heel close under the
  // glute: a short lever the hip can swing through quickly.
  { t: 0.35, thigh: -12, knee: 142, ankle: 100 },

  // SWING-THROUGH. Knee leads, heel still tucked, foot dorsiflexed. This frame
  // coincides with the other foot's touchdown.
  { t: 0.5, thigh: 12, knee: 136, ankle: 104 },

  // MAX KNEE DRIVE. Front thigh reaches roughly horizontal (78 degrees) with the
  // shin hanging back under the knee and the toes pulled up hard.
  { t: 0.62, thigh: 78, knee: 95, ankle: 108 },

  // UNFOLDING. Thigh starts down, knee opens only part way — the shin is allowed
  // to fall, never thrown out in front.
  { t: 0.78, thigh: 50, knee: 70, ankle: 106 },

  // PRE-CONTACT. Shin vertical, foot at its furthest forward and dorsiflexed,
  // now sweeping backwards under the body ("negative foot speed") so the next
  // touchdown lands under the centre of mass rather than ahead of it.
  { t: 0.9, thigh: 32, knee: 28, ankle: 104 },
];

/**
 * Arm cycle, indexed by the phase of the leg on the SAME side. That is where
 * "opposite arm to opposite leg" lives: an arm is at the front of its swing when
 * its own leg is behind at toe-off, and at the back of its swing when its own leg
 * is at max knee drive — so the forward hand always belongs with the forward knee
 * on the other side.
 *
 * Shoulder angle only ever moves front-to-back in the sagittal plane, so the arms
 * cannot cross the body. The elbow closes on the way up and opens on the way back,
 * which is what real sprint arm action does; it never leaves the ~90 degree range.
 */
type ArmPose = { shoulder: number; elbow: number };

const ARM_KEYS: readonly (ArmPose & { t: number })[] = [
  { t: 0.0, shoulder: 2, elbow: 84 }, // passing the hip, swinging forward
  { t: 0.25, shoulder: 42, elbow: 95 }, // front of the swing: hand up at chin height, elbow closed
  { t: 0.5, shoulder: -6, elbow: 88 }, // passing the hip, the textbook ~90 degree elbow
  { t: 0.75, shoulder: -48, elbow: 72 }, // back of the swing: hand driven past the hip, elbow opens
];

/** Fraction of the cycle each foot spends on the ground (short, as in a sprint). */
const CONTACT = 0.22;
const FLIGHT = 0.5 - CONTACT;
/** Extra hip rise at the top of the flight arc, in figure units. */
const FLIGHT_LIFT = 2.6;

function keyIndex(keys: readonly { t: number }[], t: number): number {
  let i = keys.length - 1;
  for (let k = 0; k < keys.length; k++) if (t >= keys[k].t) i = k;
  return i;
}

function blend(keys: readonly { t: number }[], t: number) {
  const i = keyIndex(keys, t);
  const a = keys[i];
  const b = keys[(i + 1) % keys.length];
  const span = (b.t - a.t + 1) % 1 || 1;
  const u = ((((t - a.t) % 1) + 1) % 1) / span;
  return { i, j: (i + 1) % keys.length, u };
}

function legAt(t: number): LegPose {
  const { i, j, u } = blend(LEG_KEYS, t);
  const a = LEG_KEYS[i];
  const b = LEG_KEYS[j];
  return {
    thigh: a.thigh + (b.thigh - a.thigh) * u,
    knee: a.knee + (b.knee - a.knee) * u,
    ankle: a.ankle + (b.ankle - a.ankle) * u,
  };
}

function armAt(t: number): ArmPose {
  const { i, j, u } = blend(ARM_KEYS, t);
  const a = ARM_KEYS[i];
  const b = ARM_KEYS[j];
  return {
    shoulder: a.shoulder + (b.shoulder - a.shoulder) * u,
    elbow: a.elbow + (b.elbow - a.elbow) * u,
  };
}

function legJoints(hip: Pt, p: LegPose) {
  const knee = seg(hip, p.thigh, THIGH);
  const shank = p.thigh - p.knee; // flexion swings the shin backwards from the thigh
  const ankle = seg(knee, shank, SHANK);
  const toe = seg(ankle, shank + p.ankle, FOOT);
  return { knee, ankle, toe };
}

function armJoints(shoulder: Pt, p: ArmPose) {
  const elbow = seg(shoulder, p.shoulder, UPPER_ARM);
  const hand = seg(elbow, p.shoulder + p.elbow, FOREARM);
  return { elbow, hand };
}

/** How far below the hip the lowest part of a foot sits, for this leg pose. */
function footDepth(p: LegPose): number {
  const { ankle, toe } = legJoints({ x: 0, y: 0 }, p);
  return Math.max(ankle.y, toe.y);
}

const H_TOUCHDOWN = footDepth(LEG_KEYS[0]);
const H_TOEOFF = footDepth(legAt(CONTACT));

/**
 * Hip height above the ground line. During contact it is derived from the stance
 * leg itself, so the planted foot really sits on the ground; between contacts it
 * follows a flight arc that lifts the hip clear, which is what makes this a run
 * and not a walk — for 56% of every cycle both feet are off the ground.
 */
function hipHeight(t: number): number {
  const s = t < 0.5 ? t : t - 0.5; // phase within the current step
  if (s < CONTACT) return footDepth(legAt(s));
  const u = (s - CONTACT) / FLIGHT;
  return H_TOEOFF + (H_TOUCHDOWN - H_TOEOFF) * u + FLIGHT_LIFT * 4 * u * (1 - u);
}

const xy = (p: Pt) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
const poly = (...pts: Pt[]) => `M${pts.map(xy).join("L")}`;

type Frame = { far: string; near: string; head: Pt };

/** Build one frame of the skeleton. Phase 0..1, 0 = right foot touchdown. */
function buildFrame(phase: number): Frame {
  const other = (phase + 0.5) % 1;

  const hip: Pt = { x: 0, y: GROUND_Y - hipHeight(phase) };
  const shoulder: Pt = { x: hip.x, y: hip.y - TORSO };
  const head: Pt = { x: hip.x, y: hip.y - HEAD_CY };

  const near = legJoints(hip, legAt(phase));
  const far = legJoints(hip, legAt(other));
  // Each arm is driven by its own side's leg phase; ARM_KEYS carries the offset
  // that makes the pairing opposite.
  const nearArm = armJoints(shoulder, armAt(phase));
  const farArm = armJoints(shoulder, armAt(other));

  return {
    head,
    far: `${poly(hip, far.knee, far.ankle, far.toe)}${poly(shoulder, farArm.elbow, farArm.hand)}`,
    near: `${poly(hip, shoulder)}${poly(hip, near.knee, near.ankle, near.toe)}${poly(
      shoulder,
      nearArm.elbow,
      nearArm.hand,
    )}`,
  };
}

/* ---- placement ------------------------------------------------------------ */

/**
 * Drawn height of the figure, crown to ground, in CSS pixels. Sized so that he
 * fits entirely inside the header bar, below its tallest content — that band is
 * the one strip of the page guaranteed to be dark on every route, which is what
 * lets a single light monochrome stroke read everywhere without a halo or a
 * blend mode. Growing him means overlapping either the nav or the page content.
 */
const FIG_PX = 17;
const UNIT = FIG_PX / 100;
/** One full cycle (two steps) covers this much screen travel — ~2.2 body heights. */
const STRIDE = FIG_PX * 2.2;
/** Clear of the viewport edges so he never runs off the side. */
const PAD = 10;
/**
 * Ground line sits this far below the measured header height, i.e. on the
 * header's own bottom rule, which becomes the track he runs on. Together with
 * FIG_PX this puts his crown ~2px below the bottom of the Aanmelden button (the
 * tallest thing in the 78px bar) so he crosses the full width without ever
 * touching the logo, a nav item or the CTA.
 */
const GROUND_GAP = 1;
/** Fallback header height if none can be measured. */
const HEADER_FALLBACK = 78;
/** Below this much scrollable distance a progress indicator means nothing. */
const MIN_SCROLL = 40;
/** The pose held when the reader has asked for reduced motion: max knee drive. */
const STATIC_PHASE = 0.62;

/**
 * The box is sized to hold every reachable pose plus the lean: the trailing toe
 * just after toe-off is the leftmost point, the front hand at full drive the
 * rightmost, and the crown the highest.
 */
const VB_X = -34;
const VB_Y = -50;
const VB_W = 72;
const VB_H = 106;

export default function ScrollRunner() {
  /**
   * Only used to re-run the effect on a client-side navigation: the site, academy
   * and admin shells have different header heights, and a route change inside the
   * root layout would otherwise leave him measured against the old one. Re-running
   * also re-draws synchronously, so a route change lands him in the right place
   * without waiting for a scroll event.
   */
  const pathname = usePathname();
  const svgRef = useRef<SVGSVGElement>(null);
  const farRef = useRef<SVGPathElement>(null);
  const nearRef = useRef<SVGPathElement>(null);
  const headRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    const far = farRef.current;
    const near = nearRef.current;
    const head = headRef.current;
    if (!svg || !far || !near || !head) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let hidden: boolean | null = null;

    /**
     * The site header is `position:fixed` and 78px tall, the academy and admin
     * shells use shorter sticky ones, so the ground line is measured rather than
     * assumed. First fixed-or-sticky `<header>` wins; a plain `<header>` inside an
     * article is skipped. Note that we never mount inside the header itself — it
     * gains `backdrop-filter` when scrolled, which would make it the containing
     * block for a fixed child and squash him into the bar.
     */
    const place = () => {
      let h = HEADER_FALLBACK;
      for (const el of Array.from(document.querySelectorAll("header"))) {
        const pos = getComputedStyle(el).position;
        if (pos === "fixed" || pos === "sticky") {
          h = el.getBoundingClientRect().height;
          break;
        }
      }
      svg.style.top = `${Math.round(h) + GROUND_GAP - (GROUND_Y - VB_Y) * UNIT}px`;
    };

    const draw = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;

      // scrollY / getBoundingClientRect rather than an observer crossing, so an
      // arrival at a restored position or a #hash is already correct on frame one.
      if (max < MIN_SCROLL) {
        if (hidden !== true) {
          svg.style.opacity = "0";
          hidden = true;
        }
        return;
      }
      const p = Math.min(1, Math.max(0, window.scrollY / max));
      const track = Math.max(0, doc.clientWidth - PAD * 2 - VB_W * UNIT);
      const x = PAD + p * track;

      // Stride phase is a pure function of distance travelled, never of time:
      // stand still and he stands still; scroll back up and the cycle rewinds.
      const phase = reduced.matches ? STATIC_PHASE : ((x / STRIDE) % 1 + 1) % 1;
      const frame = buildFrame(phase);

      far.setAttribute("d", frame.far);
      near.setAttribute("d", frame.near);
      head.setAttribute("cx", frame.head.x.toFixed(1));
      head.setAttribute("cy", frame.head.y.toFixed(1));
      svg.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;

      if (hidden !== false) {
        svg.style.opacity = "";
        hidden = false;
      }
    };

    let raf = 0;
    const request = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        draw();
      });
    };
    const remeasure = () => {
      place();
      request();
    };

    place();
    draw();
    svg.style.visibility = "visible";

    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", remeasure, { passive: true });
    reduced.addEventListener("change", request);
    // Lazy images and fonts change scrollHeight after first paint; without this
    // he would sit at the wrong point on the track until the next scroll event.
    const ro = new ResizeObserver(request);
    ro.observe(document.body);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", remeasure);
      reduced.removeEventListener("change", request);
      ro.disconnect();
    };
  }, [pathname]);

  return (
    <>
      {/* Rendered hidden and revealed by the effect: with no JavaScript he simply
          never appears, and because he is `position:fixed` nothing else moves. */}
      <svg
        ref={svgRef}
        className="runner"
        viewBox={`${VB_X} ${VB_Y} ${VB_W} ${VB_H}`}
        width={VB_W * UNIT}
        height={VB_H * UNIT}
        aria-hidden="true"
        focusable="false"
      >
        <g transform={`rotate(${LEAN} 0 ${GROUND_Y})`}>
          <path ref={farRef} className="runner__far" />
          <path ref={nearRef} className="runner__near" />
          <circle ref={headRef} className="runner__head" r={HEAD_R} cx="0" cy="0" />
        </g>
      </svg>
      <style>{`
        .runner {
          position:fixed; left:0; top:0; z-index:101;
          pointer-events:none; visibility:hidden; overflow:visible;
          will-change:transform;
        }
        .runner__far, .runner__near { fill:none; stroke:var(--paper); stroke-width:7; stroke-linecap:round; stroke-linejoin:round; }
        .runner__near { opacity:.6; }
        .runner__far  { opacity:.26; }
        .runner__head { fill:var(--paper); opacity:.6; }
        @media print { .runner { display:none; } }
      `}</style>
    </>
  );
}
