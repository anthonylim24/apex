# Overdrive — UI Overhaul Plan

Produced with the Impeccable skill v4.1.1 (`$impeccable overdrive`, `pbakaus/impeccable`),
following its protocol: context gathering → 2–3 proposed directions with trade-offs → one
chosen direction → disciplined implementation with visual iteration and a single mechanical
detector pass. This session runs autonomously (cloud agent, no structured question tool), so
the direction was chosen from the brief instead of a live user pick; all three directions are
recorded here for review.

## Context (what "extraordinary" means for Apex)

Apex is Operate-mode UI used mid-workout: dim gym, one hand, chalk on the screen. The wow
cannot be a particle system; it must be *felt authority* — poster-grade typography you can read
at arm's length, physical motion on the actions that matter, and one authored moment per
surface. Platform truth: React Native (Expo SDK 57) + Reanimated + SVG, rendering to iOS,
Android, and web. No CSS View Transitions, no WebGL — the toolkit translates to: spring
physics (Reanimated worklets), SVG gradient/linework rendering, animated numerals, and
font-level identity. Tests (Jest + Playwright) must stay green; reduce-motion stays honored.

## Directions considered

### A — "Iron Poster" (chosen)
Athletic poster aesthetic built on typographic authority: a condensed heavyweight display face
(Anton) for numerals and titles, oversized scale jumps, near-black surfaces with a barely-there
vertical light gradient, one lime accent doing real work. Signature moments: the Workout
Player as a living poster (72pt spring-popping weight numerals, gradient-swept rest ring), a
Home header that reads like a training-day bill, charts that draw themselves in. Exercise
cards get a unique mark no other app has: each card's leading icon is the exercise's own
mid-rep pose, rendered from our procedural choreography data.
*Trade-offs:* one ~50 KB font asset; low perf risk (transform/opacity springs only); large
visual delta with zero new native modules; RN-web safe.

### B — "Neon Circuit HUD"
Dual-tone teal/lime HUD: glowing gauge strokes, grid/scanline backdrops, instrument-cluster
framing. *Trade-offs:* highest wow in screenshots, but decorative glow violates the craft
floor ("a zero-offset colored halo is decoration"), reads gamer-kitsch against the coach
voice, and adds noise to an Operate surface where scanability wins. Rejected.

### C — "Kinetic Ink"
Motion-first: springs on every interaction, shared-element-feel transitions between list and
detail, ambient animated linework heroes. *Trade-offs:* the most "alive," but concentrates
risk in the player (jank = broken trust mid-set), violates the personality budget ("one
authored moment, not scattered effects"), and RN lacks true shared-element transitions without
new native deps. Rejected as the base; its spring language is borrowed for primary actions only.

## Chosen direction: Iron Poster — implementation contracts

Shared foundation (Agent A) then three parallel surface agents (B/C/D), each owning disjoint
files. All agents: keep every existing `testID`; keep accessibility roles/labels; honor
reduce-motion; obey the craft floor (no gradient text, no ghost cards — border OR shadow, no
eyebrow-kicker-above-heading, no decorative glow, tracking ≥ -0.04em); run
`bunx tsc --noEmit` + targeted Jest before finishing.

- **A · Foundation** (`src/ui/theme.ts`, `src/ui/components/primitives.tsx`,
  `src/ui/components/wordmark.tsx`, `src/app/_layout.tsx`): Anton display face loaded at root
  (splash held until ready; Jest mocks fonts loaded), type scale v2 (`displayXl` 68/Anton,
  `display` 48/Anton, `title` 32/Anton uppercase, poster `letterSpacing`), screen background
  vertical gradient (#07080B → #0D0F14), card elevation cleanup (single elevation voice),
  Button press-spring (scale 0.97, stiff spring) with reduce-motion guard.
- **B · Player hero** (`src/app/workout/player.tsx`, `setLogger.tsx`, `stepper.tsx`,
  `restTimer.tsx`, `rpePicker.tsx`): Anton numerals on steppers + rest clock; numeral
  spring-pop on value change; rest ring gradient stroke (rest-cyan → lime) with rounded caps,
  ring breathes subtly in final 10 s; header shows exercise progress as a segmented track
  instead of caption text; suggestion banner restyled as coach chip. No layout regression:
  all controls stay ≥56–64 pt in the thumb zone.
- **C · Home / Onboarding / Progress** (`src/app/(tabs)/index.tsx`, `onboarding.tsx`,
  `(tabs)/history.tsx`, `(tabs)/profile.tsx`, `progressChart.tsx`): Home poster header
  (greeting in Anton, oversized; giant 4%-opacity Apex mark as background texture — motif from
  the subject's world, not a generic grid); weekly stats as poster numerals; charts gain
  gradient area fill + draw-in animation (dash-offset, reduce-motion aware) and Anton axis
  emphasis; onboarding titles in the display voice with springy option select.
- **D · Library / Detail** (`src/app/(tabs)/library.tsx`, `exercise/[id].tsx`,
  `exerciseCard.tsx`, new `poseGlyph.tsx`): PoseGlyph — a static mid-rep pose rendered from
  `exerciseAnimation/choreography.ts` as each exercise card's leading mark (44–48 pt, figure in
  text color, equipment in accent); detail hero puts the animated demonstration first with an
  Anton title lockup; filters restyled to the new voice.

## Verification gates

1. `bun run verify` (typecheck, lint, all Jest suites) and full Playwright e2e vs web export.
2. `node .agents/skills/impeccable/scripts/detect.mjs --json <changed files>` once, at the end.
3. One batched visual inspection round (screenshots of Home, Player, Rest, Library, Detail,
   Progress, Onboarding) → one batch of fixes → confirm round. Demo video re-recorded.
