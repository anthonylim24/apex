import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SEED_EXERCISES } from '@/data/seedExercises';
import type { Equipment, MovementPattern } from '@/domain/types';
import { useSessionStore, type SetDraft } from '@/state/sessionStore';
import { ExerciseAnimation } from '@/ui/components/exerciseAnimation';
import { ExerciseCard } from '@/ui/components/exerciseCard';
import { PoseGlyph } from '@/ui/components/poseGlyph';
import { MuscleDiagram } from '@/ui/components/muscleDiagram';
import { PrCelebration } from '@/ui/components/prCelebration';
import { ProgressChart, WeeklyBars } from '@/ui/components/progressChart';
import {
  Avatar,
  Callout,
  Divider,
  FieldInput,
  ListRow,
  ProgressPips,
  Switch,
} from '@/ui/components/poufKit';
import { AppText, Badge, Blob, Button, Card, EmptyState, Screen, SegmentedControl, Stat } from '@/ui/components/primitives';
import { RestTimerOverlay } from '@/ui/components/restTimer';
import { RpePicker } from '@/ui/components/rpePicker';
import { SetLogger } from '@/ui/components/setLogger';
import { Stepper } from '@/ui/components/stepper';
import { clay } from '@/ui/clay';
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
  const [kitSwitch, setKitSwitch] = useState(true);
  const [kitField, setKitField] = useState('Pouf');

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
          <AppText
            variant="caption"
            color={colors.success}
            testID="gallery-logged-count"
            style={styles.loggedCount}
          >
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

      <Section title="RPE stepper (with plain-language cues)" testID="gallery-rpe">
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

      <Section title="PoseGlyph — mid-rep catalog marks" testID="gallery-pose-glyphs">
        <Card style={styles.animGrid}>
          {(
            [
              ['squat', ['barbell']],
              ['hinge', ['barbell']],
              ['lunge', ['dumbbell']],
              ['horizontal_push', ['barbell', 'bench']],
              ['horizontal_pull', ['barbell']],
              ['vertical_push', ['barbell']],
              ['vertical_pull', ['pullup_bar']],
              ['isolation', ['dumbbell']],
              ['core', ['bodyweight']],
              ['carry', ['kettlebell']],
            ] as [MovementPattern, Equipment[]][]
          ).map(([pattern, equipment]) => (
            <View key={pattern} style={styles.glyphCell}>
              <PoseGlyph
                pattern={pattern}
                equipment={equipment}
                size={56}
                testID={`gallery-pose-${pattern}`}
              />
              <AppText variant="caption" color={colors.textTertiary}>
                {pattern.replace(/_/g, ' ')}
              </AppText>
            </View>
          ))}
        </Card>
      </Section>

      <Section title="ExerciseAnimation — all movement patterns" testID="gallery-exercise-animation">
        <Card style={styles.animGrid}>
          {(
            [
              ['squat', ['barbell']],
              ['hinge', ['barbell']],
              ['lunge', ['dumbbell']],
              ['horizontal_push', ['barbell', 'bench']],
              ['horizontal_pull', ['barbell']],
              ['vertical_push', ['barbell']],
              ['vertical_pull', ['pullup_bar']],
              ['isolation', ['dumbbell']],
              ['core', ['bodyweight']],
              ['carry', ['kettlebell']],
            ] as [MovementPattern, Equipment[]][]
          ).map(([pattern, equipment]) => (
            <ExerciseAnimation
              key={pattern}
              pattern={pattern}
              equipment={equipment}
              size={140}
              caption={pattern.replace(/_/g, ' ')}
              testID={`gallery-anim-${pattern}`}
            />
          ))}
        </Card>
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

      <Section title="1st-Pouf kit — cushions, tones, fields" testID="gallery-pouf-kit">
        <Card style={styles.miscCard}>
          <View style={styles.badgeRow}>
            <Blob tone="pink" size={40} bounce />
            <Blob tone="mint" size={36} bounce delay={120} />
            <Blob tone="purple" size={32} bounce delay={240} />
            <Avatar initials="AP" tone="yellow" size={48} />
          </View>
          <View style={styles.badgeRow}>
            <Stat label="sets" value="12" tone="mint" />
            <Stat label="min" value="48" tone="blue" />
          </View>
          <ProgressPips total={5} current={2} />
          <Switch label="Clay switch" value={kitSwitch} onValueChange={setKitSwitch} testID="gallery-switch" />
          <FieldInput
            testID="gallery-field"
            value={kitField}
            onChangeText={setKitField}
            placeholder="Clay field"
          />
          <Callout tone="pink" title="Callout">
            Pastel cushion with ink-on-accent type.
          </Callout>
          <ListRow title="List row" subtitle="Pressable clay row" meta="Today" onPress={() => undefined} />
          <Divider />
          <View style={styles.badgeRow}>
            <Badge label="mint" tone="mint" />
            <Badge label="pink" tone="pink" />
            <Badge label="purple" tone="purple" />
            <Badge label="blue" tone="blue" />
            <Badge label="yellow" tone="yellow" />
            <Badge label="orange" tone="orange" />
          </View>
          <Button label="Primary mint" onPress={() => undefined} />
          <Button label="Secondary purple" variant="secondary" onPress={() => undefined} />
          <Button label="Danger pink" variant="danger" onPress={() => undefined} />
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
  loggedCount: { marginTop: clay.gutter },
  miscCard: { gap: spacing.md },
  badgeRow: { flexDirection: 'row', gap: spacing.sm },
  animGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  glyphCell: { alignItems: 'center', gap: spacing.xs, width: 72 },
});
