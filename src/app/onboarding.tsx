import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useAuthSession } from '@/auth/auth';
import type { Equipment, ExperienceLevel, Goal, MuscleGroup, Profile, Unit } from '@/domain/types';
import { useSaveProfile } from '@/state/queries';
import { AppText, Button, ChipRow, Screen, SegmentedControl } from '@/ui/components/primitives';
import { colors, radius, spacing, touch } from '@/ui/theme';

const GOALS: { value: Goal; label: string; detail: string }[] = [
  { value: 'hypertrophy', label: 'Build muscle', detail: 'Moderate reps, growing volume over time' },
  { value: 'strength', label: 'Get stronger', detail: 'Heavier weights, lower reps, longer rests' },
  { value: 'endurance', label: 'Muscular endurance', detail: 'Higher reps, shorter rests' },
  { value: 'general', label: 'General fitness', detail: 'A balanced mix — great default' },
];

const EXPERIENCE: { value: ExperienceLevel; label: string; detail: string }[] = [
  { value: 'beginner', label: 'Beginner', detail: 'New or returning after a long break' },
  { value: 'intermediate', label: 'Intermediate', detail: 'Consistent training for 6+ months' },
  { value: 'advanced', label: 'Advanced', detail: 'Years of structured training' },
];

const EQUIPMENT: { value: Equipment; label: string }[] = [
  { value: 'barbell', label: 'Barbell' },
  { value: 'dumbbell', label: 'Dumbbells' },
  { value: 'kettlebell', label: 'Kettlebell' },
  { value: 'machine', label: 'Machines' },
  { value: 'cable', label: 'Cables' },
  { value: 'bench', label: 'Bench' },
  { value: 'pullup_bar', label: 'Pull-up bar' },
  { value: 'band', label: 'Bands' },
  { value: 'bodyweight', label: 'Bodyweight only' },
];

const AVOIDABLE: { value: MuscleGroup; label: string }[] = [
  { value: 'shoulders', label: 'Shoulders' },
  { value: 'lower_back', label: 'Lower back' },
  { value: 'quads', label: 'Knees / quads' },
  { value: 'hamstrings', label: 'Hamstrings' },
  { value: 'chest', label: 'Chest' },
  { value: 'glutes', label: 'Hips / glutes' },
];

const SESSION_LENGTHS = [30, 45, 60, 75, 90];

const TOTAL_STEPS = 5;

/**
 * Onboarding wizard. Why each question is asked is stated on-screen —
 * the profile drives generation, progression, and safety filters.
 * Everything is editable later; nothing is dark-patterned.
 */
export default function Onboarding() {
  const router = useRouter();
  const auth = useAuthSession();
  const saveProfile = useSaveProfile();

  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<Goal>('general');
  const [experience, setExperience] = useState<ExperienceLevel>('beginner');
  const [equipment, setEquipment] = useState<Equipment[]>(['bodyweight']);
  const [avoidMuscles, setAvoidMuscles] = useState<MuscleGroup[]>([]);
  const [limitations, setLimitations] = useState('');
  const [unit, setUnit] = useState<Unit>('kg');
  const [sessionMinutes, setSessionMinutes] = useState(60);
  const [bodyweight, setBodyweight] = useState('');

  const toggle = <T,>(list: T[], value: T): T[] =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const finish = async (): Promise<void> => {
    const nowIso = new Date().toISOString();
    const weight = Number.parseFloat(bodyweight);
    const profile: Profile = {
      userId: auth.userId ?? 'local-user',
      displayName: auth.displayName,
      goal,
      experience,
      equipment,
      limitations,
      avoidMuscles,
      unit,
      preferredSessionMinutes: sessionMinutes,
      bodyweightHistory:
        Number.isFinite(weight) && weight > 0
          ? [{ date: nowIso.slice(0, 10), weightKg: unit === 'kg' ? weight : weight * 0.45359237 }]
          : [],
      onboardingCompletedAt: nowIso,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    await saveProfile.mutateAsync(profile);
    router.replace('/(tabs)');
  };

  return (
    <Screen testID="onboarding-screen">
      <View style={styles.progressRow}>
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <View key={i} style={[styles.progressDot, i <= step && styles.progressDotActive]} />
        ))}
      </View>

      {step === 0 && (
        <View style={styles.step}>
          <AppText variant="title">What are you training for?</AppText>
          <AppText variant="body" color={colors.textSecondary}>
            Your goal sets the rep ranges, rest times, and progression style of every generated
            workout.
          </AppText>
          {GOALS.map((g) => (
            <OptionCard
              key={g.value}
              label={g.label}
              detail={g.detail}
              selected={goal === g.value}
              onPress={() => setGoal(g.value)}
              testID={`onboarding-goal-${g.value}`}
            />
          ))}
        </View>
      )}

      {step === 1 && (
        <View style={styles.step}>
          <AppText variant="title">How experienced are you?</AppText>
          <AppText variant="body" color={colors.textSecondary}>
            This gates exercise difficulty and how aggressively weights progress.
          </AppText>
          {EXPERIENCE.map((e) => (
            <OptionCard
              key={e.value}
              label={e.label}
              detail={e.detail}
              selected={experience === e.value}
              onPress={() => setExperience(e.value)}
              testID={`onboarding-experience-${e.value}`}
            />
          ))}
        </View>
      )}

      {step === 2 && (
        <View style={styles.step}>
          <AppText variant="title">What equipment can you use?</AppText>
          <AppText variant="body" color={colors.textSecondary}>
            Generated workouts only include exercises you can actually do.
          </AppText>
          <ChipRow
            options={EQUIPMENT}
            selected={equipment}
            onToggle={(v) => setEquipment((prev) => toggle(prev, v))}
            testID="onboarding-equipment"
          />
        </View>
      )}

      {step === 3 && (
        <View style={styles.step}>
          <AppText variant="title">Anything we should work around?</AppText>
          <AppText variant="body" color={colors.textSecondary}>
            Optional. Selected areas are excluded from generated workouts. This stays on your
            device and your account — nowhere else.
          </AppText>
          <ChipRow
            options={AVOIDABLE}
            selected={avoidMuscles}
            onToggle={(v) => setAvoidMuscles((prev) => toggle(prev, v))}
            testID="onboarding-avoid"
          />
          <TextInput
            testID="onboarding-limitations"
            style={styles.input}
            placeholder="Notes for yourself, e.g. 'left shoulder impingement'"
            placeholderTextColor={colors.textTertiary}
            value={limitations}
            onChangeText={setLimitations}
            accessibilityLabel="Injury or limitation notes"
          />
        </View>
      )}

      {step === 4 && (
        <View style={styles.step}>
          <AppText variant="title">Preferences</AppText>
          <AppText variant="label" color={colors.textTertiary}>
            Units
          </AppText>
          <SegmentedControl<Unit>
            options={[
              { value: 'kg', label: 'Kilograms (kg)' },
              { value: 'lb', label: 'Pounds (lb)' },
            ]}
            value={unit}
            onChange={setUnit}
            testID="onboarding-unit"
          />
          <AppText variant="label" color={colors.textTertiary}>
            Preferred session length
          </AppText>
          <SegmentedControl<string>
            options={SESSION_LENGTHS.map((m) => ({ value: String(m), label: `${m}m` }))}
            value={String(sessionMinutes)}
            onChange={(v) => setSessionMinutes(Number(v))}
            testID="onboarding-session-length"
          />
          <AppText variant="label" color={colors.textTertiary}>
            Bodyweight (optional)
          </AppText>
          <TextInput
            testID="onboarding-bodyweight"
            style={styles.input}
            placeholder={`Current bodyweight in ${unit}`}
            placeholderTextColor={colors.textTertiary}
            keyboardType="decimal-pad"
            value={bodyweight}
            onChangeText={setBodyweight}
            accessibilityLabel="Bodyweight"
          />
        </View>
      )}

      <View style={styles.nav}>
        {step > 0 ? (
          <Button
            label="Back"
            variant="ghost"
            onPress={() => setStep((s) => s - 1)}
            style={styles.navButton}
            testID="onboarding-back"
          />
        ) : null}
        <Button
          label={step === TOTAL_STEPS - 1 ? 'Start training' : 'Continue'}
          onPress={() => (step === TOTAL_STEPS - 1 ? void finish() : setStep((s) => s + 1))}
          loading={saveProfile.isPending}
          disabled={step === 2 && equipment.length === 0}
          style={styles.navButton}
          testID="onboarding-next"
        />
      </View>
    </Screen>
  );
}

const OptionCard = ({
  label,
  detail,
  selected,
  onPress,
  testID,
}: {
  label: string;
  detail: string;
  selected: boolean;
  onPress: () => void;
  testID?: string;
}) => (
  <View>
    <AppText
      testID={testID}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={[styles.optionCard, selected && styles.optionCardSelected]}
    >
      <AppText variant="bodyBold" color={selected ? colors.accent : colors.text}>
        {label}
        {'\n'}
      </AppText>
      <AppText variant="caption" color={colors.textSecondary}>
        {detail}
      </AppText>
    </AppText>
  </View>
);

const styles = StyleSheet.create({
  progressRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  progressDot: {
    flex: 1,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceRaised,
  },
  progressDotActive: { backgroundColor: colors.accent },
  step: { gap: spacing.md },
  optionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    minHeight: touch.min,
    overflow: 'hidden',
  },
  optionCardSelected: { borderColor: colors.accent, backgroundColor: colors.surfaceRaised },
  input: {
    minHeight: touch.min,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    paddingHorizontal: spacing.lg,
    fontSize: 16,
  },
  nav: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xxl },
  navButton: { flex: 1 },
});
