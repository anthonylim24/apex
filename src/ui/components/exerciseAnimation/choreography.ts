import type { MovementPattern } from '../../../domain/types';

/**
 * Procedural exercise-demonstration choreography.
 *
 * Each movement pattern is a set of keyframed poses for a consistent
 * side-view line-art character on a 200x200 stage (ground at y=178).
 * Poses follow the animation style guide: coached range of motion,
 * 2.4 s rep loop with eccentric emphasis, seamless looping.
 *
 * Coordinates are hand-tuned keyframes; rendering interpolates between
 * them with sine easing, which keeps limb lengths visually stable for
 * the small pose deltas used here.
 */

export type Pt = readonly [number, number];

export interface FigurePose {
  shoulder: Pt;
  hip: Pt;
  elbow: Pt;
  wrist: Pt;
  kneeNear: Pt;
  ankleNear: Pt;
  /** Far-side limbs default to mirroring the near side with a slight offset. */
  kneeFar?: Pt;
  ankleFar?: Pt;
  elbowFar?: Pt;
  wristFar?: Pt;
  /** Where held equipment is drawn (usually at/near the wrist). */
  equipment?: Pt;
}

export interface Keyframe {
  /** Position in the loop, 0..1. First frame must be at 0; a copy of it is
   * implied at 1 so every loop closes seamlessly. */
  at: number;
  pose: FigurePose;
}

export interface Choreography {
  frames: Keyframe[];
  /** Static stage props. */
  bench?: boolean;
  overheadBar?: boolean;
  /** One full rep, in ms. Style guide default: 2400. */
  durationMs?: number;
}

/** Standing rest pose used as the base for upright patterns. */
const STAND: FigurePose = {
  shoulder: [100, 80],
  hip: [100, 120],
  elbow: [103, 102],
  wrist: [104, 124],
  kneeNear: [100, 150],
  ankleNear: [100, 178],
  equipment: [104, 126],
};

export const CHOREOGRAPHIES: Record<MovementPattern, Choreography> = {
  squat: {
    frames: [
      // Standing tall, bar racked behind the shoulders, hands gripping back.
      {
        at: 0,
        pose: {
          ...STAND,
          elbow: [88, 98],
          wrist: [87, 82],
          equipment: [90, 79],
        },
      },
      // Bottom: hips back and down, knees forward, torso leaning slightly.
      {
        at: 0.45,
        pose: {
          shoulder: [97, 112],
          hip: [86, 150],
          elbow: [83, 130],
          wrist: [82, 114],
          equipment: [86, 111],
          kneeNear: [113, 152],
          ankleNear: [100, 178],
        },
      },
      { at: 0.55, pose: {
          shoulder: [97, 112],
          hip: [86, 150],
          elbow: [83, 130],
          wrist: [82, 114],
          equipment: [86, 111],
          kneeNear: [113, 152],
          ankleNear: [100, 178],
        },
      },
      {
        at: 0.95,
        pose: {
          ...STAND,
          elbow: [88, 98],
          wrist: [87, 82],
          equipment: [90, 79],
        },
      },
    ],
  },

  hinge: {
    frames: [
      // Standing with the bar at the thighs.
      {
        at: 0,
        pose: {
          ...STAND,
          elbow: [103, 102],
          wrist: [104, 126],
          equipment: [104, 128],
        },
      },
      // Hinged: hips back, flat torso, bar slides down the legs.
      {
        at: 0.45,
        pose: {
          shoulder: [124, 106],
          hip: [88, 130],
          elbow: [124, 128],
          wrist: [123, 150],
          kneeNear: [98, 152],
          ankleNear: [100, 178],
          equipment: [123, 152],
        },
      },
      { at: 0.55, pose: {
          shoulder: [124, 106],
          hip: [88, 130],
          elbow: [124, 128],
          wrist: [123, 150],
          kneeNear: [98, 152],
          ankleNear: [100, 178],
          equipment: [123, 152],
        },
      },
      {
        at: 0.95,
        pose: {
          ...STAND,
          elbow: [103, 102],
          wrist: [104, 126],
          equipment: [104, 128],
        },
      },
    ],
  },

  lunge: {
    frames: [
      // Standing, dumbbells at the sides.
      { at: 0, pose: { ...STAND } },
      // Split: front foot planted forward, rear knee dropping.
      {
        at: 0.45,
        pose: {
          shoulder: [104, 96],
          hip: [104, 136],
          elbow: [107, 118],
          wrist: [108, 140],
          kneeNear: [126, 150],
          ankleNear: [126, 178],
          kneeFar: [90, 162],
          ankleFar: [82, 178],
          equipment: [108, 142],
        },
      },
      { at: 0.55, pose: {
          shoulder: [104, 96],
          hip: [104, 136],
          elbow: [107, 118],
          wrist: [108, 140],
          kneeNear: [126, 150],
          ankleNear: [126, 178],
          kneeFar: [90, 162],
          ankleFar: [82, 178],
          equipment: [108, 142],
        },
      },
      { at: 0.95, pose: { ...STAND } },
    ],
  },

  horizontal_push: {
    bench: true,
    frames: [
      // Lockout above the chest (bar drawn end-on).
      {
        at: 0,
        pose: {
          shoulder: [116, 142],
          hip: [84, 146],
          elbow: [116, 124],
          wrist: [116, 104],
          kneeNear: [66, 154],
          ankleNear: [62, 178],
          equipment: [116, 100],
        },
      },
      // Bar touching mid-chest, elbows ~45 degrees.
      {
        at: 0.45,
        pose: {
          shoulder: [116, 142],
          hip: [84, 146],
          elbow: [103, 136],
          wrist: [114, 132],
          kneeNear: [66, 154],
          ankleNear: [62, 178],
          equipment: [114, 128],
        },
      },
      { at: 0.55, pose: {
          shoulder: [116, 142],
          hip: [84, 146],
          elbow: [103, 136],
          wrist: [114, 132],
          kneeNear: [66, 154],
          ankleNear: [62, 178],
          equipment: [114, 128],
        },
      },
      {
        at: 0.95,
        pose: {
          shoulder: [116, 142],
          hip: [84, 146],
          elbow: [116, 124],
          wrist: [116, 104],
          kneeNear: [66, 154],
          ankleNear: [62, 178],
          equipment: [116, 100],
        },
      },
    ],
  },

  horizontal_pull: {
    frames: [
      // Hinged, arm hanging long under the shoulder.
      {
        at: 0,
        pose: {
          shoulder: [122, 108],
          hip: [88, 130],
          elbow: [122, 130],
          wrist: [121, 152],
          kneeNear: [98, 152],
          ankleNear: [100, 178],
          equipment: [121, 154],
        },
      },
      // Rowed: elbow driven back, bar at the lower ribs.
      {
        at: 0.4,
        pose: {
          shoulder: [122, 108],
          hip: [88, 130],
          elbow: [104, 116],
          wrist: [113, 128],
          kneeNear: [98, 152],
          ankleNear: [100, 178],
          equipment: [113, 130],
        },
      },
      { at: 0.5, pose: {
          shoulder: [122, 108],
          hip: [88, 130],
          elbow: [104, 116],
          wrist: [113, 128],
          kneeNear: [98, 152],
          ankleNear: [100, 178],
          equipment: [113, 130],
        },
      },
      {
        at: 0.95,
        pose: {
          shoulder: [122, 108],
          hip: [88, 130],
          elbow: [122, 130],
          wrist: [121, 152],
          kneeNear: [98, 152],
          ankleNear: [100, 178],
          equipment: [121, 154],
        },
      },
    ],
  },

  vertical_push: {
    frames: [
      // Bar at the front delts.
      {
        at: 0,
        pose: {
          ...STAND,
          elbow: [110, 98],
          wrist: [109, 78],
          equipment: [108, 74],
        },
      },
      // Locked out overhead, biceps by the ears.
      {
        at: 0.4,
        pose: {
          shoulder: [100, 80],
          hip: [100, 120],
          elbow: [103, 60],
          wrist: [102, 40],
          kneeNear: [100, 150],
          ankleNear: [100, 178],
          equipment: [102, 36],
        },
      },
      { at: 0.5, pose: {
          shoulder: [100, 80],
          hip: [100, 120],
          elbow: [103, 60],
          wrist: [102, 40],
          kneeNear: [100, 150],
          ankleNear: [100, 178],
          equipment: [102, 36],
        },
      },
      {
        at: 0.95,
        pose: {
          ...STAND,
          elbow: [110, 98],
          wrist: [109, 78],
          equipment: [108, 74],
        },
      },
    ],
  },

  vertical_pull: {
    overheadBar: true,
    frames: [
      // Dead hang from the bar, slight leg bend.
      {
        at: 0,
        pose: {
          shoulder: [100, 66],
          hip: [100, 106],
          elbow: [101, 52],
          wrist: [102, 38],
          kneeNear: [95, 132],
          ankleNear: [87, 148],
          equipment: [102, 38],
        },
      },
      // Chin over the bar: body risen, elbows driven down.
      {
        at: 0.4,
        pose: {
          shoulder: [100, 46],
          hip: [100, 86],
          elbow: [112, 50],
          wrist: [102, 38],
          kneeNear: [94, 112],
          ankleNear: [86, 128],
          equipment: [102, 38],
        },
      },
      { at: 0.5, pose: {
          shoulder: [100, 46],
          hip: [100, 86],
          elbow: [112, 50],
          wrist: [102, 38],
          kneeNear: [94, 112],
          ankleNear: [86, 128],
          equipment: [102, 38],
        },
      },
      {
        at: 0.95,
        pose: {
          shoulder: [100, 66],
          hip: [100, 106],
          elbow: [101, 52],
          wrist: [102, 38],
          kneeNear: [95, 132],
          ankleNear: [87, 148],
          equipment: [102, 38],
        },
      },
    ],
  },

  isolation: {
    frames: [
      // Standing curl: dumbbell hanging, elbow pinned to the side.
      { at: 0, pose: { ...STAND, elbow: [102, 102], wrist: [105, 124], equipment: [106, 126] } },
      // Curled to the shoulder, elbow unmoved.
      {
        at: 0.4,
        pose: {
          ...STAND,
          elbow: [102, 102],
          wrist: [116, 86],
          equipment: [118, 84],
        },
      },
      { at: 0.5, pose: {
          ...STAND,
          elbow: [102, 102],
          wrist: [116, 86],
          equipment: [118, 84],
        },
      },
      { at: 0.95, pose: { ...STAND, elbow: [102, 102], wrist: [105, 124], equipment: [106, 126] } },
    ],
  },

  core: {
    // Plank: a strong straight line with a slow brace "breath".
    durationMs: 3200,
    frames: [
      {
        at: 0,
        pose: {
          shoulder: [74, 142],
          hip: [110, 148],
          elbow: [74, 166],
          wrist: [92, 168],
          kneeNear: [138, 156],
          ankleNear: [164, 168],
        },
      },
      {
        at: 0.5,
        pose: {
          shoulder: [74, 144],
          hip: [110, 151],
          elbow: [74, 166],
          wrist: [92, 168],
          kneeNear: [138, 158],
          ankleNear: [164, 168],
        },
      },
      {
        at: 0.95,
        pose: {
          shoulder: [74, 142],
          hip: [110, 148],
          elbow: [74, 166],
          wrist: [92, 168],
          kneeNear: [138, 156],
          ankleNear: [164, 168],
        },
      },
    ],
  },

  carry: {
    // Farmer's walk: tall torso, alternating stride, weights hanging.
    durationMs: 1600,
    frames: [
      {
        at: 0,
        pose: {
          shoulder: [100, 82],
          hip: [100, 122],
          elbow: [104, 104],
          wrist: [106, 128],
          kneeNear: [114, 148],
          ankleNear: [118, 176],
          kneeFar: [88, 150],
          ankleFar: [82, 178],
          equipment: [106, 132],
        },
      },
      // Mid-stride pass-through.
      {
        at: 0.25,
        pose: {
          shoulder: [100, 80],
          hip: [100, 120],
          elbow: [104, 102],
          wrist: [106, 126],
          kneeNear: [101, 150],
          ankleNear: [100, 178],
          kneeFar: [99, 150],
          ankleFar: [98, 178],
          equipment: [106, 130],
        },
      },
      {
        at: 0.5,
        pose: {
          shoulder: [100, 82],
          hip: [100, 122],
          elbow: [104, 104],
          wrist: [106, 128],
          kneeNear: [88, 150],
          ankleNear: [82, 178],
          kneeFar: [114, 148],
          ankleFar: [118, 176],
          equipment: [106, 132],
        },
      },
      {
        at: 0.75,
        pose: {
          shoulder: [100, 80],
          hip: [100, 120],
          elbow: [104, 102],
          wrist: [106, 126],
          kneeNear: [99, 150],
          ankleNear: [98, 178],
          kneeFar: [101, 150],
          ankleFar: [100, 178],
          equipment: [106, 130],
        },
      },
    ],
  },
};

/** Sine ease-in-out — smooth, organic, no bounce. */
const easeInOutSine = (t: number): number => -(Math.cos(Math.PI * t) - 1) / 2;

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

const lerpPt = (a: Pt, b: Pt, t: number): Pt => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

const resolveFar = (pose: FigurePose): Required<Pick<FigurePose, 'kneeFar' | 'ankleFar'>> => ({
  kneeFar: pose.kneeFar ?? [pose.kneeNear[0] - 5, pose.kneeNear[1]],
  ankleFar: pose.ankleFar ?? [pose.ankleNear[0] - 5, pose.ankleNear[1]],
});

export interface ResolvedPose {
  shoulder: Pt;
  hip: Pt;
  head: Pt;
  elbow: Pt;
  wrist: Pt;
  kneeNear: Pt;
  ankleNear: Pt;
  kneeFar: Pt;
  ankleFar: Pt;
  equipment?: Pt;
}

/** Interpolate the choreography at loop position t (0..1). */
export const poseAt = (choreo: Choreography, t: number): ResolvedPose => {
  const frames = choreo.frames;
  const wrapped = ((t % 1) + 1) % 1;
  // Implicit closing frame: the first pose again at t=1.
  const timeline = [...frames, { at: 1, pose: frames[0].pose }];
  let fromIndex = 0;
  for (let i = 0; i < timeline.length - 1; i += 1) {
    if (wrapped >= timeline[i].at) fromIndex = i;
  }
  const from = timeline[fromIndex];
  const to = timeline[fromIndex + 1];
  const span = to.at - from.at || 1;
  const local = easeInOutSine((wrapped - from.at) / span);

  const a = { ...from.pose, ...resolveFar(from.pose) };
  const b = { ...to.pose, ...resolveFar(to.pose) };

  const shoulder = lerpPt(a.shoulder, b.shoulder, local);
  const hip = lerpPt(a.hip, b.hip, local);
  // Head sits along the torso direction, past the shoulder.
  const dx = shoulder[0] - hip[0];
  const dy = shoulder[1] - hip[1];
  const len = Math.hypot(dx, dy) || 1;
  const head: Pt = [shoulder[0] + (dx / len) * 17, shoulder[1] + (dy / len) * 17];

  return {
    shoulder,
    hip,
    head,
    elbow: lerpPt(a.elbow, b.elbow, local),
    wrist: lerpPt(a.wrist, b.wrist, local),
    kneeNear: lerpPt(a.kneeNear, b.kneeNear, local),
    ankleNear: lerpPt(a.ankleNear, b.ankleNear, local),
    kneeFar: lerpPt(a.kneeFar, b.kneeFar, local),
    ankleFar: lerpPt(a.ankleFar, b.ankleFar, local),
    equipment:
      a.equipment && b.equipment ? lerpPt(a.equipment, b.equipment, local) : a.equipment,
  };
};
