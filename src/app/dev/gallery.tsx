import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SEED_EXERCISES } from '@/data/seedExercises';
import { useSessionStore, type SetDraft } from '@/state/sessionStore';
import { ExerciseCard } from '@/ui/components/exerciseCard';
import { MuscleDiagram } from '@/ui/components/muscleDiagram';
import { PrCelebration } from '@/ui/components/prCelebration';
import { ProgressChart, WeeklyBars } from '@/ui/components/progressChart';
import { AppText, Badge, Button, Card, EmptyState, Screen, SegmentedControl } from '@/ui/components/primitives';
import { RestTimerOverlay } from '@/ui/components/restTimer';
import { RpePicker } from '@/ui/components/rpePicker';
import { SetLogger } from '@/ui/components/setLogger';
import { Stepper } from '@/ui/components/stepper';
import { colors, spacing } from '@/ui/theme';

/**
 * Component gallery — the project's Storybook equivalent: every critical
 * component in isolation with interactive state, viewable on web
 * (`bun run web` → /dev/gallery) and native. Exercised by the e2e suite.
 */
export default function Gallery() {
  const router = useRouter();
  useSessionStore(); // keep store module hot for parity with the player

  const [draft, setDraft] = useState<SetDraft>({
    weightKg: 80,
    reps: 8,
    effort: undefined,
    isWarmup: false,
    isFailure: false,
    isDropSet: false,
  });
  const [loggedCount, setLoggedCount] = useState(0);
  const [rest, setRest] = useState(90);
  const [rpe, setRpe] = useState<number | undefined>(8);
  const [stepperValue, setStepperValue] = useState(80);
  const [favorite, setFavorite] = useState(false);
  const [showPr, setShowPr] = useState(false);
  const [segment, setSegment] = useState('one');

  const bench = SEED_EXERCISES.find((e) => e.id === 'bench-press')!;

  return (
    <Screen testID="gallery-screen">
      <View style={styles.header}>
        <Button label="‹ Back" variant="ghost" compact onPress={() => router.back()} />
        <AppText variant="title">Component gallery</AppText>
        <AppText variant="caption" color={colors.textSecondary}>
          Isolated review of critical components (Storybook equivalent).
        </AppText>
      </View>

      <Section title="SetLogger — the crown jewel" testID="gallery-setlogger">
        <Card>
          <SetLogger
            setNumber={loggedCount + 1}
            draft={draft}
            previous={{ weightKg: 80, reps: 8, rpe: 7 }}
            unit="kg"
            effortMode="rpe"
            weightStep={2.5}
            onChange={setDraft}
            onLog={() => setLoggedCount((n) => n + 1)}
          />
          <AppText variant="caption" color={colors.success} testID="gallery-logged-count">
            Logged sets in this demo: {loggedCount}
          </AppText>
        </Card>
      </Section>

      <Section title="RestTimerOverlay" testID="gallery-rest-timer">
        <Card>
          <RestTimerOverlay
            secondsRemaining={rest}
            totalSeconds={120}
            nextUp="Set 3 · Barbell Bench Press"
            onAdjust={(d) => setRest((r) => Math.max(0, r + d))}
            onSkip={() => setRest(0)}
          />
        </Card>
      </Section>

      <Section title="Stepper" testID="gallery-stepper">
        <Card>
          <Stepper
            label="Weight (kg)"
            value={stepperValue}
            step={2.5}
            onChange={setStepperValue}
            testID="gallery-stepper-control"
          />
        </Card>
      </Section>

      <Section title="RPE picker (with plain-language cues)" testID="gallery-rpe">
        <Card>
          <RpePicker mode="rpe" value={rpe} onChange={setRpe} />
        </Card>
      </Section>

      <Section title="ExerciseCard" testID="gallery-exercise-card">
        <ExerciseCard
          exercise={bench}
          isFavorite={favorite}
          onPress={() => undefined}
          onToggleFavorite={() => setFavorite((f) => !f)}
        />
      </Section>

      <Section title="MuscleDiagram" testID="gallery-muscle-diagram">
        <Card>
          <MuscleDiagram primary={['chest']} secondary={['triceps', 'shoulders']} />
        </Card>
      </Section>

      <Section title="ProgressChart" testID="gallery-chart">
        <Card>
          <ProgressChart
            points={[
              { date: '2026-07-01', value: 100 },
              { date: '2026-07-08', value: 102.5 },
              { date: '2026-07-15', value: 102.5 },
              { date: '2026-07-22', value: 106 },
              { date: '2026-07-29', value: 108 },
            ]}
            unitLabel="Estimated 1RM (kg)"
            width={300}
          />
        </Card>
      </Section>

      <Section title="WeeklyBars" testID="gallery-bars">
        <Card>
          <WeeklyBars
            data={[
              { label: '07-27', value: 2 },
              { label: '08-03', value: 3 },
              { label: '08-10', value: 0 },
              { label: '08-17', value: 4 },
            ]}
            width={300}
          />
        </Card>
      </Section>

      <Section title="Buttons, badges, segmented control" testID="gallery-misc">
        <Card style={styles.miscCard}>
          <Button label="Primary" onPress={() => undefined} />
          <Button label="Secondary" variant="secondary" onPress={() => undefined} />
          <Button label="Danger" variant="danger" onPress={() => undefined} />
          <View style={styles.badgeRow}>
            <Badge label="rest" color={colors.rest} />
            <Badge label="active" color={colors.active} />
            <Badge label="PR" color={colors.pr} />
            <Badge label="warning" color={colors.warning} />
          </View>
          <SegmentedControl
            options={[
              { value: 'one', label: 'One' },
              { value: 'two', label: 'Two' },
            ]}
            value={segment}
            onChange={setSegment}
          />
        </Card>
      </Section>

      <Section title="EmptyState" testID="gallery-empty-state">
        <Card>
          <EmptyState
            title="Nothing here yet"
            message="This is how empty states look across the app."
            actionLabel="Primary action"
            onAction={() => undefined}
          />
        </Card>
      </Section>

      <Section title="PR celebration" testID="gallery-pr">
        <Button label="Show PR celebration" variant="secondary" onPress={() => setShowPr(true)} testID="gallery-show-pr" />
      </Section>

      {showPr ? (
        <PrCelebration
          records={[
            {
              exerciseId: 'bench-press',
              kind: 'estimated_1rm',
              valueKg: 110,
              reps: 5,
              achievedAt: new Date().toISOString(),
              sessionId: 'demo',
            },
          ]}
          exerciseNames={{ 'bench-press': 'Barbell Bench Press' }}
          unit="kg"
          onDismiss={() => setShowPr(false)}
        />
      ) : null}
    </Screen>
  );
}

const Section = ({
  title,
  children,
  testID,
}: {
  title: string;
  children: React.ReactNode;
  testID?: string;
}) => (
  <View style={styles.section} testID={testID}>
    <AppText variant="heading" style={styles.sectionTitle}>
      {title}
    </AppText>
    {children}
  </View>
);

const styles = StyleSheet.create({
  header: { paddingVertical: spacing.lg, gap: spacing.xs },
  section: { marginBottom: spacing.xl },
  sectionTitle: { marginBottom: spacing.md },
  miscCard: { gap: spacing.md },
  badgeRow: { flexDirection: 'row', gap: spacing.sm },
});
