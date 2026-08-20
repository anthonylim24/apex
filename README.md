# Apex — science-based strength training

A modern Expo (React Native) app that makes progressive overload frictionless: one-handed set
logging built for the gym floor, evidence-based next-session suggestions you can actually trust,
a comprehensive educational exercise library, and history that shows real strength trends.
**Offline-first everywhere** — every core path works with zero signal.

> Runtime & tooling: this project uses [Bun 1.4](https://bun.com) (`packageManager`: `bun@1.4.0`)
> for everything (`bun`, `bunx`, `bun run`). Node.js LTS must be installed (Expo tooling shells
> out to it).

## Quick start

```bash
bun install
bunx expo start          # press w for web, or scan the QR in Expo Go
```

No configuration needed: without credentials the app runs in **local mode** — all data
on-device, every feature except cross-device sync. To enable accounts + sync, copy
`.env.example` to `.env` and set the Clerk + Supabase keys (see below).

## The product in 30 seconds

- **Onboarding** captures goal, experience, equipment, injuries, units (kg/lb), session length.
- **Generate a workout** (goal-specific schemes, your equipment, volume landmarks, your time
  budget, light/moderate/heavy undulation) or **build one manually** from the library.
- **Live Workout Player**: pre-filled large-button set logging (weight / reps / RPE or RIR),
  "Last time: 80 kg × 8 @ RPE 7" cues on every set, adjustable rest timer with haptics +
  notification, one-tap warm-up/failure/drop-set tags, keep-awake, ≥ 56–64 pt touch targets.
- **Progressive-overload engine** suggests add-load / add-reps / hold / reduce / deload — with a
  plain-language rationale and confidence level, never auto-applied. Epley estimated-1RM trends,
  PR detection with a light celebration.
- **Exercise library**: 58 curated exercises (all 10 movement patterns) with instructions and
  muscle-target diagrams, ranked search, multi-filters, favorites, custom exercises.

## Scripts

| Command | Purpose |
|---|---|
| `bun run start` / `bun run web` | Metro dev server / web preview |
| `bun run test` | Jest — 121 unit + component tests (headless) |
| `bun run test:coverage` | With coverage |
| `bun run typecheck` | Strict TypeScript |
| `bun run lint` | ESLint |
| `bun run export:web` | Static web export to `dist/` |
| `bun run test:e2e` | Playwright e2e vs the export (`bunx playwright install chromium` once) |
| `bun run verify` | typecheck + lint + test |
| `bun run scripts/generate-seed-sql.ts` | Regenerate `supabase/seed.sql` from the TS library |

Everything runs headlessly in cloud CI (`.github/workflows/ci.yml`) — no device, simulator, or
Watch hardware required. Component gallery (Storybook equivalent): run the app → Profile →
"Component gallery", or `/dev/gallery` on web.

## Backend setup (optional — enables accounts + sync)

1. **Clerk:** create an app, put the publishable key in `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`.
2. **Supabase:** create a project; enable the **Clerk third-party auth** integration (so RLS can
   key off `auth.jwt() ->> 'sub'`); run `supabase/migrations/0001_init.sql`, then
   `supabase/seed.sql`; set `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
3. Restart the dev server. Writes now sync in the background (outbox, last-write-wins); the
   Profile tab shows sync status.

## Documentation

| Doc | Contents |
|---|---|
| `docs/PRD.md` | Product requirements, personas, success criteria, phased scope |
| `docs/design/intent-strategy.md` | Design with Intent context, strategy, measurement |
| `docs/design/intent-audit.md` | Anti-pattern audit + accessibility review |
| `docs/design/design-system.md` | Tokens, component specs (SetLogger et al.), voice |
| `docs/design/user-flows.md` | IA, journeys, empty/error-state inventory |
| `docs/design/animation-style-guide.md` | Lottie exercise-animation style contract + pipeline |
| `docs/science.md` | The training science behind every coded rule |
| `docs/architecture.md` | Layers, offline sync design, auth, key decisions |
| `docs/testing.md` | Test layers, mocks/simulation strategy, CI |
| `docs/roadmap.md` | Phase 2 (Health/analytics) & Phase 3 (Watch rep detection) |
| `docs/agent-mapping.md` | How the brief's named agents/skills were mapped |

## Project structure

```
src/domain/    pure-TS training logic (progression, generation, 1RM, stats, search) — no RN imports
src/data/      offline-first storage, outbox sync engine, Supabase remote, seed library
src/state/     Zustand live-session store, TanStack Query hooks, providers
src/auth/      Clerk + local-mode auth
src/ui/        design tokens + components (SetLogger, RestTimer, charts, muscle diagram…)
src/app/       Expo Router screens
supabase/      schema + RLS + sync RPC/views + generated seed
e2e/           Playwright critical-path specs
docs/          full documentation set
```
