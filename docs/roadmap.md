# Roadmap — Phases 2 & 3

Phase 1 (MVP) is implemented and tested. This file specifies what comes next, in dependency
order, with the constraints each item must respect. Scope discipline: nothing here may degrade
the core manual logging experience.

## Phase 2

### 2.1 Development-build infrastructure (prerequisite for everything below)
- `expo prebuild` + EAS Build profiles (`eas.json`), internal distribution.
- CI: add an EAS build job (requires `EXPO_TOKEN` secret). Cloud tests stay device-free; device
  smoke tests run on EAS-hosted simulators/device farms.

### 2.2 HealthKit (iOS) + Health Connect (Android)
- New `src/services/health.ts` behind a `HealthSource` interface (mirrors `RemoteStore`):
  `startSession`, `stopSession`, `observeHeartRate`, `sessionSummary`.
- Implementations: `AppleHealthSource`, `HealthConnectSource`, `SimulatedHealthSource`
  (deterministic HR curves for tests/CI).
- Live HR chip in the Workout Player; `avg_hr` written per set (schema already supports it).
- Permission UX: explicit, granular, skippable; a denied permission changes nothing about
  logging. Privacy: HR stays in the sets rows; no separate raw-sample retention in MVP+1
  (add `heart_rate_samples` only when a feature needs it).

### 2.3 Richer analytics & deload surfacing
- Muscle-group weekly-volume heatmap vs the 10–20 set landmarks (data already computed).
- Proactive deload card on Home when `detectStagnation` fires for ≥ 2 core lifts.
- Personal-records timeline; `reps_at_weight` PR kind activation.

### 2.4 Templates, reminders, sharing
- Save any session as a template; start-from-template on Home.
- Reminders: opt-in, user-scheduled, plain ("Training day today?") — no streak guilt (see
  intent audit §7 note). Quiet by default.
- Shareable summary card: rendered image export of a finished session; share-sheet only, no
  in-app feed.

## Phase 3 — experimental Watch rep detection

Research-grade; must never block or replace manual logging.

1. **watchOS companion target** (native SwiftUI + custom Expo module): start/stop mirroring,
   HR streaming, rest-timer haptics on the wrist.
2. **Motion capture spike:** Core Motion accelerometer+gyro at 50 Hz during known exercises;
   on-device ring buffer; export labeled windows for analysis.
3. **Per-user calibration:** 1 guided set per supported exercise (bench, squat, deadlift, curl)
   to fit amplitude/period envelopes.
4. **Detection UX contract:** candidate reps stream to the player as a ghost counter; at set end
   the user sees "Detected 8 reps · confidence 0.82 — use / edit / ignore". Nothing is saved
   without confirmation (`auto_detected=true, confidence` recorded). Battery cost displayed in
   settings; feature off by default.
5. **Accuracy documentation:** in-app "How rep detection works" screen stating supported
   exercises, expected error, and battery impact.
6. Wear OS: HR + session mirroring only; no motion classification commitment.

## Engineering debt / follow-ups (tracked)
- Full VoiceOver traversal on physical iOS device (cannot be validated in cloud CI).
- Dynamic Type snapshot pass at the largest accessibility sizes.
- Optional migration of the styling layer to NativeWind once verified on this RN version.
- Supabase Edge Function mirroring `generateWorkout` for server-side generation parity
  (domain layer is dependency-free and can be deployed as-is).
- Storybook proper if/when `@storybook/react-native` supports RN 0.86 (gallery covers isolated
  review until then).
