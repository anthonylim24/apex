import { Platform, type ViewStyle } from 'react-native';

/**
 * 1st-Pouf clay recipe (pouf.css dark tokens), translated for RN.
 * Inset lip + top highlight + drop. Shadows must not be clipped —
 * keep overflow visible and leave a gutter under stacked cushions.
 */
const webShadow = (value: string): ViewStyle =>
  Platform.OS === 'web' ? ({ boxShadow: value } as ViewStyle) : {};

const drop = (opacity: number, radius: number, height: number): ViewStyle =>
  Platform.OS === 'web'
    ? {}
    : {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height },
        shadowOpacity: opacity,
        shadowRadius: radius,
        elevation: Math.round(height * 0.85),
      };

export const clay = {
  /** Space under a cushion so the drop can finish (1st-Pouf's 28px gutter). */
  gutter: 22,

  card: {
    ...drop(0.52, 32, 20),
    ...webShadow(
      'inset 0 -10px 0 rgba(156,124,220,0.22), inset 0 6px 0 rgba(255,255,255,0.10), 0 24px 48px rgba(0,0,0,0.52)',
    ),
  },
  row: {
    ...drop(0.4, 18, 10),
    ...webShadow(
      'inset 0 -6px 0 rgba(156,124,220,0.18), inset 0 4px 0 rgba(255,255,255,0.08), 0 12px 24px rgba(0,0,0,0.38)',
    ),
  },
  control: {
    ...drop(0.42, 16, 10),
    ...webShadow(
      'inset 0 -6px 0 rgba(0,0,0,0.20), inset 0 4px 0 rgba(255,255,255,0.42), 0 10px 20px rgba(0,0,0,0.38)',
    ),
  },
  controlLg: {
    ...drop(0.5, 22, 14),
    ...webShadow(
      'inset 0 -10px 0 rgba(0,0,0,0.22), inset 0 6px 0 rgba(255,255,255,0.50), 0 16px 28px rgba(0,0,0,0.45)',
    ),
  },
  controlActive: {
    ...drop(0.22, 6, 3),
    ...webShadow(
      'inset 0 -3px 0 rgba(0,0,0,0.18), inset 0 2px 0 rgba(255,255,255,0.32), 0 3px 8px rgba(0,0,0,0.28)',
    ),
  },
  field: {
    ...webShadow(
      'inset 0 -4px 0 rgba(0,0,0,0.28), inset 0 4px 0 rgba(255,255,255,0.06), inset 0 0 0 2px rgba(201,168,255,0.28)',
    ),
  },
  blob: {
    ...drop(0.42, 16, 12),
    ...webShadow(
      'inset 0 -8px 0 rgba(0,0,0,0.16), inset 0 4px 0 rgba(255,255,255,0.48), 0 12px 22px rgba(0,0,0,0.40)',
    ),
  },
  dock: {
    ...drop(0.5, 24, 12),
    ...webShadow(
      'inset 0 8px 0 rgba(255,255,255,0.08), 0 -12px 32px rgba(0,0,0,0.45)',
    ),
  },
} as const;
