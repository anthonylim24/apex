import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { searchExercises, type ExerciseFilters } from '@/domain/exerciseSearch';
import type { Difficulty, Equipment, MovementPattern, MuscleGroup } from '@/domain/types';
import { useExerciseLibrary, useFavorites, useToggleFavorite } from '@/state/queries';
import { ExerciseCard } from '@/ui/components/exerciseCard';
import { FieldInput } from '@/ui/components/poufKit';
import { AppText, Button, Card, ChipRow, EmptyState } from '@/ui/components/primitives';
import { colors, spacing } from '@/ui/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MUSCLES: { value: MuscleGroup; label: string }[] = [
  { value: 'chest', label: 'Chest' },
  { value: 'back', label: 'Back' },
  { value: 'lats', label: 'Lats' },
  { value: 'shoulders', label: 'Shoulders' },
  { value: 'biceps', label: 'Biceps' },
  { value: 'triceps', label: 'Triceps' },
  { value: 'quads', label: 'Quads' },
  { value: 'hamstrings', label: 'Hamstrings' },
  { value: 'glutes', label: 'Glutes' },
  { value: 'calves', label: 'Calves' },
  { value: 'core', label: 'Core' },
];

const EQUIPMENT: { value: Equipment; label: string }[] = [
  { value: 'barbell', label: 'Barbell' },
  { value: 'dumbbell', label: 'Dumbbell' },
  { value: 'machine', label: 'Machine' },
  { value: 'cable', label: 'Cable' },
  { value: 'bodyweight', label: 'Bodyweight' },
  { value: 'kettlebell', label: 'Kettlebell' },
  { value: 'band', label: 'Band' },
];

const DIFFICULTY: { value: Difficulty; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const PATTERNS: { value: MovementPattern; label: string }[] = [
  { value: 'squat', label: 'Squat' },
  { value: 'hinge', label: 'Hinge' },
  { value: 'lunge', label: 'Lunge' },
  { value: 'horizontal_push', label: 'H-Push' },
  { value: 'horizontal_pull', label: 'H-Pull' },
  { value: 'vertical_push', label: 'V-Push' },
  { value: 'vertical_pull', label: 'V-Pull' },
  { value: 'isolation', label: 'Isolation' },
  { value: 'core', label: 'Core' },
  { value: 'carry', label: 'Carry' },
];

export default function Library() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { exercises } = useExerciseLibrary();
  const favorites = useFavorites();
  const toggleFavorite = useToggleFavorite();

  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [muscles, setMuscles] = useState<MuscleGroup[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty[]>([]);
  const [patterns, setPatterns] = useState<MovementPattern[]>([]);
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const favoriteIds = useMemo(() => new Set(favorites.data ?? []), [favorites.data]);
  const filters: ExerciseFilters = { query, muscles, equipment, difficulty, patterns, favoritesOnly };
  const results = useMemo(
    () => searchExercises(exercises, filters, favoriteIds),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [exercises, query, muscles, equipment, difficulty, patterns, favoritesOnly, favoriteIds],
  );

  const toggle = <T,>(list: T[], value: T): T[] =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const activeFilterCount =
    muscles.length + equipment.length + difficulty.length + patterns.length + (favoritesOnly ? 1 : 0);

  return (
    <View style={styles.screen} testID="library-screen">
      <LinearGradient
        colors={[colors.bgTop, colors.bg]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.screenLight}
        pointerEvents="none"
      />
      <View style={[styles.body, { paddingTop: insets.top }]}>
        <View style={styles.masthead}>
          <AppText variant="title">Exercises</AppText>
        </View>
        <View style={styles.searchRow}>
          <FieldInput
            testID="library-search"
            style={styles.search}
            placeholder="Search exercises, muscles, equipment…"
            value={query}
            onChangeText={setQuery}
            accessibilityLabel="Search exercises"
            autoCorrect={false}
          />
          <Button
            label={activeFilterCount > 0 ? `Filters (${activeFilterCount})` : 'Filters'}
            variant="secondary"
            compact
            onPress={() => setShowFilters((v) => !v)}
            testID="library-filter-toggle"
          />
        </View>

        {showFilters ? (
          <Card style={styles.filters} testID="library-filters">
            <AppText variant="label" color={colors.textSecondary}>
              Muscle
            </AppText>
            <ChipRow options={MUSCLES} selected={muscles} onToggle={(v) => setMuscles((p) => toggle(p, v))} />
            <AppText variant="label" color={colors.textSecondary}>
              Equipment
            </AppText>
            <ChipRow options={EQUIPMENT} selected={equipment} onToggle={(v) => setEquipment((p) => toggle(p, v))} />
            <AppText variant="label" color={colors.textSecondary}>
              Difficulty
            </AppText>
            <ChipRow options={DIFFICULTY} selected={difficulty} onToggle={(v) => setDifficulty((p) => toggle(p, v))} />
            <AppText variant="label" color={colors.textSecondary}>
              Movement pattern
            </AppText>
            <ChipRow options={PATTERNS} selected={patterns} onToggle={(v) => setPatterns((p) => toggle(p, v))} />
            <ChipRow
              options={[{ value: 'favorites', label: '★ Favorites only' }]}
              selected={favoritesOnly ? ['favorites'] : []}
              onToggle={() => setFavoritesOnly((v) => !v)}
              testID="library-favorites-filter"
            />
          </Card>
        ) : null}

        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          style={styles.listFlex}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <ExerciseCard
              exercise={item}
              isFavorite={favoriteIds.has(item.id)}
              onPress={() => router.push(`/exercise/${item.id}`)}
              onToggleFavorite={() => toggleFavorite.mutate(item.id)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              title="No exercises match"
              message="Try fewer filters, a different spelling, or create a custom exercise."
              actionLabel="Create custom exercise"
              onAction={() => router.push('/exercise/new')}
              testID="library-empty"
            />
          }
          ListFooterComponent={
            <Button
              label="+ Create custom exercise"
              variant="ghost"
              onPress={() => router.push('/exercise/new')}
              testID="library-create-custom"
            />
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  screenLight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 260,
  },
  body: { flex: 1 },
  masthead: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  searchRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  search: { flex: 1, minHeight: 48 },
  filters: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  listFlex: { flex: 1 },
  list: { paddingHorizontal: spacing.lg, gap: spacing.xs, paddingBottom: spacing.xxxl, paddingTop: spacing.sm },
});
