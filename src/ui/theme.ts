/**
 * Apex × 1st-Pouf — dark claymorphism tokens.
 *
 * Ported from 1st-Pouf's dark theme (pouf.css): plum-black foundations,
 * unchanged pastel accents, ink-on-pastel (`onAccent`), and the clay
 * recipe (top highlight + floor lip + drop). Gym rules still apply:
 * 56–64pt targets, high contrast, one-handed SetLogger.
 *
 * @see https://1st-pouf.worksonmy.dev/docs/
 */

export const tones = {
  pink: '#FFB3D1',
  purple: '#C9A8FF',
  blue: '#9EC8FF',
  mint: '#A8F0D0',
  yellow: '#FFE58A',
  orange: '#FFB38A',
} as const;

export type Tone = keyof typeof tones;

export const colors = {
  bg: '#12111A',
  surface: '#211F2B',
  surfaceRaised: '#2B2838',
  surfacePressed: '#18161F',
  border: 'rgba(201, 168, 255, 0.22)',
  bgTop: '#1A1730',
  surfaceOutline: 'rgba(255, 255, 255, 0.07)',

  text: '#F7F3FF',
  textSecondary: '#B8AFCB',
  textTertiary: '#8E85A8',
  /** Ink that sits ON a pastel fill — stays dark in dark mode. */
  textInverse: '#2A2145',
  onAccent: '#2A2145',
  onAccentMuted: '#493B64',

  /** Primary action = pouf mint (up). */
  accent: tones.mint,
  accentPressed: '#86D4B0',
  accentMuted: 'rgba(168, 240, 208, 0.18)',

  rest: tones.blue,
  active: tones.mint,
  success: tones.mint,
  pr: tones.yellow,
  warning: tones.orange,
  danger: tones.pink,
  dangerMuted: 'rgba(255, 179, 209, 0.16)',

  pink: tones.pink,
  purple: tones.purple,
  blue: tones.blue,
  mint: tones.mint,
  yellow: tones.yellow,
  orange: tones.orange,
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
  sm: 14,
  md: 20,
  lg: 32,
  xl: 24,
  blob: 24,
  full: 999,
} as const;

export const fonts = {
  display: 'Anton_400Regular',
  ui: 'Nunito_800ExtraBold',
  body: 'Nunito_400Regular',
  bodyBold: 'Nunito_700Bold',
} as const;

export const type = {
  displayXl: {
    fontSize: 68,
    fontFamily: fonts.display,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  display: {
    fontSize: 48,
    fontFamily: fonts.display,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 32,
    fontFamily: fonts.ui,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  heading: { fontSize: 20, fontFamily: fonts.ui, fontWeight: '800' },
  body: { fontSize: 16, fontFamily: fonts.body, fontWeight: '400' },
  bodyBold: { fontSize: 16, fontFamily: fonts.bodyBold, fontWeight: '700' },
  caption: { fontSize: 13, fontFamily: fonts.bodyBold, fontWeight: '700' },
  label: {
    fontSize: 12,
    fontFamily: fonts.ui,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
} as const;

export const touch = {
  min: 56,
  setLogger: 64,
  hitSlop: { top: 8, bottom: 8, left: 8, right: 8 },
} as const;

export const motion = {
  fast: 120,
  base: 200,
  slow: 320,
} as const;
