# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## Cloud Agent environment

This repo is an Expo (SDK 57) app configured for Cursor Cloud Agents in `.cursor/environment.json`.
**Bun is the package manager and JavaScript runtime for every aspect of this project — use `bun`,
`bunx`, and `bun run` (not `npm`/`npx`/`node`) for day-to-day work.** Node.js LTS must still be
installed (the Cursor default image provides it): Expo's `bun create expo` and `bun expo prebuild`
shell out to `npm pack` to fetch templates and run React Native autolinking scripts.

- Base image: Cursor default (Linux x86_64). `install` installs or upgrades Bun to **1.4.0**
  via `https://bun.com/install` (pinned; see `package.json` `packageManager`), so no custom
  Dockerfile is required.
- `install`: `bun install --frozen-lockfile` — reproducible install from `bun.lock`.
- `terminals.expo`: `bunx expo start --port 8081` — Metro dev server run under Bun. Starting it also
  regenerates the gitignored `expo-env.d.ts` and `.expo/types/` used by `tsc`.

### Running and verifying (all via Bun)

- Install deps: `bun install` (add packages with `bun add <pkg>`, remove with `bun remove <pkg>`).
- Dev server / web preview: `bunx expo start --port 8081`, then open `http://localhost:8081` or press
  `w`. Metro bundles for web via `react-native-web`. Scripts also work: `bun run web`, `bun run start`.
- Type-check: `bunx tsc --noEmit` (run after the dev server has generated types at least once).
- Lint: `bun run lint`. Health check: `bunx expo-doctor`.
- iOS/Android: this VM has no local simulator/emulator. Use EAS for device builds and cloud simulators
  (`bunx eas-cli build`, `bunx eas-cli simulator`). These require an `EXPO_TOKEN` secret.

Native postinstall scripts are opt-in under Bun; packages that need them are listed in
`trustedDependencies` in `package.json` (currently `unrs-resolver`, used by the ESLint resolver).

## Project: Apex (strength-training app)

Docs live in `docs/` (PRD, architecture, design system, testing, science). Key facts:

- `src/domain` is pure TypeScript (no RN imports) — all training logic + most tests live there.
- Offline-first: local storage is the source of truth; sync via outbox (`src/data/sync.ts`).
- Without env vars the app runs in local mode (no Clerk/Supabase needed) — this is what tests use.

### Verifying changes

- `bun run verify` — typecheck + lint + all 121 Jest tests (headless, no device).
- E2E: `bunx playwright install chromium` once, then `bun run export:web && bun run test:e2e`
  (8 Playwright specs against the static web export, includes offline simulation).
- RNTL v14 API: `await render(...)` and `await fireEvent...` in component tests.
- Component gallery for visual review: `/dev/gallery` route on web.
