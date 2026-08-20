# Design with Intent — Anti-Pattern Audit & Accessibility Review

Evaluation (`/evaluate` + `/include` + `/fortify`) of the shipped Phase 1 product against the
Intent anti-pattern catalog and core UX principles. Re-run this audit before every release.

## 1. Anti-pattern catalog sweep

| Category | Finding | Evidence |
|---|---|---|
| 1. Deceptive patterns | **Pass.** No trick questions, no confirmshaming; discard uses neutral copy ("Really discard?") with friction proportional to consequence, not guilt. | `workout/player.tsx` discard flow |
| 2. Prechecked/default manipulation | **Pass.** Onboarding has no pre-checked consents; effort (RPE) entry is optional and unchecked by default; bodyweight is explicitly optional. | `onboarding.tsx`, `rpePicker.tsx` |
| 3. Urgency/scarcity fabrication | **Pass.** No timers pressuring decisions; the only countdown is the rest timer, which serves the user and is skippable/adjustable at any moment. | `restTimer.tsx` |
| 4. Addictive design | **Pass.** No streak-loss guilt (consistency bars show data, never "you'll lose your streak!"); PR celebration fires only on genuine physical records, never on variable schedules; workouts have a definite end state. | `stats.ts` (`detectNewPrs` requires prior history), `prCelebration.tsx` |
| 5. Attention exploitation | **Pass.** One notification exists (rest complete), fires only during an active workout the user started, degrades silently if permission is denied, never re-asks after denial in-session. | `restNotifications.ts` |
| 6. Accessibility weaponized | **Pass.** Destructive/exit actions have the same target sizes and contrast as everything else. | `primitives.tsx` Button variants |
| 7. Vulnerable user exploitation | **Pass with note.** Deload suggestions frame rest as progress ("recovery — not more load — is the limiter"), countering over-training compulsion. *Note for Phase 2:* if reminders ship, they must be opt-in with quiet defaults. | `progression.ts` rationale copy |
| 8. AI-specific dark patterns | **Pass.** Suggestions are deterministic rules, explained in full, with confidence levels, never auto-applied, and trivially overridable (the user always types/steps their own numbers). No anthropomorphic manipulation; the engine never says "I". | `progression.ts`, player suggestion banner |
| 9. Common UX failures | **Pass.** Every empty state has a recovery action (library empty → create custom; history empty → start workout; chart empty → explanatory copy). Every action gives visible feedback (haptics + state). No dead ends found. | `EmptyState` usages, e2e nonsense-search test |
| 10. Narrative pathologies | **Pass.** Personas in the PRD map to three distinct, non-converging user paths (mid-workout / planning / learning) rather than one smoothed composite. | `PRD.md` §2 |

## 2. Core-principle check

- **Respect user autonomy:** suggestions advise, never act; units, goal, equipment all editable
  after onboarding; discard/undo semantics for sessions (discarded sessions excluded from stats).
- **Design for real conditions:** offline-first architecture; interruption-safe (wall-clock rest
  timer, per-set persistence, resume card); dim-light contrast; one-handed layout.
- **Make intent visible:** every screen answers "what can I do here" (player header shows
  exercise m of n, sets x of y); suggestions answer "why".
- **Evidence over intuition:** progression rules cite their principle in the rationale string the
  user sees; science constrained to well-supported rules (see `docs/science.md`).
- **Systems over screens:** the logging loop was designed end-to-end (prefill → log → rest →
  next prefill), not as isolated screens.
- **Ethical defaults:** local mode collects nothing; effort optional; notifications permission
  asked only at first use, failure silent.

## 3. Accessibility review (`/include`)

| Item | Status |
|---|---|
| Touch targets ≥ 56 pt (64 pt SetLogger controls) | Pass — enforced via `touch` tokens; buttons/steppers/chips ≥ 44–64 pt (44 pt only for secondary in-card controls, gym-critical controls all ≥ 56) |
| Roles & state for assistive tech | Pass — buttons/switch/radio/checkbox roles with `accessibilityState`; verified in component tests (`getByRole('switch', { checked: true })`) |
| Contrast | Pass — text on bg: 15.9:1 (primary), 7.6:1 (secondary), 4.9:1 (tertiary, non-essential only); accent-on-dark used for emphasis, never as the sole signal |
| Non-color signaling | Pass — tags change label + border + color; suggestion has text, not just color |
| Reduce motion | Pass — PR celebration checks `useReducedMotion` and renders statically |
| Dynamic type | Partial — hero numerals use `adjustsFontSizeToFit`; body text follows system scaling by default. **Follow-up:** explicit large-type snapshot pass in Phase 2 |
| Screen-reader flow of the player | Partial — labels are complete ("Saves this set and starts the rest timer"); a full VoiceOver traversal on device is required before App Store release (cannot be verified in cloud CI) |

## 4. Real-conditions stress results (`/fortify`)

- **Offline mid-workout:** verified by e2e — network fully blocked, sets logged, workout
  finished, history intact.
- **App kill mid-workout:** every logged set persisted at log time; Home offers Resume.
  (Live in-memory draft of the *current unlogged* set is intentionally ephemeral.)
- **Zero-history first run:** SetLogger shows "First time — start light" guidance; suggestion
  engine returns low-confidence hold with honest copy; charts show explanatory empty states.
- **Sensor/notification unavailability:** all wrapped in try/catch with silent degradation;
  logging path has zero dependencies on them.
