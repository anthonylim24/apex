import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { SetLog, Unit } from '../../domain/types';
import { formatWeight, toDisplayWeight } from '../../domain/units';
import { clay } from '../clay';
import { colors, radius, spacing } from '../theme';
import { AppText, Button } from './primitives';
import { RpePicker } from './rpePicker';
import { Stepper } from './stepper';

export interface SetDraft {
  weightKg: number;
  reps: number;
  effort?: number; // RPE or RIR depending on mode
  isWarmup: boolean;
  isFailure: boolean;
  isDropSet: boolean;
}

/**
 * SetLogger — the single most important surface in the app.
 *
 * Design intent (docs/design/design-system.md#setlogger):
 * - Everything reachable with one thumb; controls >= 64pt.
 * - Previous performance is always visible next to the inputs, never a
 *   tap away ("Last: 80 kg x 8 @ RPE 7").
 * - Values pre-filled from last session / suggestion — logging a repeat
 *   set is a single tap on LOG SET.
 * - Failure / drop-set tagging is one tap, never a modal.
 * - Effort entry is optional and never blocks logging.
 */
export const SetLogger = ({
  setNumber,
  draft,
  previous,
  unit,
  effortMode,
  weightStep,
  onChange,
  onLog,
  testID = 'set-logger',
}: {
  setNumber: number;
  draft: SetDraft;
  previous?: Pick<SetLog, 'weightKg' | 'reps' | 'rpe' | 'rir'>;
  unit: Unit;
  effortMode: 'rpe' | 'rir';
  weightStep: number;
  onChange: (draft: SetDraft) => void;
  onLog: () => void;
  testID?: string;
}) => {
  const previousCue = previous
    ? `Last time: ${formatWeight(previous.weightKg, unit)} × ${previous.reps}${
        previous.rpe !== undefined
          ? ` @ RPE ${previous.rpe}`
          : previous.rir !== undefined
            ? ` @ ${previous.rir} RIR`
            : ''
      }`
    : 'First time — start light and log how it feels';

  const toggle = (key: 'isWarmup' | 'isFailure' | 'isDropSet'): void => {
    Haptics.selectionAsync();
    onChange({ ...draft, [key]: !draft[key] });
  };

  const displayWeight = toDisplayWeight(draft.weightKg, unit);

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.header}>
        <AppText variant="title">
          {draft.isWarmup ? `Warm-up set` : `Set ${setNumber}`}
        </AppText>
        <AppText
          variant="caption"
          color={colors.textSecondary}
          testID={`${testID}-previous`}
          accessibilityLabel={previousCue}
        >
          {previousCue}
        </AppText>
      </View>

      <Stepper
        label={`Weight (${unit})`}
        value={displayWeight}
        displayValue={`${Math.round(displayWeight * 10) / 10}`}
        step={weightStep}
        onChange={(displayValue) =>
          onChange({
            ...draft,
            weightKg: unit === 'kg' ? displayValue : displayValue * 0.45359237,
          })
        }
        testID={`${testID}-weight`}
      />

      <Stepper
        label="Reps"
        value={draft.reps}
        step={1}
        min={0}
        max={100}
        onChange={(reps) => onChange({ ...draft, reps })}
        testID={`${testID}-reps`}
      />

      <RpePicker
        mode={effortMode}
        value={draft.effort}
        onChange={(effort) => onChange({ ...draft, effort })}
        testID={`${testID}-effort`}
      />

      <View style={styles.tagRow}>
        <TagToggle
          label="Warm-up"
          active={draft.isWarmup}
          fill={colors.blue}
          onPress={() => toggle('isWarmup')}
          testID={`${testID}-tag-warmup`}
        />
        <TagToggle
          label="To failure"
          active={draft.isFailure}
          fill={colors.orange}
          onPress={() => toggle('isFailure')}
          testID={`${testID}-tag-failure`}
        />
        <TagToggle
          label="Drop set"
          active={draft.isDropSet}
          fill={colors.yellow}
          onPress={() => toggle('isDropSet')}
          testID={`${testID}-tag-dropset`}
        />
      </View>

      <Button
        label="Log set"
        onPress={() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onLog();
        }}
        disabled={draft.reps <= 0}
        style={styles.logButton}
        testID={`${testID}-log`}
        accessibilityHint="Saves this set and starts the rest timer"
      />
    </View>
  );
};

const TagToggle = ({
  label,
  active,
  fill,
  onPress,
  testID,
}: {
  label: string;
  active: boolean;
  fill: string;
  onPress: () => void;
  testID?: string;
}) => (
  <Pressable
    testID={testID}
    accessibilityRole="switch"
    accessibilityLabel={label}
    accessibilityState={{ checked: active }}
    onPress={onPress}
    style={[
      styles.tag,
      active ? clay.control : clay.field,
      { backgroundColor: active ? fill : colors.surface },
    ]}
  >
    <AppText variant="caption" color={active ? colors.onAccent : colors.textSecondary}>
      {label}
    </AppText>
  </Pressable>
);

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  header: { gap: spacing.xs },
  tagRow: { flexDirection: 'row', gap: spacing.sm },
  tag: {
    flex: 1,
    minHeight: 56,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logButton: { minHeight: 72 },
});
