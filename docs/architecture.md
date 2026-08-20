# Architecture

## Overview

```
┌────────────────────────────── Expo app (iOS · Android · web) ─────────────────────────────┐
│  src/app (Expo Router screens)                                                            │
│    └── src/ui (design tokens + components: SetLogger, RestTimer, charts, diagram)         │
│          └── src/state                                                                    │
│                ├── sessionStore (Zustand) — live workout: drafts, rest, PRs               │
│                └── queries (TanStack Query) — profile/sessions/favorites/custom           │
│                      └── src/data/Repository — the single data API                        │
│                            ├── local collections (AsyncStorage JSON, source of truth)     │
│                            └── SyncEngine (outbox) ──► RemoteStore interface              │
│                                                            ├── SupabaseRemote (prod)      │
│                                                            └── InMemoryRemote (tests/dev) │
│  src/domain — pure TypeScript, zero RN imports: progression, generation, 1RM, effort,     │
│               stats, history, search, units  ◄── unit-testable headlessly anywhere        │
└───────────────────────────────────────────────────────────────────────────────────────────┘
                       │ Clerk JWT (accessToken callback)
                       ▼
   Supabase Postgres — normalized tables (workout_sessions/workout_exercises/sets…),
   RLS on auth.jwt()->>'sub', document RPC + views for sync, SQL analytics views
```

## Key decisions

### Pure-TS domain core
All training logic (`src/domain`) has zero React/React Native imports. It runs in Node, Bun,
CI, and Edge Functions unchanged. This is what makes "cloud-testable without hardware" true
rather than aspirational: 98 of the unit tests execute against this layer directly.

### Offline-first: local is the source of truth
Reads never touch the network. Writes commit to AsyncStorage instantly, then enqueue an outbox
change. `SyncEngine.sync()` pushes oldest-first (stopping on failure, preserving the queue) and
pulls incrementally with last-write-wins on `updatedAt`. Repeated edits of one entity coalesce
into a single outbox row. Two devices converge without a coordination server. Trade-off
accepted: LWW can drop a concurrent field-level edit of the same entity — acceptable for
single-user fitness data, and sessions are edited on one device at a time in practice.

### Document sync over normalized storage
The client syncs whole session documents (atomic, offline-friendly, matches the in-app shape).
Postgres unpacks them into normalized `workout_sessions` / `workout_exercises` / `sets` via the
`upsert_workout_session` RPC (RLS-checked, transactional) and reassembles them for pulls via the
`workout_session_documents` view. Analytics (`weekly_stats`, `personal_records`) stay relational.

### Auth: Clerk with a local-mode fallback
`EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` present → ClerkProvider (SecureStore token cache) and a
Supabase client whose `accessToken` callback returns the Clerk session JWT, so PostgREST
requests hit RLS keyed on `auth.jwt() ->> 'sub'` (Supabase third-party-auth integration; no
Supabase-issued sessions). Key absent → **local mode**: a single on-device user, no network,
every feature except cross-device sync. Local mode is simultaneously the graceful-degradation
path, the demo mode, and what CI e2e runs against.

### State split
- **Zustand** (`sessionStore`): the live workout only — hot, synchronous, testable without
  React. Rest timing is wall-clock anchored (`restEndsAt` epoch ms), so re-renders,
  navigation, and backgrounding can't drift it.
- **TanStack Query**: persisted server-ish state (profile, sessions, favorites, custom
  exercises) with optimistic updates (favorites) and invalidation after mutations. Every
  mutation fire-and-forgets a background sync.

### UI: token-based StyleSheet system (deviation from brief noted)
The brief suggested NativeWind or Tamagui. At the time of writing, neither had verified support
for this Expo SDK 57 / RN 0.86 / React 19.2 combination, and betting the gym-critical surface on
a styling library's compatibility timeline contradicted the reliability goal. The implemented
system (`src/ui/theme.ts` + typed primitives) delivers the same outcomes — design tokens,
dark-first theming, fast styling — with zero native/babel risk, and can be migrated to NativeWind
later without touching the domain or data layers. Reanimated + Gesture Handler are installed and
used (PR celebration, root gesture view).

### Charts: hand-rolled SVG
`react-native-svg` primitives instead of a chart library: identical output on all three
platforms, headless-testable, no Skia dependency, and the charts need exactly lines/dots/bars.

## Directory map

```
src/domain/       types, units, effort, oneRepMax, progression, generation, stats, history, exerciseSearch
src/data/         storage (KV), localdb (collections), sync (outbox engine), repository, supabase, seedExercises
src/state/        sessionStore (zustand), appContext (providers), queries (tanstack)
src/auth/         Clerk + local-mode AuthProvider / useAuthSession
src/services/     restNotifications (lazy, optional)
src/ui/           theme tokens, components (primitives, setLogger, stepper, rpePicker, restTimer,
                  exerciseCard, progressChart, muscleDiagram, prCelebration)
src/app/          Expo Router routes (see docs/design/user-flows.md)
supabase/         migrations/0001_init.sql (schema + RLS + RPC + views), seed.sql (generated)
e2e/              Playwright specs (web export)
docs/             this documentation set
```

## Phase 2/3 native paths (planned)

- **Development builds required** for HealthKit / Health Connect / Watch (`expo prebuild` +
  EAS Build; none of these work in Expo Go). The repo is plugin-ready (`app.json` plugins array).
- Health integration lands as a `HealthSource` interface next to `RemoteStore` — same pattern:
  real implementation on device, simulated implementation for tests/CI.
- Watch rep detection (Phase 3) is a native watchOS target + custom Expo module streaming
  candidate reps with confidence; the `sets` schema already models `auto_detected`/`confidence`.
