import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { rpeLabel } from '../../domain/effort';
import { clay } from '../clay';
import { colors, fonts, radius, spacing, touch } from '../theme';
import { AppText } from './primitives';

const RPE_VALUES = [6, 7, 7.5, 8, 8.5, 9, 10] as const;
const RIR_VALUES = [5, 4, 3, 2, 1, 0] as const;

/**
 * Effort as a clay stepper-slider — same 64pt ± language as weight/reps,
 * with a recessed pouf track in the middle. Optional: step off the low
 * end, or tap the selected tick, to clear. Tick testIDs stay one-tap.
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
  const selectedIndex = value === undefined ? -1 : values.indexOf(value);
  const helper =
    value === undefined
      ? 'Optional — how hard was that set?'
      : mode === 'rpe'
        ? rpeLabel(value)
        : rpeLabel(10 - value);
  const fillPct = selectedIndex < 0 ? 0 : (selectedIndex / (values.length - 1)) * 100;
  const readout =
    value === undefined ? '—' : value % 1 === 0 ? String(value) : value.toFixed(1);

  const commit = (next: number | undefined): void => {
    Haptics.selectionAsync();
    onChange(next);
  };

  const stepBy = (dir: -1 | 1): void => {
    if (selectedIndex < 0) {
      commit(dir > 0 ? values[0] : values[values.length - 1]);
      return;
    }
    const next = selectedIndex + dir;
    if (next < 0) {
      commit(undefined);
      return;
    }
    if (next >= values.length) return;
    commit(values[next]);
  };

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.heading}>
        <AppText variant="label" color={colors.textTertiary}>
          {mode === 'rpe' ? 'Effort (RPE)' : 'Reps in reserve'}
        </AppText>
        <AppText
          variant="heading"
          color={value === undefined ? colors.textTertiary : colors.mint}
          testID={testID ? `${testID}-value` : undefined}
        >
          {readout}
        </AppText>
      </View>
      <View style={styles.row}>
        <Pressable
          testID={testID ? `${testID}-decrement` : undefined}
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${mode.toUpperCase()}`}
          onPress={() => stepBy(-1)}
          hitSlop={touch.hitSlop}
          style={({ pressed }) => [
            styles.stepButton,
            pressed ? styles.stepButtonPressed : styles.stepButtonRaised,
          ]}
        >
          <AppText variant="title" color={colors.onAccent}>
            −
          </AppText>
        </Pressable>
        <View style={[styles.track, clay.field]}>
          <View style={[styles.fill, { width: `${fillPct}%` }]} />
          <View
            pointerEvents="none"
            style={[
              styles.thumb,
              clay.control,
              { left: `${fillPct}%`, opacity: selectedIndex < 0 ? 0 : 1 },
            ]}
          />
          <View style={styles.ticks}>
            {values.map((v) => {
              const selected = value === v;
              return (
                <Pressable
                  key={v}
                  testID={testID ? `${testID}-${v}` : undefined}
                  accessibilityRole="button"
                  accessibilityLabel={`${mode.toUpperCase()} ${v}`}
                  accessibilityState={{ selected }}
                  onPress={() => commit(value === v ? undefined : v)}
                  hitSlop={touch.hitSlop}
                  style={styles.tick}
                >
                  <AppText
                    variant="caption"
                    color={selected ? colors.onAccent : colors.textSecondary}
                    style={selected ? styles.tickOn : undefined}
                  >
                    {v % 1 === 0 ? String(v) : v.toFixed(1)}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>
        <Pressable
          testID={testID ? `${testID}-increment` : undefined}
          accessibilityRole="button"
          accessibilityLabel={`Increase ${mode.toUpperCase()}`}
          onPress={() => stepBy(1)}
          hitSlop={touch.hitSlop}
          style={({ pressed }) => [
            styles.stepButton,
            pressed ? styles.stepButtonPressed : styles.stepButtonRaised,
          ]}
        >
          <AppText variant="title" color={colors.onAccent}>
            +
          </AppText>
        </Pressable>
      </View>
      <AppText variant="caption" color={colors.textTertiary}>
        {helper}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  heading: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stepButton: {
    width: touch.setLogger,
    height: touch.setLogger,
    borderRadius: radius.md,
    backgroundColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonRaised: clay.control,
  stepButtonPressed: { ...clay.controlActive, backgroundColor: colors.pink },
  track: {
    flex: 1,
    position: 'relative',
    minHeight: touch.setLogger,
    borderRadius: radius.full,
    backgroundColor: colors.surfacePressed,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.purple,
    borderRadius: radius.full,
  },
  thumb: {
    position: 'absolute',
    width: 22,
    height: 22,
    marginLeft: -11,
    borderRadius: 11,
    backgroundColor: colors.surface,
    zIndex: 2,
  },
  ticks: {
    flexDirection: 'row',
    zIndex: 3,
  },
  tick: {
    flex: 1,
    minHeight: touch.setLogger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickOn: {
    fontFamily: fonts.display,
    fontWeight: '400',
    color: colors.onAccent,
  },
});
