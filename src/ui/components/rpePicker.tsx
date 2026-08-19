import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { rpeLabel } from '../../domain/effort';
import { clay } from '../clay';
import { colors, fonts, radius, spacing } from '../theme';
import { AppText } from './primitives';

const RPE_VALUES = [6, 7, 7.5, 8, 8.5, 9, 10] as const;
const RIR_VALUES = [5, 4, 3, 2, 1, 0] as const;

/**
 * Effort picker. RPE and RIR are alternative views of the same scale;
 * the profile decides which the user sees. Optional — a set can be
 * logged without effort, it just lowers suggestion confidence.
 */
export const RpePicker = ({
  mode,
  value,
  onChange,
  testID,
}: {
  mode: 'rpe' | 'rir';
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  testID?: string;
}) => {
  const values: readonly number[] = mode === 'rpe' ? RPE_VALUES : RIR_VALUES;
  const helper =
    value === undefined
      ? 'Optional — how hard was that set?'
      : mode === 'rpe'
        ? rpeLabel(value)
        : rpeLabel(10 - value);

  return (
    <View style={styles.container} testID={testID}>
      <AppText variant="label" color={colors.textTertiary}>
        {mode === 'rpe' ? 'Effort (RPE)' : 'Reps in reserve'}
      </AppText>
      <View style={styles.row}>
        {values.map((v) => {
          const selected = value === v;
          return (
            <Pressable
              key={v}
              testID={testID ? `${testID}-${v}` : undefined}
              accessibilityRole="button"
              accessibilityLabel={`${mode.toUpperCase()} ${v}`}
              accessibilityState={{ selected }}
              onPress={() => {
                Haptics.selectionAsync();
                onChange(selected ? undefined : v);
              }}
              style={[styles.option, selected ? [styles.optionSelected, clay.control] : clay.field]}
            >
              <AppText
                variant="bodyBold"
                color={selected ? colors.textInverse : colors.textSecondary}
                style={selected ? styles.optionNumeral : undefined}
              >
                {v % 1 === 0 ? String(v) : v.toFixed(1)}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      <AppText variant="caption" color={colors.textTertiary}>
        {helper}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.xs },
  option: {
    flex: 1,
    minHeight: 56,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionSelected: { backgroundColor: colors.mint, borderColor: colors.mint },
  optionNumeral: {
    fontFamily: fonts.display,
    fontWeight: '400',
  },
});
