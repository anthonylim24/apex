# Apex Design System

Dark-first, gym-first. Implemented in `src/ui/theme.ts` (single source of truth); this document
explains the reasoning. Gym principles: **glanceable, one-handed, works in dim lighting,
motivating but not distracting.**

Visual world: **1st-Pouf dark clay** (https://1st-pouf.worksonmy.dev) — plum-black cushions,
pastel accents (mint / pink / purple / blue / yellow / orange), Nunito UI + Anton numerals.
Depth is the affordance: buttons press in, cards have a floor lip. Exercise demos are Pouf Pal
clay clips (web) or a 2.4s squash/stretch still (native / reduce-motion). Gym rules (56–64pt, reduce-motion, SetLogger speed) stay.

## 1. Color

Ported from 1st-Pouf dark (`pouf.css`). Accents never flip in dark mode; ink *on* a pastel
fill stays `--on-accent` (`#2A2145`).

| Token | Value | Use |
|---|---|---|
| `bg` | `#12111A` | Plum-black page |
| `surface` | `#211F2B` | Cards, rows |
| `surfaceRaised` | `#2B2838` | Recessed chrome |
| `surfacePressed` | `#18161F` | Fields, pressed wells |
| `text` | `#F7F3FF` | Ink |
| `textSecondary` | `#B8AFCB` | Supporting |
| `onAccent` | `#2A2145` | Type sitting on pastel |
| `accent` / `mint` | `#A8F0D0` | Primary actions, live, progress |
| `purple` | `#C9A8FF` | Secondary actions, steppers |
| `pink` | `#FFB3D1` | Danger, advanced, Pouf Pal |
| `blue` | `#9EC8FF` | Rest, info |
| `yellow` | `#FFE58A` | PR, coach notes |
| `orange` | `#FFB38A` | Warn, failure |

Rules: one accent per screen region; semantic colors never repurposed (blue means recovery
everywhere); color is never the only signal (labels always accompany it).

## 2. Typography

**Nunito** (`Nunito_400/700/800`) for UI. **Anton** only for mid-set numerals (weight, reps,
rest clock) so they stay readable at arm's length.

| Token | Size / face | Use |
|---|---|---|
| `displayXl` | 68 / Anton | Rest countdown |
| `display` | 48 / Anton | Stepper values, home greeting, Stat figures |
| `title` | 32 / Nunito 800 | Screen titles, set lockup, player exercise name |
| `heading` | 20 / Nunito 800 | Card/section headings |
| `body` / `bodyBold` | 16 / Nunito 400·700 | Default text |
| `caption` | 13 / Nunito 700 | Meta, cues |
| `label` | 12 / Nunito 800 upper | Field labels |

Numerals the lifter reads mid-set (weight, reps, timer) are the largest elements on screen —
readable at arm's length on a bench. Tracking stays ≥ −0.04em.

## 3. Spacing, radius, touch

- 4-pt spacing scale (`xs 4 … xxxl 48`); radius `sm 14 / md 20 / lg 32 / xl 24 / blob 24 / full`.
- **Touch targets:** minimum 56 pt globally, 64 pt for SetLogger controls (steppers, LOG SET).
  8 pt `hitSlop` on all pressables. Chips/secondary in-card controls ≥ 44 pt (WCAG 2.2 minimum)
  and are never part of the mid-set loop.

## 4. Motion

Clay press-in (buttons translate down 3 pt) plus gym-energy timing: `fast 120 / base 200 / slow 320`.
Sanctioned motion: screen transitions, rest-ring breathe in the last 10 s, stepper pop, button
press-in, chart draw-in, PR pulse, Pouf Pal exercise clips (expo-video; still + 2.4 s squash
when motion is reduced or the tile is tiny), idle Blob hops. All honor reduce-motion. Nothing
loops for attention except rest-ring breathe, Pouf Pal clips, and Blob idle hops (idle surfaces
only).

## 5. Component specs (priority order)

### SetLogger — make it perfect
The one component executed 15–25× per session. Spec:
- Header: set number + previous-performance cue (always visible, never a tap away).
- Weight stepper: 64 pt ± buttons, step = smallest real increment for the exercise's equipment
  in the user's unit (barbell 2.5 kg / 5 lb, dumbbell 2 kg, machine pin 2.5 kg).
- Reps stepper: step 1, floor 0 (0 reps cannot be logged).
- Effort stepper: same 64 pt ± language as weight/reps, plus a pouf slider track. RPE (6–10 incl.
  halves) or RIR (0–5), optional — step off the low end or tap the selected tick to clear. Helper
  text translates the number ("Hard — 2 reps left"). Tick testIDs stay (`set-logger-effort-8`).
- Button hierarchy: primary actions are `lg` (72 pt, 18 px), secondary/danger are `md` (52 pt),
  ghost/compact are `sm` (44 pt). Skip rest / Log set / Start workout sit in the large tier.
- Tag row: Warm-up / To failure / Drop set — one-tap switches, color + label state.
- LOG SET: 72 pt primary button; success haptic; disabled only when reps = 0.
- Prefill: current-session last set > last-session matching set > prescription target.

### RestTimerOverlay
Replaces the logger between sets (single-focus, glanceable). 220 pt progress ring with a
rest-cyan → lime gradient stroke and rounded caps, 68 pt Anton m:ss numerals, −15 s / +15 s
(secondary `md`) and Skip rest (primary `lg`). Final 10 s: "Almost go" + optional ring breathe. Shows "Next: …" so the
lifter can pre-plan. Wall-clock anchored — survives navigation, backgrounding, re-render.

### ExerciseCard
Leading **PoseGlyph** (static mid-rep pose from the exercise's choreography, 48 pt), name,
primary muscles + equipment line, difficulty badge (mint / yellow / pink tone), favorite star
with its own 56 pt target. Clay row cushion, min height 72 pt.

### Pouf kit (ported from 1st-Pouf)
`FieldInput`, `Avatar`, `Switch`, `ProgressPips`, `Callout`, `ListRow`, `Divider`, `Blob`,
`Stat`, `Badge` tones, clay `Button` / `Card` / `ChipRow` / `SegmentedControl`. Web gets the
real inset stack; native paints a floor lip + drop.

### ProgressChart / WeeklyBars
Custom SVG (renders identically on iOS/Android/web; headless-testable). Gradient area fill
under the line, draw-in stroke (skipped under reduce-motion), dashed gridlines at min/mid/max,
dot per session, Anton date labels, explanatory empty state. Weekly bars use a vertical
accent gradient.

### OnboardingWizard
5 steps, progress dots, one decision per screen, "why we ask" copy under every title,
back always available, equipment the only hard requirement.

### MuscleDiagram
Schematic front/back body (100×220 viewBox); primary muscles in accent at 0.9 opacity,
secondary dimmed at 0.55. Consistent silhouette across all exercises; accessible text
alternative enumerates the muscles.

## 6. Voice & content

Plain language, coach-not-cop. Numbers explained ("RPE 8 — 2 reps left"), suggestions justified
("You hit the top of the rep range on every set with effort to spare"), rest framed as progress.
Never: guilt, urgency, comparison to other users.

## 7. Personality & charm (where, and where not)

Charm is budgeted to moments that are *earned* or *idle* — never to moments that compete with
lifting. The implemented personality layer (`src/ui/coachVoice.ts` + components):

| Moment | Treatment | Why it's safe |
|---|---|---|
| Home header | Apex wordmark + Pouf Pal idle + bouncing pastel Blobs | Idle browsing moment |
| Home card | Daily "Coach's note" on a yellow Callout — rotates by calendar day | Educates; never nags |
| Library cards | PoseGlyph + clay row + tone badges | Catalog identity |
| Exercise detail | Pouf Pal clip of the pattern (expo-video) | Educational motion, reduce-motion aware |
| Rest timer | Pouf Pal clip inside the rest ring + ring warmth | Rest is the one idle moment mid-workout |
| Live player header | Compact Pouf Pal of the current pattern | Glanceable demo, outside the SetLogger loop |
| New PR | Pastel confetti burst + yellow clay medal | Earned, brief, honest |
| Empty states | Resting Pouf Pal still | Warmth without branded mascots |

Rules: no charm inside the SetLogger interaction loop; every flourish respects reduce-motion;
all copy is deterministic (day/set index), so delight never becomes a slot machine.
