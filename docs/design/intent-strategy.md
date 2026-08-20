# Design with Intent — Project Context & Strategy

The Design with Intent skill system (installed via `npx skills add ghaida/intent --all`, see
`.agents/skills/`) is the primary UX strategy layer for Apex. This document is the **project
context document** produced by the `intent` skill's `context` mode, plus the strategic framing
(`/strategize`) and journey/measurement outputs referenced by the rest of the design docs.

## 1. Project context (Intent `context` mode)

### Users (by behavior, not demographics)
- Someone mid-workout on a gym floor: one hand free, chalk/sweat on fingers, phone screen at
  arm's length in dim lighting, 90–180 seconds between sets, possibly a concrete basement with
  no signal. Attention is a scarce resource they need for lifting, not for our UI.
- Someone planning tonight's session on the couch: relaxed, exploring exercises, reading form
  instructions, checking their trend after a plateaued week.
- Someone new to structured training: doesn't know what RPE means, worries about doing exercises
  wrong, needs the app to be a patient coach rather than a drill sergeant.

### Product and business context
- New product; no legacy constraints. Revenue model is out of scope for MVP — which removes the
  usual pressure toward engagement mechanics. The product's only currency is user trust.
- Platform: Expo/React Native (iOS primary, Android parity for core tracking), Expo web used for
  previews and cloud testing.

### Hard constraints
- Offline-first is non-negotiable: gyms are network dead zones.
- Watch/HealthKit require development builds; pure Expo Go cannot ship those paths (phased).
- Cloud/CI testability without physical devices (shapes the architecture: pure-TS domain core,
  injectable remotes, web-runnable e2e).

### Ethical stance (explicit, binding)
- **Data:** minimum collection. Injury notes exist for the generator's safety filter and the
  user's own memory — never for any other purpose. Local mode requires zero accounts.
- **Attention:** utility-focused. The app should end sessions, not extend them. No infinite
  feeds; a workout has a clear finish.
- **Vulnerable populations:** people prone to exercise compulsion or body-image harm exist in
  every fitness user base. Consequences: no streak-loss guilt, no shame copy, celebration only
  for genuine physical achievement (PRs), deload suggestions treat rest as progress.
- **Anti-pattern catalog:** all categories rejected. The audit in `intent-audit.md` verifies the
  shipped product against the catalog item by item.

### Success definition
See PRD §3. UX-measurable: time-to-log-a-repeat-set (target: one tap), zero data loss on
force-quit mid-workout, suggestion comprehension (every suggestion readable as one sentence of
plain language).

## 2. Strategic framing (`/strategize` — problem before solution)

**Problem statement.** Progressive overload — the single most evidence-backed driver of strength
gains — fails in practice not from lack of knowledge but from friction: remembering last week's
numbers, deciding when to add weight, and recording today's numbers all compete with the workout
itself. Existing tools either demand spreadsheet discipline or bury logging under social/content
features.

**Hypothesis.** If the app (a) shows last performance exactly where the decision happens, (b)
turns the progression decision into a pre-computed, explained suggestion, and (c) makes logging
a repeat set literally one tap, then intermediate lifters will maintain structured progression
without willpower overhead.

**Bet ranking** (what we optimized, in order):
1. SetLogger interaction cost (the loop executed 15–25×/session)
2. Trust in suggestions (rationale + confidence + override)
3. Offline reliability (a single lost workout destroys trust permanently)
4. Educational depth of the library (secondary personas)
5. Charts/analytics (retention value, but never at the cost of 1–3)

## 3. Journeys (`/journey` — summarized; full flows in `user-flows.md`)

Critical journey: **mid-workout set logging**, designed for interruption: every logged set is
persisted immediately; returning after a phone call or app kill resumes exactly where the lifter
left off (Home shows "Workout in progress → Resume"). The rest timer survives navigation because
it is wall-clock-anchored (`restEndsAt`), not tick-driven.

## 4. Measurement (`/measure` — Goal-Signal-Metric, ethically bounded)

| Goal | Signal | Metric | Guardrail |
|---|---|---|---|
| Frictionless logging | Sets logged without editing prefilled values | % one-tap set logs | Never optimize by hiding editing |
| Trustworthy coaching | Suggestions followed vs overridden | Override rate per action type | High override ≠ push harder; it means re-examine the rule |
| Reliable offline | Sync outbox drains | Pending-change age p95 | Never block logging on sync state |
| Real progress (user's goal, not ours) | e1RM trend positive over 8 weeks | % users with positive trend | No engagement-bait notifications to inflate it |

Explicitly not measured: session length, DAU streaks, notification open rates. Tracking those
would create pressure to design for them (Goodhart), against the ethical stance.

## 5. Evaluation gates (`/evaluate`, `/fortify`, `/include`)

Run before each release; current results in `intent-audit.md`:
1. Anti-pattern sweep against the full catalog (Categories 1–10).
2. Real-conditions stress pass: offline, interruption mid-set, app-kill recovery, empty states,
   first-run with zero history, reduce-motion.
3. Accessibility pass: roles/labels/state, target sizes, contrast, dynamic type behavior.
