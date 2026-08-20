# Testing Guide

The full suite runs headlessly — no physical device, simulator, or Watch hardware — in local
dev and cloud CI identically.

## Commands

| Command | What it runs |
|---|---|
| `bun run test` | Jest: 121 unit + component tests (domain, data/sync, store, UI components) |
| `bun run test:coverage` | Same with coverage report |
| `bun run typecheck` | `tsc --noEmit` (strict) |
| `bun run lint` | ESLint (expo flat config) |
| `bun run export:web && bun run test:e2e` | Playwright e2e against the static web export |
| `bun run verify` | typecheck + lint + jest (the pre-commit gate) |

One-time e2e setup: `bunx playwright install chromium`.
Faster e2e iteration against a running Metro server: `PW_BASE_URL=http://localhost:8081 bun run test:e2e`.

## Layers

### 1. Unit (Jest, `src/**/__tests__`)
- **Progression engine** — every rule branch: +2.5%/+5% increases, minimum-increment guarantee,
  double progression, hold at high RPE, 5% reduction on misses/failure, deload on stagnation,
  warm-up exclusion, lb plate rounding, confidence levels.
- **Generation** — equipment/difficulty/injury filters, goal schemes, DUP intensities, time
  budget, weekly volume caps, e1RM-based prescriptions, deterministic seeded RNG.
- **1RM / effort / units** — Epley + cap semantics, RPE↔RIR, kg↔lb, plate rounding.
- **Stats/history** — weekly summaries, trends, PR detection, consistency, trailing-week volume.
- **Offline sync** — pure-offline mode, queue-through-outage, coalescing, mid-flush failure
  recovery, two-device convergence, LWW conflict, incremental pull checkpoints, full workout
  round-trip, favorites tombstones.
- **Session store** — draft prefill precedence, logging, effort modes, warm-up numbering, rest
  adjust/skip clamping, finish/PR/discard.

### 2. Component (React Native Testing Library v14, headless)
SetLogger (cues, steppers, units, RPE, tags, one-tap log, zero-rep guard), RestTimerOverlay,
Stepper bounds, RIR mode, ExerciseCard, ProgressChart (+ empty state), WeeklyBars,
MuscleDiagram accessibility, PrCelebration. Note RNTL v14 API: `await render(...)`,
`await fireEvent...`.

### 3. End-to-end (Playwright vs static Expo web export)
`e2e/criticalFlows.spec.ts` — 8 scenarios: onboarding + reload persistence · generation +
regenerate + DUP scheme change · full workout with RPE/rest/finish/history/weekly summary ·
**fully-offline mid-workout logging** (`context.setOffline(true)`) · progressive-overload
suggestion + last-time cues on the second workout · library search/filter/detail/favorite +
empty-state recovery · custom exercise creation · component gallery.

E2E runs in **local mode** (no Clerk/Supabase credentials needed), which is exactly the
offline-first path; the sync layer's remote behavior is covered by the sync unit tests against
`InMemoryRemote` (including simulated network failure).

### 4. Component gallery (Storybook equivalent)
`/dev/gallery` renders every critical component in isolation with interactive state, on web and
native (Profile tab → "Component gallery"). It is itself covered by e2e. Rationale for not
adding Storybook proper: on this brand-new SDK it would add a large dependency surface for the
same review capability; the route-based gallery is zero-dependency and always in sync with the
app. Revisit when `@storybook/react-native` supports this RN version.

## Mocks & simulation strategy

| Real thing | Test double |
|---|---|
| AsyncStorage | Official jest mock (unit) / browser localStorage (e2e) |
| Network / Supabase | `InMemoryRemote` with failure injection (`failNextPushes`, custom throw) |
| Haptics, keep-awake | Jest mocks (`src/test/jest.setup.js`) |
| Reanimated | Hand-rolled mock (passthrough components, reduce-motion true) |
| Notifications | Lazy-loaded module: absent in tests/web by design → silent no-op path is itself the tested behavior |
| Offline | `context.setOffline(true)` in Playwright; dead remote in unit tests |
| HealthKit / Watch (Phase 2/3) | planned `HealthSource` interface with a `SimulatedHealthSource` — same pattern as `RemoteStore` |

## CI

`.github/workflows/ci.yml`: Bun install → typecheck → lint → Jest → web export → Playwright
(chromium) → upload report on failure. Runs on every push/PR to `main`; no secrets required.
