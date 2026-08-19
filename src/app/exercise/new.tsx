import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { Difficulty, Equipment, MovementPattern, MuscleGroup } from '@/domain/types';
import { useSaveCustomExercise } from '@/state/queries';
import { FieldInput } from '@/ui/components/poufKit';
import { AppText, Button, ChipRow, Screen, SegmentedControl } from '@/ui/components/primitives';
import { colors, spacing } from '@/ui/theme';

const MUSCLES: { value: MuscleGroup; label: string }[] = [
  { value: 'chest', label: 'Chest' },
  { value: 'back', label: 'Back' },
  { value: 'lats', label: 'Lats' },
  { value: 'traps', label: 'Traps' },
  { value: 'shoulders', label: 'Shoulders' },
  { value: 'biceps', label: 'Biceps' },
  { value: 'triceps', label: 'Triceps' },
  { value: 'forearms', label: 'Forearms' },
  { value: 'quads', label: 'Quads' },
  { value: 'hamstrings', label: 'Hamstrings' },
  { value: 'glutes', label: 'Glutes' },
  { value: 'calves', label: 'Calves' },
  { value: 'core', label: 'Core' },
  { value: 'lower_back', label: 'Lower back' },
];

const EQUIPMENT: { value: Equipment; label: string }[] = [
  { value: 'barbell', label: 'Barbell' },
  { value: 'dumbbell', label: 'Dumbbell' },
  { value: 'kettlebell', label: 'Kettlebell' },
  { value: 'machine', label: 'Machine' },
  { value: 'cable', label: 'Cable' },
  { value: 'bodyweight', label: 'Bodyweight' },
  { value: 'band', label: 'Band' },
  { value: 'bench', label: 'Bench' },
  { value: 'pullup_bar', label: 'Pull-up bar' },
];

const PATTERNS: { value: MovementPattern; label: string }[] = [
  { value: 'horizontal_push', label: 'H-Push' },
  { value: 'horizontal_pull', label: 'H-Pull' },
  { value: 'vertical_push', label: 'V-Push' },
  { value: 'vertical_pull', label: 'V-Pull' },
  { value: 'squat', label: 'Squat' },
  { value: 'hinge', label: 'Hinge' },
  { value: 'lunge', label: 'Lunge' },
  { value: 'carry', label: 'Carry' },
  { value: 'isolation', label: 'Isolation' },
  { value: 'core', label: 'Core' },
];

/** Create a custom exercise. It joins the library, search, generation
 * (equipment/difficulty aware), and progression like any seed exercise. */
export default function NewExercise() {
  const router = useRouter();
  const save = useSaveCustomExercise();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [primary, setPrimary] = useState<MuscleGroup[]>([]);
  const [secondary, setSecondary] = useState<MuscleGroup[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner');
  const [pattern, setPattern] = useState<MovementPattern>('isolation');

  const toggle = <T,>(list: T[], value: T): T[] =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const valid = name.trim().length >= 3 && primary.length > 0 && equipment.length > 0;

  const submit = async (): Promise<void> => {
    await save.mutateAsync({
      id: `custom-${Date.now().toString(36)}`,
      name: name.trim(),
      description: description.trim() || `Custom exercise: ${name.trim()}`,
      instructions: instructions
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      primaryMuscles: primary,
      secondaryMuscles: secondary.filter((m) => !primary.includes(m)),
      equipment,
      difficulty,
      movementPattern: pattern,
      isCustom: true,
    });
    router.back();
  };

  return (
    <Screen testID="new-exercise-screen">
      <View style={styles.header}>
        <Button label="‹ Cancel" variant="ghost" compact onPress={() => router.back()} testID="new-exercise-cancel" />
      </View>
      <AppText variant="title">Custom exercise</AppText>

      <View style={styles.form}>
        <FieldInput
          testID="new-exercise-name"
          style={styles.input}
          placeholder="Name (e.g. Landmine Press)"
          value={name}
          onChangeText={setName}
          accessibilityLabel="Exercise name"
        />
        <FieldInput
          testID="new-exercise-description"
          style={[styles.input, styles.multiline]}
          placeholder="Short description (optional)"
          value={description}
          onChangeText={setDescription}
          multiline
          accessibilityLabel="Description"
        />
        <FieldInput
          testID="new-exercise-instructions"
          style={[styles.input, styles.multiline]}
          placeholder={'Instructions, one step per line (optional)'}
          value={instructions}
          onChangeText={setInstructions}
          multiline
          accessibilityLabel="Instructions"
        />

        <AppText variant="label" color={colors.textTertiary}>
          Primary muscles *
        </AppText>
        <ChipRow options={MUSCLES} selected={primary} onToggle={(v) => setPrimary((p) => toggle(p, v))} testID="new-exercise-primary" />

        <AppText variant="label" color={colors.textTertiary}>
          Secondary muscles
        </AppText>
        <ChipRow options={MUSCLES} selected={secondary} onToggle={(v) => setSecondary((p) => toggle(p, v))} />

        <AppText variant="label" color={colors.textTertiary}>
          Equipment *
        </AppText>
        <ChipRow options={EQUIPMENT} selected={equipment} onToggle={(v) => setEquipment((p) => toggle(p, v))} testID="new-exercise-equipment" />

        <AppText variant="label" color={colors.textTertiary}>
          Difficulty
        </AppText>
        <SegmentedControl<Difficulty>
          options={[
            { value: 'beginner', label: 'Beginner' },
            { value: 'intermediate', label: 'Intermediate' },
            { value: 'advanced', label: 'Advanced' },
          ]}
          value={difficulty}
          onChange={setDifficulty}
        />

        <AppText variant="label" color={colors.textTertiary}>
          Movement pattern
        </AppText>
        <ChipRow
          options={PATTERNS}
          selected={[pattern]}
          onToggle={(v) => setPattern(v)}
          testID="new-exercise-pattern"
        />

        <Button
          label="Save exercise"
          onPress={() => void submit()}
          disabled={!valid}
          loading={save.isPending}
          testID="new-exercise-save"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', paddingVertical: spacing.md },
  form: { marginTop: spacing.lg, gap: spacing.md },
  input: { minHeight: 56 },
  multiline: { minHeight: 88, textAlignVertical: 'top' },
});
