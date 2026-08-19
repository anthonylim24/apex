/**
 * Apex design tokens — dark-first, gym-first.
 *
 * Principles (see docs/design/design-system.md):
 * - Near-black backgrounds with high-contrast text for dim gym lighting.
 * - One energetic accent (electric lime) used sparingly for primary
 *   actions; semantic colors for rest/active/success/PR/warning states.
 * - Touch targets >= 56pt (64pt for the SetLogger) for one-handed,
 *   mid-set use with sweaty hands.
 * - Purposeful, fast motion — no bounce.
 */

export const colors = {
  // Surfaces
  bg: '#0A0B0E',
  surface: '#14161B',
  surfaceRaised: '#1C1F26',
  surfacePressed: '#242833',
  border: '#2A2E38',

  // Text (contrast vs bg: 15.9:1, 7.6:1, 4.9:1)
  text: '#F4F6F8',
  textSecondary: '#A9B2BC',
  textTertiary: '#7C8590',
  textInverse: '#0A0B0E',

  // Brand accent — electric lime "energy"
  accent: '#C8F542',
  accentPressed: '#A8D32E',
  accentMuted: '#39401F',

  // Semantic
  rest: '#41C7E0', // rest timer / recovery
  active: '#C8F542', // live set in progress
  success: '#4ADE80',
  pr: '#FFC542', // personal record gold
  warning: '#FFA23E',
  danger: '#FF5C5C',
  dangerMuted: '#3D2226',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export const type = {
  /** Hero numerals in the Workout Player (weight/reps/timer). */
  displayXl: { fontSize: 56, fontWeight: '800', letterSpacing: -1 },
  display: { fontSize: 40, fontWeight: '800', letterSpacing: -0.5 },
  title: { fontSize: 28, fontWeight: '700' },
  heading: { fontSize: 20, fontWeight: '700' },
  body: { fontSize: 16, fontWeight: '400' },
  bodyBold: { fontSize: 16, fontWeight: '700' },
  caption: { fontSize: 13, fontWeight: '500' },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase' },
} as const;

/** Minimum touch target sizes (pt). WCAG 2.2 target-size plus gym margin. */
export const touch = {
  min: 56,
  setLogger: 64,
  hitSlop: { top: 8, bottom: 8, left: 8, right: 8 },
} as const;

/** Motion durations (ms) — gym-energy: fast in, faster out, no bounce. */
export const motion = {
  fast: 120,
  base: 200,
  slow: 320,
} as const;
