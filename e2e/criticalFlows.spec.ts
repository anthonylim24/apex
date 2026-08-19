import { expect, test, type Page } from '@playwright/test';

/**
 * Critical-path e2e (Expo web, local mode — no backend credentials):
 * 1. Onboarding wizard → profile persisted
 * 2. Science-based workout generation from the profile
 * 3. Live Workout Player: logging sets, rest timer, finishing
 * 4. Offline logging (network fully blocked mid-workout)
 * 5. History / weekly summary / exercise library / detail / favorites
 *
 * Storage is browser localStorage (AsyncStorage on web), so each test
 * starts from a clean context and builds its own state.
 */

const completeOnboarding = async (page: Page): Promise<void> => {
  await page.goto('/');
  await expect(page.getByTestId('onboarding-screen')).toBeVisible();
  await page.getByTestId('onboarding-goal-hypertrophy').click();
  await page.getByTestId('onboarding-next').click();
  await page.getByTestId('onboarding-experience-intermediate').click();
  await page.getByTestId('onboarding-next').click();
  for (const equipment of ['barbell', 'dumbbell', 'bench', 'cable']) {
    await page.getByTestId('onboarding-equipment').getByText(new RegExp(`^${equipment}`, 'i')).click();
  }
  await page.getByTestId('onboarding-next').click();
  await page.getByTestId('onboarding-next').click(); // skip injuries
  await page.getByTestId('onboarding-next').click(); // defaults: kg, 60m
  await expect(page.getByTestId('home-screen')).toBeVisible();
};

const startGeneratedWorkout = async (page: Page): Promise<void> => {
  await page.getByTestId('home-start-workout').click();
  await expect(page.getByTestId('generated-plan')).toBeVisible();
  await page.getByTestId('new-workout-start').click();
  await expect(page.getByTestId('player-screen')).toBeVisible();
  await expect(page.getByTestId('player-exercise-name')).not.toBeEmpty();
};

const logSetAndSkipRest = async (page: Page, rpe?: number): Promise<void> => {
  if (rpe !== undefined) {
    await page.getByTestId(`set-logger-effort-${rpe}`).click();
  }
  await page.getByTestId('set-logger-log').click();
  await expect(page.getByTestId('rest-timer')).toBeVisible();
  await page.getByTestId('rest-timer-skip').click();
  await expect(page.getByTestId('set-logger')).toBeVisible();
};

test('onboarding creates a profile and lands on home', async ({ page }) => {
  await completeOnboarding(page);
  await expect(page.getByTestId('home-greeting')).toContainText(/ready/i);
  await expect(page.getByTestId('home-weekly-summary')).toContainText('This week');

  // Profile survives a full reload (offline-first local persistence).
  await page.reload();
  await expect(page.getByTestId('home-screen')).toBeVisible();
});

test('generated workout matches the profile and can be regenerated', async ({ page }) => {
  await completeOnboarding(page);
  await page.getByTestId('home-start-workout').click();
  await expect(page.getByTestId('generated-plan')).toBeVisible();
  // Hypertrophy moderate scheme: 3 x 8-12 targets shown.
  await expect(page.getByTestId('generated-plan')).toContainText('8-12');
  await page.getByTestId('new-workout-regenerate').click();
  await expect(page.getByTestId('generated-plan')).toBeVisible();
  // Daily-undulating variant switches the scheme.
  await page.getByTestId('new-workout-intensity').getByText('Heavy').click();
  await expect(page.getByTestId('generated-plan')).toContainText('6-8');
});

test('full workout: log sets with RPE, rest timer, finish, history', async ({ page }) => {
  await completeOnboarding(page);
  await startGeneratedWorkout(page);

  // Exercise 1: two working sets at RPE 7.
  await expect(page.getByTestId('player-set-progress')).toContainText('0 of');
  await logSetAndSkipRest(page, 7);
  await expect(page.getByTestId('player-set-progress')).toContainText('1 of');
  await logSetAndSkipRest(page, 7);

  // Move to the next exercise and log one set without RPE.
  await page.getByTestId('player-next-exercise').click();
  await logSetAndSkipRest(page);

  // Finish → history (first workout: no PR celebration).
  await page.getByTestId('player-finish').click();
  await expect(page.getByTestId('history-screen')).toBeVisible();
  await expect(page.getByTestId('history-volume')).toBeVisible();

  // Weekly summary reflects the workout.
  await page.getByRole('tab', { name: /Train/ }).click();
  await expect(page.getByTestId('home-weekly-summary')).toContainText('1');
  await expect(page.getByTestId('home-last-workout')).toBeVisible();
});

test('logging keeps working fully offline mid-workout', async ({ page, context }) => {
  await completeOnboarding(page);
  await startGeneratedWorkout(page);

  // Kill the network completely — logging must not care.
  await context.setOffline(true);
  await logSetAndSkipRest(page, 8);
  await logSetAndSkipRest(page, 8);
  await expect(page.getByTestId('player-set-progress')).toContainText('2 of');
  await page.getByTestId('player-finish').click();
  await expect(page.getByTestId('history-screen')).toBeVisible();

  // Back online: data is there (it was never anywhere else).
  await context.setOffline(false);
  await expect(page.getByTestId(/history-session-/)).toBeVisible();
});

test('progressive-overload suggestion appears on the second workout', async ({ page }) => {
  await completeOnboarding(page);

  // First workout: top-of-range reps at easy effort (RPE 7).
  await startGeneratedWorkout(page);
  // Raise reps to the top of the 8-12 range.
  for (let i = 0; i < 4; i += 1) {
    await page.getByTestId('set-logger-reps-increment').click();
  }
  await logSetAndSkipRest(page, 7);
  for (const _ of [1, 2]) {
    for (let i = 0; i < 4; i += 1) {
      await page.getByTestId('set-logger-reps-increment').click();
    }
    await logSetAndSkipRest(page, 7);
  }
  await page.getByTestId('player-finish').click();
  await expect(page.getByTestId('history-screen')).toBeVisible();

  // Second workout on the same plan: the engine should suggest progress
  // and show last-time cues in the SetLogger.
  await page.getByRole('tab', { name: /Train/ }).click();
  await startGeneratedWorkout(page);
  await expect(page.getByTestId('player-suggestion')).toContainText(/top of the rep range/i);
  await expect(page.getByTestId('set-logger-previous')).toContainText(/last time/i);
});

test('exercise library: search, filter, detail, favorite', async ({ page }) => {
  await completeOnboarding(page);
  await page.getByRole('tab', { name: /Exercises/ }).click();
  await expect(page.getByTestId('library-screen')).toBeVisible();

  // Search
  await page.getByTestId('library-search').fill('bench');
  await expect(page.getByTestId('exercise-card-bench-press')).toBeVisible();

  // Detail screen: education content + muscle diagram.
  await page.getByTestId('exercise-card-bench-press').click();
  await expect(page.getByTestId('exercise-name')).toContainText('Barbell Bench Press');
  await expect(page.getByTestId('exercise-instructions')).toContainText('How to perform');
  await expect(page.getByTestId('exercise-muscles')).toBeVisible();

  // Favorite from detail, verify via favorites filter.
  await page.getByTestId('exercise-favorite').click();
  await page.getByTestId('exercise-back').click();
  await page.getByTestId('library-search').fill('');
  await page.getByTestId('library-filter-toggle').click();
  await page.getByTestId('library-favorites-filter').getByText(/favorites only/i).click();
  await expect(page.getByTestId('exercise-card-bench-press')).toBeVisible();

  // Nonsense search shows a recoverable empty state.
  await page.getByTestId('library-search').fill('zzzznotanexercise');
  await expect(page.getByTestId('library-empty')).toBeVisible();
});

test('custom exercise joins the library and search', async ({ page }) => {
  await completeOnboarding(page);
  await page.getByRole('tab', { name: /Exercises/ }).click();
  await page.getByTestId('library-create-custom').click();
  await page.getByTestId('new-exercise-name').fill('Landmine Press');
  await page.getByTestId('new-exercise-primary').getByText('Shoulders').click();
  await page.getByTestId('new-exercise-equipment').getByText('Barbell').click();
  await page.getByTestId('new-exercise-save').click();
  await page.getByTestId('library-search').fill('landmine');
  await expect(page.getByText(/Landmine Press/)).toBeVisible();
});

test('component gallery renders the critical components', async ({ page }) => {
  await completeOnboarding(page);
  await page.goto('/dev/gallery');
  await expect(page.getByTestId('gallery-screen')).toBeVisible();
  await expect(page.getByTestId('gallery-setlogger')).toBeVisible();
  await page.getByTestId('set-logger-log').click();
  await expect(page.getByTestId('gallery-logged-count')).toContainText('1');
  await page.getByTestId('gallery-show-pr').click();
  await expect(page.getByTestId('pr-celebration')).toBeVisible();
  await page.getByTestId('pr-celebration-dismiss').click();
});
