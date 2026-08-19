# Apex Design System

Dark-first, gym-first. Implemented in `src/ui/theme.ts` (single source of truth); this document
explains the reasoning. Gym principles: **glanceable, one-handed, works in dim lighting,
motivating but not distracting.**

## 1. Color

| Token | Value | Use | Contrast vs bg |
|---|---|---|---|
| `bg` | `#0A0B0E` | App background (near-black; true black causes OLED smear on scroll) | — |
| `surface` | `#14161B` | Cards, inputs | — |
| `surfaceRaised` | `#1C1F26` | Steppers, chips, secondary buttons | — |
| `surfacePressed` | `#242833` | Pressed states | — |
| `border` | `#2A2E38` | Hairlines | — |
| `text` | `#F4F6F8` | Primary text | 15.9:1 |
| `textSecondary` | `#A9B2BC` | Supporting text | 7.6:1 |
| `textTertiary` | `#7C8590` | Labels, hints (never essential info) | 4.9:1 |
| `accent` | `#C8F542` | Electric lime — primary actions, live/active, progress lines | 12.9:1 |
| `rest` | `#41C7E0` | Rest timer, recovery semantics | 9.0:1 |
| `success` | `#4ADE80` | Saved/synced confirmation | |
| `pr` | `#FFC542` | Personal records (gold) | |
| `warning` | `#FFA23E` | Failure tags, pending sync | |
| `danger` | `#FF5C5C` | Destructive actions | |

Rules: one accent per screen region; semantic colors never repurposed (rest-cyan means recovery
everywhere); color is never the only signal (labels/borders always accompany it).

## 2. Typography

System font (SF Pro / Roboto) — instant load, best hinting, full Dynamic Type support.

| Token | Size/weight | Use |
|---|---|---|
| `displayXl` | 56 / 800 | Rest countdown, hero numerals |
| `display` | 40 / 800 | Stepper values (weight/reps) |
| `title` | 28 / 700 | Screen titles |
| `heading` | 20 / 700 | Card/section headings, exercise name in player |
| `body` / `bodyBold` | 16 / 400·700 | Default text |
| `caption` | 13 / 500 | Meta, cues |
| `label` | 12 / 600 upper | Field labels |

Numerals the lifter reads mid-set (weight, reps, timer) are the largest elements on screen —
readable at arm's length on a bench.

## 3. Spacing, radius, touch

- 4-pt spacing scale (`xs 4 … xxxl 48`); radius `sm 8 / md 12 / lg 16 / xl 24 / full`.
- **Touch targets:** minimum 56 pt globally, 64 pt for SetLogger controls (steppers, LOG SET).
  8 pt `hitSlop` on all pressables. Chips/secondary in-card controls ≥ 44 pt (WCAG 2.2 minimum)
  and are never part of the mid-set loop.

## 4. Motion

Gym-energy: fast, purposeful, no bounce. `fast 120 ms / base 200 ms / slow 320 ms`, ease-out.
Only three sanctioned animations: screen transitions (fade-from-bottom 200 ms), rest-ring
progress (continuous), PR celebration pulse (single, reduce-motion aware). Nothing loops for
attention.

## 5. Component specs (priority order)

### SetLogger — make it perfect
The one component executed 15–25× per session. Spec:
- Header: set number + previous-performance cue (always visible, never a tap away).
- Weight stepper: 64 pt ± buttons, step = smallest real increment for the exercise's equipment
  in the user's unit (barbell 2.5 kg / 5 lb, dumbbell 2 kg, machine pin 2.5 kg).
- Reps stepper: step 1, floor 0 (0 reps cannot be logged).
- Effort picker: RPE (6–10 incl. halves) or RIR (0–5), optional, one-tap toggle off, helper text
  translates the number ("Hard — 2 reps left").
- Tag row: Warm-up / To failure / Drop set — one-tap switches, color + label state.
- LOG SET: 64 pt primary button; success haptic; disabled only when reps = 0.
- Prefill: current-session last set > last-session matching set > prescription target.

### RestTimerOverlay
Replaces the logger between sets (single-focus, glanceable). 220 pt progress ring, 56 pt m:ss
numerals, −15 s / +15 s / Skip (all ≥ 56 pt). Shows "Next: …" so the lifter can pre-plan.
Wall-clock anchored — survives navigation, backgrounding, re-render.

### ExerciseCard
Name, primary muscles + equipment line, difficulty badge (color + text), favorite star with its
own 56 pt target (independent of the card press). Min height 72 pt.

### ProgressChart / WeeklyBars
Custom SVG (renders identically on iOS/Android/web; headless-testable). Dashed gridlines at
min/mid/max, dot per session, date range labels, explanatory empty state.

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
