import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useAuthSession } from '@/auth/auth';
import type { Equipment, ExperienceLevel, Goal, Profile, Unit } from '@/domain/types';
import { useRepository } from '@/state/appContext';
import { useProfile, useSaveProfile } from '@/state/queries';
import { Avatar, Callout, FieldInput } from '@/ui/components/poufKit';
import { AppText, Button, Card, ChipRow, Screen, SegmentedControl } from '@/ui/components/primitives';
import { colors, spacing } from '@/ui/theme';

const GOALS: { value: Goal; label: string }[] = [
  { value: 'hypertrophy', label: 'Muscle' },
  { value: 'strength', label: 'Strength' },
  { value: 'endurance', label: 'Endurance' },
  { value: 'general', label: 'General' },
];

const EXPERIENCE: { value: ExperienceLevel; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
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
  { value: 'bodyweight', label: 'Bodyweight' },
];

/** Profile & settings: everything from onboarding is editable here.
 * Includes sync status and bodyweight logging. */
export default function ProfileScreen() {
  const auth = useAuthSession();
  const router = useRouter();
  const repo = useRepository();
  const profile = useProfile();
  const saveProfile = useSaveProfile();
  const [pending, setPending] = useState(0);
  const [bodyweightInput, setBodyweightInput] = useState('');

  useEffect(() => {
    let mounted = true;
    const check = async (): Promise<void> => {
      const count = await repo.pendingChanges();
      if (mounted) setPending(count);
    };
    void check();
    const interval = setInterval(() => void check(), 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [repo]);

  const p = profile.data;
  if (!p) {
    return (
      <Screen testID="profile-screen">
        <AppText variant="title" style={styles.title}>
          Profile
        </AppText>
        <Button label="Complete onboarding" onPress={() => router.push('/onboarding')} />
      </Screen>
    );
  }

  const update = (changes: Partial<Profile>): void => {
    saveProfile.mutate({ ...p, ...changes });
  };

  const logBodyweight = (): void => {
    const value = Number.parseFloat(bodyweightInput);
    if (!Number.isFinite(value) || value <= 0) return;
    const weightKg = p.unit === 'kg' ? value : value * 0.45359237;
    update({
      bodyweightHistory: [
        ...p.bodyweightHistory,
        { date: new Date().toISOString().slice(0, 10), weightKg },
      ],
    });
    setBodyweightInput('');
  };

  const goalLabel = GOALS.find((g) => g.value === p.goal)?.label ?? p.goal;
  const experienceLabel = EXPERIENCE.find((e) => e.value === p.experience)?.label ?? p.experience;

  return (
    <Screen testID="profile-screen">
      <View style={styles.masthead}>
        <Avatar
          initials={(p.displayName ?? 'Apex').slice(0, 2)}
          tone="pink"
          size={72}
          testID="profile-avatar"
        />
        <AppText variant="title" style={styles.title}>
          Profile
        </AppText>
      </View>

      <Callout tone={pending > 0 ? 'orange' : 'mint'} title="Sync" testID="profile-sync" style={styles.sync}>
        <AppText variant="caption" color={colors.onAccent}>
          {auth.mode === 'clerk'
            ? 'Signed in — your data syncs to your private account.'
            : 'Local mode — all data stays on this device. Configure Clerk + Supabase to enable account sync.'}
        </AppText>
        <AppText variant="caption" color={colors.onAccent} testID="profile-pending">
          {pending > 0
            ? `${pending} change${pending === 1 ? '' : 's'} waiting to sync`
            : 'All changes saved'}
        </AppText>
        {auth.mode === 'clerk' ? (
          <Button label="Sign out" variant="danger" compact onPress={() => void auth.signOut()} />
        ) : null}
      </Callout>

      <Card style={styles.identityCard}>
        <AppText variant="display">{goalLabel}</AppText>
        <AppText variant="caption" color={colors.textSecondary}>
          {experienceLabel} · {p.preferredSessionMinutes} min sessions
        </AppText>
        <AppText variant="label" color={colors.textTertiary}>
          Goal
        </AppText>
        <SegmentedControl options={GOALS} value={p.goal} onChange={(goal) => update({ goal })} testID="profile-goal" />
        <AppText variant="label" color={colors.textTertiary}>
          Experience
        </AppText>
        <SegmentedControl
          options={EXPERIENCE}
          value={p.experience}
          onChange={(experience) => update({ experience })}
          testID="profile-experience"
        />
      </Card>

      <View style={styles.prefsBlock}>
        <AppText variant="label" color={colors.textTertiary}>
          Units
        </AppText>
        <SegmentedControl<Unit>
          options={[
            { value: 'kg', label: 'kg' },
            { value: 'lb', label: 'lb' },
          ]}
          value={p.unit}
          onChange={(unit) => update({ unit })}
          testID="profile-unit"
        />
        <AppText variant="label" color={colors.textTertiary}>
          Session length: {p.preferredSessionMinutes} min
        </AppText>
        <SegmentedControl<string>
          options={[30, 45, 60, 75, 90].map((m) => ({ value: String(m), label: `${m}m` }))}
          value={String(p.preferredSessionMinutes)}
          onChange={(v) => update({ preferredSessionMinutes: Number(v) })}
          testID="profile-session-length"
        />
      </View>

      <View style={styles.prefsBlock}>
        <AppText variant="label" color={colors.textTertiary}>
          Equipment
        </AppText>
        <ChipRow
          options={EQUIPMENT}
          selected={p.equipment}
          onToggle={(value) =>
            update({
              equipment: p.equipment.includes(value)
                ? p.equipment.filter((e) => e !== value)
                : [...p.equipment, value],
            })
          }
          testID="profile-equipment"
        />
      </View>

      <Card style={styles.bodyweightCard} testID="profile-bodyweight">
        <AppText variant="heading">Bodyweight</AppText>
        {p.bodyweightHistory.length > 0 ? (
          <AppText variant="body" color={colors.textSecondary}>
            Latest:{' '}
            {Math.round(
              (p.unit === 'kg' ? 1 : 1 / 0.45359237) *
                p.bodyweightHistory[p.bodyweightHistory.length - 1].weightKg *
                10,
            ) / 10}{' '}
            {p.unit} on {p.bodyweightHistory[p.bodyweightHistory.length - 1].date}
          </AppText>
        ) : (
          <AppText variant="caption" color={colors.textTertiary}>
            Optional — track it to put your lifts in context.
          </AppText>
        )}
        <View style={styles.bodyweightRow}>
          <FieldInput
            style={styles.input}
            placeholder={`Weight in ${p.unit}`}
            keyboardType="decimal-pad"
            value={bodyweightInput}
            onChangeText={setBodyweightInput}
            accessibilityLabel="Bodyweight entry"
            testID="profile-bodyweight-input"
          />
          <Button label="Log" compact onPress={logBodyweight} testID="profile-bodyweight-log" />
        </View>
      </Card>

      <Button
        label="Component gallery (dev)"
        variant="ghost"
        onPress={() => router.push('/dev/gallery')}
        testID="profile-gallery"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { paddingTop: spacing.sm },
  masthead: { gap: spacing.md, marginBottom: spacing.lg, paddingTop: spacing.lg },
  sync: { marginBottom: spacing.xl, gap: spacing.sm },
  identityCard: { gap: spacing.md, marginBottom: spacing.xl },
  prefsBlock: { gap: spacing.sm, marginBottom: spacing.xl },
  bodyweightCard: { gap: spacing.md, marginBottom: spacing.lg },
  bodyweightRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  input: { flex: 1 },
});
