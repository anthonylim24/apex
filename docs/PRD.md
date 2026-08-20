# Apex — Product Requirements Document

**Status:** Phase 1 (MVP) implemented · Phases 2–3 specified
**Design strategy:** Design with Intent (see `docs/design/intent-strategy.md`)

## 1. Vision

A modern, science-based strength-training app that makes progressive overload frictionless.
The product is optimized for one moment above all others: **mid-set, in a gym, one hand free,
possibly no signal**. Everything else — auth, sync, charts, generation — exists to serve that
moment.

**Positioning:** structured progressive training without spreadsheet complexity. Not a social
network, not a content platform, not an engagement machine.

## 2. Users and jobs-to-be-done

| Persona | Context | Jobs |
|---|---|---|
| **Primary: intermediate lifter** | Trains 3–5×/week, knows the big lifts, tired of notes-app/spreadsheet tracking | Log a set in seconds; see last session's numbers next to this set; get a trustworthy "add weight or not?" answer; watch long-term strength trend |
| **Secondary: beginner** | New or returning; unsure what to do and how hard to push | Get a safe, equipment-aware plan; learn exercises (instructions + muscle targets); understand effort (RPE explained in plain language) |
| **Secondary: advanced lifter** | Years of training; wants data and control | Full history, per-exercise e1RM/volume trends, custom exercises, manual plan building, ability to override every suggestion |

Jobs-to-be-done: start/log a workout quickly · see previous performance · receive science-based
next-session recommendations · understand exercises · track long-term progress.

## 3. Success criteria (measurable)

1. **One-handed full workout:** a 45-minute workout is loggable entirely inside the Workout
   Player with one hand, offline. *Verified by e2e test "logging keeps working fully offline
   mid-workout" and touch-target audit (all player controls ≥ 56–64 pt).*
2. **Trustworthy suggestions:** every progression suggestion carries a plain-language rationale
   and confidence level, and is never auto-applied. *Verified by unit tests on every rule branch.*
3. **Comprehensive, educational library:** 54 seeded exercises covering all 10 movement patterns,
   each with description, step-by-step instructions and muscle-target diagram; ranked search +
   multi-filter. *Verified by library integrity tests.*
4. **Private, reliable data:** local-first storage, background sync, RLS keyed to the
   authenticated user. *Verified by sync engine tests (11) and the RLS policy suite in SQL.*
5. **Offline-first:** every core logging path works with zero network. *Verified by e2e offline
   test and by architecture (reads never touch the network).*

Anti-goals (explicitly rejected): engagement-maximizing mechanics (streak guilt, variable
rewards, notification spam), social comparison feeds, data collection beyond what features need.

## 4. Phased scope

### Phase 1 — MVP (implemented)

- Clerk authentication (+ fully offline **local mode** when no key is configured) with Supabase
  persistence and offline-first sync
- Rich onboarding/profile: goal, experience, equipment, injuries/limitations (structured +
  free-text), units (kg/lb), preferred session length, optional bodyweight tracking
- Exercise database: 54 curated seed exercises + user-created custom exercises; ranked search;
  multi-filter (muscle, equipment, difficulty, movement pattern); favorites
- Manual workout building and science-based generation (goal schemes, equipment/injury filters,
  volume landmarks, time budget, linear or daily-undulating intensity)
- **Live Workout Player**: large-button set logging (weight/reps/RPE-or-RIR), rest timer with
  haptics + local notification, previous-performance cues on every set, keep-awake, ≥ 56–64 pt
  targets, one-tap failure/drop-set/warm-up tagging, per-set local persistence
- Automatic progressive-overload suggestions with rationale + confidence, deload detection
- History: workout log, weekly summary (workouts/minutes/volume), consistency bars, per-exercise
  e1RM and volume trends, PR detection with a light celebration
- Exercise detail: description, primary/secondary muscles (diagram), instructions, your e1RM trend

### Phase 2 — specified, not implemented

- HealthKit (iOS) / Health Connect (Android): live heart rate, calories, session metadata.
  Requires a development build (`expo prebuild` + EAS); permission flows must be explicit,
  granular, and skippable. HR is stored per-set (`sets.avg_hr` exists in the schema already).
- Richer analytics (muscle-group volume heatmap vs the 10–20 set landmarks), deload suggestions
  surfaced proactively, workout templates, push reminders (opt-in, quiet by default),
  shareable summary cards (image export, no social feed).

### Phase 3 — experimental (documented, never blocking)

- Apple Watch motion-based rep detection for a small, high-signal exercise set (bench, squat,
  deadlift, curl) after per-user calibration. Requires a native watchOS target + custom Expo
  module. Every auto-detected set must show a confidence score and require explicit user
  confirmation; manual logging is always primary. The `sets` schema already carries
  `auto_detected` and `confidence` so history stays honest. Accuracy limits and battery cost
  must be documented in-app. Wear OS: out of scope beyond HR.

### Out of scope

Social feeds, nutrition, camera form-coaching AI, complex periodization UI, monetization.

## 5. Functional requirements (Phase 1 detail)

### Onboarding
- 5 steps: goal → experience → equipment → limitations (optional) → preferences.
- Each step states *why* it is asked. Back navigation at every step. No dark patterns; the only
  required inputs are those the generator genuinely needs (equipment).

### Exercise database
- Fields: name, description, instructions[], primary/secondary muscles, equipment[], difficulty,
  movement pattern, animation key (Lottie pipeline), optional video URL, is_custom, created_by.
- Search matches names (prefix-ranked), muscles, equipment, patterns. Filters AND across
  dimensions, OR within. Favorites rank first and can be filtered to.

### Generation engine
- Inputs: profile (goal/experience/equipment/avoid-muscles/session length/unit), library,
  per-exercise best e1RM, trailing-7-day sets per muscle, intensity (light/moderate/heavy).
- Ordering: compound patterns first (squat, h-push, h-pull, hinge, v-push, v-pull, lunge), then
  accessories favoring muscles under 10 weekly sets; hard cap 20 prescribed weekly sets/muscle.
- Time model keeps the plan inside the user's preferred session length.
- Working weights prescribed at ~2 reps in reserve from known e1RM (inverted Epley), rounded to
  real plate/pin increments in the user's unit.

### Progression engine (rules, all unit-tested)
- All sets at top of rep range and avg RPE ≤ 8 → **increase load** (+2.5% upper/isolation,
  +5% lower-body compounds), minimum one real equipment increment.
- Min reps hit but not top, RPE ≤ 8 → **add reps** (double progression).
- Targets hit at RPE > 8 → **hold** (consolidate).
- Missed reps or avg RPE > 9.5 → **reduce ~5%**.
- e1RM flat (<1%) across 3 sessions with avg RPE ≥ 8.5 → **deload ~10%** or variation.
- Confidence: high (≥2 sessions with effort data), medium (1), low (none).

### Live Workout Player
- Full-screen, keep-awake, dark high-contrast; controls in the thumb zone.
- SetLogger pre-fills from current session > last session > prescription; logging a repeat set is
  one tap. Previous cue format: "Last time: 80 kg × 8 @ RPE 7".
- Rest timer: prescription-driven, ±15 s on the fly, skippable, visual ring + haptic completion +
  local notification (graceful no-op where unsupported).
- Suggestion banner shows action + rationale + confidence; user always sets their own numbers.
- Discard requires two taps (destructive-action friction); finish persists and detects PRs.

### History & progress
- Weekly summaries (workouts, minutes, volume, sets/muscle), 8-week consistency and volume bars,
  per-exercise e1RM + volume line charts, complete set-by-set session log.
- PRs detected for heaviest weight and best e1RM, never on the first-ever session.

## 6. Non-functional requirements

- **Offline-first:** reads never wait on network; writes commit locally then queue for sync.
- **Privacy:** minimum collection; injuries stay in the user's profile only; no third-party
  analytics; RLS restricts every row to its owner; local mode keeps everything on-device.
- **Performance:** static-content screens render from local data instantly; charts are plain SVG;
  animations are short (120–320 ms) and reduce-motion aware.
- **Accessibility:** ≥ 56 pt targets (64 pt in the SetLogger), roles/labels/state on all
  interactive elements, text contrast ≥ 4.5:1 (body text 7.6:1+), plain-language effort labels.
- **Error handling:** sensors/notifications/network can all fail without ever blocking manual
  logging.
