import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';
import { colors, fonts, spacing } from '../theme';
import { AppText } from './primitives';

/** The Apex mark: a rising trend line finishing as a loaded bar —
 * progress, made physical. Mirrors the app icon. */
export const ApexMark = ({ size = 28 }: { size?: number }) => (
  <Svg width={size * 1.4} height={size} viewBox="0 0 56 40">
    <Polyline
      points="4,34 18,20 26,27 44,10"
      fill="none"
      stroke={colors.accent}
      strokeWidth={6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx={46} cy={9} r={5.5} fill="none" stroke={colors.accent} strokeWidth={4} />
  </Svg>
);

export const ApexWordmark = ({ testID = 'apex-wordmark' }: { testID?: string }) => (
  <View style={styles.row} testID={testID} accessibilityLabel="Apex">
    <ApexMark />
    <AppText variant="heading" style={styles.word}>
      APEX
    </AppText>
  </View>
);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  word: {
    fontFamily: fonts.ui,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 3,
    color: colors.text,
  },
});
