# Animation & Illustration Style Guide

Governs every visual asset: exercise form animations, icons, empty states, celebration.
**Enforce this guide before bulk asset generation** (risk register: inconsistent animation style
is cheaper to prevent than to fix).

## 0. Shipped baseline: procedural movement demonstrations

Every exercise ships **today** with an animated demonstration: a procedural side-view line-art
character (`src/ui/components/exerciseAnimation/`) that performs the exercise's movement pattern
— all 10 patterns choreographed as keyframed poses on a 200×200 stage, with pattern-aware
equipment (barbell plate end-on, dumbbells, kettlebell, bench, pull-up bar). Properties:

- Exactly this guide's aesthetic: round-cap line art, theme-token colors, equipment in accent
  lime, 2.4 s eccentric-emphasis rep loop (carry: 1.6 s stride, plank: 3.2 s brace breath).
- Renders identically on iOS/Android/web, weighs zero asset bytes, re-themes automatically,
  honors reduce-motion (mid-rep still).
- Choreography is data (`choreography.ts` keyframes) with unit tests asserting stage bounds,
  loop closure, and interpolation, so new patterns/variants are reviewable in code.

Per-exercise Lottie animations (below) remain the richer end state; when an exercise's Lottie
file lands, the detail screen can prefer it. The procedural system is the guaranteed floor, not
a placeholder.

## 1. Exercise form animations (Lottie)

**Format:** Lottie JSON (lightweight, themeable, 60 fps on all platforms, plays via
`lottie-react-native`). Target ≤ 40 KB per animation. Each exercise's `animationUrl` key
(`lottie/<exercise-id>`) resolves to `assets/lottie/<exercise-id>.json`; see
`assets/lottie/README.md` for the pipeline. Until an exercise's animation ships, the detail
screen shows the MuscleDiagram (always available, same visual language) — animations enhance,
never gate.

**Character:** one consistent androgynous figure, medium build.
- Stroke-only line art: 3 px primary strokes at 512×512 composition size, round caps/joins.
- Colors strictly from theme tokens: figure `#F4F6F8`, equipment `#7C8590`,
  working-muscle highlight `#C8F542` (pulse ≤ 0.9 → 0.6 opacity synced to the rep),
  background transparent (theme shows through).
- **Consistent joint angles:** start position matches instruction step 1 exactly; depth/lockout
  match the coached range (e.g. squat animations reach parallel, not quarter reps).

**Timing:** one rep = 2.4 s (0.9 s eccentric emphasis — teaching tempo, not gym tempo),
loop seamlessly, linear-ish easing (educational clarity beats snappiness here — the one
exception to the "fast motion" rule).

**Camera:** ¾ front-left view by default; strict side view for hinge patterns (deadlift, RDL)
where spinal position is the teaching point.

## 2. In-app motion

See design-system.md §4: 120/200/320 ms, ease-out, no bounce, reduce-motion aware. The PR
celebration is a single scale pulse (0.8 → 1.04 → 1.0) behind a dimmed backdrop — celebratory
but over in under half a second.

## 3. Iconography

- Tab/system icons: geometric glyphs, 2 px stroke at 24×24, from the text color of their state.
- App icon: dark `#0A0B0E` field, electric-lime upward-trending bar/barbell mark, no text.
  Generated asset in `assets/images/icon.png`.

## 4. Empty states & data visualization

- Empty states: single accent glyph in a `surfaceRaised` circle + heading + one sentence + one
  action. No cartoon mascots (tonal mismatch with the utilitarian promise).
- Charts: 2.5 px accent lines, 4 px dots, dashed `border`-color gridlines. Volume uses
  rest-cyan, e1RM uses accent lime — consistent across every screen.
- Muscle diagram: schematic ellipse regions on a shared silhouette; primary = accent 0.9,
  secondary = `textTertiary` 0.55. Same body proportions in every context.

## 5. Asset pipeline & QA checklist

Pipeline: After Effects/Figma → Bodymovin export → `assets/lottie/<exercise-id>.json` →
referenced by seed data `animationUrl`. Batch generation must go exercise-family by family
(all squats, then all hinges…) so reviewers can compare joint angles within a family.

Per-asset QA gate:
- [ ] Colors are theme tokens only (no hardcoded off-palette values)
- [ ] One rep loops seamlessly at 2.4 s
- [ ] Start pose matches instruction step 1; range matches coaching cues
- [ ] Working-muscle highlight matches `primaryMuscles` of the exercise record
- [ ] ≤ 40 KB, renders at 60 fps on a mid-range Android device
- [ ] Readable at 160×160 (player inline size) and 512×512 (detail)
