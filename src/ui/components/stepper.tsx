import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing, touch } from '../theme';
import { AppText } from './primitives';

const VALUE_POP = { damping: 16, stiffness: 380, mass: 0.35 } as const;

/**
 * Large-target numeric stepper for in-gym use: 64pt buttons, huge value
 * display, haptic tick on change. Controlled component.
 */
export const Stepper = ({
  label,
  value,
  displayValue,
  step,
  min = 0,
  max = 9999,
  onChange,
  testID,
}: {
  label: string;
  value: number;
  /** Formatted value ("80 kg"); falls back to the raw number. */
  displayValue?: string;
  step: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  testID?: string;
}) => {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const skipMountPop = useRef(true);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  useEffect(() => {
    if (skipMountPop.current) {
      skipMountPop.current = false;
      return;
    }
    if (reducedMotion) return;
    // Reanimated shared values are mutated via `.value`; that is the API.
    // eslint-disable-next-line react-hooks/immutability -- SharedValue
    scale.value = withSequence(withSpring(1.08, VALUE_POP), withSpring(1, VALUE_POP));
  }, [value, reducedMotion, scale]);

  const adjust = (delta: number): void => {
    const next = Math.min(max, Math.max(min, Math.round((value + delta) * 100) / 100));
    if (next !== value) {
      Haptics.selectionAsync();
      onChange(next);
    }
  };

  return (
    <View style={styles.container} testID={testID}>
      <AppText variant="label" color={colors.textTertiary}>
        {label}
      </AppText>
      <View style={styles.row}>
        <Pressable
          testID={testID ? `${testID}-decrement` : undefined}
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${label}`}
          onPress={() => adjust(-step)}
          hitSlop={touch.hitSlop}
          style={({ pressed }) => [styles.stepButton, pressed && styles.stepButtonPressed]}
        >
          <AppText variant="title" color={colors.text}>
            −
          </AppText>
        </Pressable>
        <View style={styles.valueBox} accessibilityRole="text" accessibilityLabel={`${label}: ${displayValue ?? value}`}>
          <Animated.View style={[styles.valuePop, animatedStyle]}>
            <AppText
              variant="display"
              testID={testID ? `${testID}-value` : undefined}
              adjustsFontSizeToFit
              numberOfLines={1}
            >
              {displayValue ?? String(value)}
            </AppText>
          </Animated.View>
        </View>
        <Pressable
          testID={testID ? `${testID}-increment` : undefined}
          accessibilityRole="button"
          accessibilityLabel={`Increase ${label}`}
          onPress={() => adjust(step)}
          hitSlop={touch.hitSlop}
          style={({ pressed }) => [styles.stepButton, pressed && styles.stepButtonPressed]}
        >
          <AppText variant="title" color={colors.text}>
            +
          </AppText>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stepButton: {
    width: touch.setLogger,
    height: touch.setLogger,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonPressed: { backgroundColor: colors.surfacePressed },
  valueBox: { flex: 1, alignItems: 'center', minHeight: touch.setLogger, justifyContent: 'center' },
  valuePop: { alignItems: 'center', justifyContent: 'center', width: '100%' },
});
