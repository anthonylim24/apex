/**
 * The coach's voice: short, warm, science-grounded lines. Deterministic
 * selection (day / set index) — personality without variable-reward
 * randomness (see docs/design/intent-audit.md).
 */

export const COACH_NOTES = [
  'Progressive overload works in small steps — 2.5% at a time adds up to a different lifter in a year.',
  'You don\u2019t need failure to grow. One to three reps in reserve does the job, session after session.',
  'Log your effort (RPE). It\u2019s what turns next session\u2019s suggestion from a guess into a plan.',
  'Stalled three sessions in a row? A deload week isn\u2019t retreat — it\u2019s where the progress you earned shows up.',
  'Muscle is built between workouts. Sleep and food are part of the program.',
  'Ten to twenty hard sets per muscle per week is the evidence-backed sweet spot. More isn\u2019t better — better is better.',
  'The best exercise for you is the one you can load, progress, and repeat without pain.',
  'Warm-ups prime the movement; working sets build it. Both matter, only one counts toward volume.',
] as const;

export const restEncouragement = (workingSetsDone: number): string =>
  REST_LINES[workingSetsDone % REST_LINES.length];

const REST_LINES = [
  'Good set. Big breaths.',
  'Shake it out — the next one\u2019s yours.',
  'Strong work. Sip some water.',
  'Recover fully. Quality beats rush.',
  'Stay loose. Same focus next set.',
] as const;

/** Deterministic daily coach's note (rotates by day of year). */
export const coachNoteForDate = (date: Date = new Date()): string => {
  const startOfYear = Date.UTC(date.getUTCFullYear(), 0, 1);
  const dayOfYear = Math.floor((date.getTime() - startOfYear) / 86_400_000);
  return COACH_NOTES[dayOfYear % COACH_NOTES.length];
};

export const greetingForHour = (hour: number): string => {
  if (hour < 5) return 'Late session?';
  if (hour < 12) return 'Morning session?';
  if (hour < 17) return 'Ready to train?';
  if (hour < 22) return 'Evening session?';
  return 'Late session?';
};
