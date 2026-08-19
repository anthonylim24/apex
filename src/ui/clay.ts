import { Platform, type ViewStyle } from 'react-native';

/**
 * 1st-Pouf clay recipe, translated for React Native.
 * Web gets the real inset + drop stack. Native gets a drop + painted lip.
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
        elevation: Math.round(height * 0.7),
      };

export const clay = {
  card: {
    ...drop(0.38, 20, 14),
    ...webShadow(
      'inset 0 -10px 0 rgba(156,124,220,0.16), inset 0 6px 0 rgba(255,255,255,0.07), 0 20px 40px rgba(0,0,0,0.38)',
    ),
  },
  row: {
    ...drop(0.3, 12, 8),
    ...webShadow(
      'inset 0 -6px 0 rgba(156,124,220,0.14), inset 0 4px 0 rgba(255,255,255,0.06), 0 8px 18px rgba(0,0,0,0.3)',
    ),
  },
  control: {
    ...drop(0.34, 12, 8),
    ...webShadow(
      'inset 0 -6px 0 rgba(0,0,0,0.18), inset 0 4px 0 rgba(255,255,255,0.35), 0 8px 16px rgba(0,0,0,0.34)',
    ),
  },
  controlActive: {
    ...drop(0.3, 8, 4),
    ...webShadow(
      'inset 0 -3px 0 rgba(0,0,0,0.18), inset 0 2px 0 rgba(255,255,255,0.35), 0 4px 10px rgba(0,0,0,0.3)',
    ),
  },
  field: {
    ...webShadow(
      'inset 0 -4px 0 rgba(0,0,0,0.25), inset 0 4px 0 rgba(255,255,255,0.05), inset 0 0 0 2px rgba(201,168,255,0.22)',
    ),
  },
  blob: {
    ...drop(0.34, 14, 10),
    ...webShadow(
      'inset 0 -8px 0 rgba(0,0,0,0.15), inset 0 4px 0 rgba(255,255,255,0.4), 0 10px 20px rgba(0,0,0,0.34)',
    ),
  },
} as const;
