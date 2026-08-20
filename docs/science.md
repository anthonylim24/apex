# Scientific Foundations

Every rule the app enforces is a well-established, non-controversial training principle that can
be coded deterministically and explained to the user in one sentence. No invented "latest
science".

## Principles used

### Progressive overload
Strength and muscle adaptations require progressively increasing mechanical tension over time.
Implementation: per-exercise suggestions to add load, add reps, hold, reduce, or deload —
computed from the last session's performance and effort (`src/domain/progression.ts`).

### Specificity
Adaptations follow the training performed. Implementation: goal-specific set/rep/rest schemes
(`src/domain/generation.ts`):

| Goal | Working scheme (moderate day) | Rest |
|---|---|---|
| Strength | 4 × 4–6 | 150–180 s |
| Hypertrophy | 3 × 8–12 | 120 s |
| Endurance | 3 × 12–15 | 45–60 s |
| General | 3 × 8–12 | 90 s |

Simple linear progression by default; optional daily-undulating variation via light/moderate/
heavy session intensities, which vary the scheme around the goal's center.

### RPE / RIR as the effort currency
RPE 10 = nothing left (0 reps in reserve); each RPE point below 10 ≈ 1 rep in reserve. The app
stores whichever the user logs and converts (`src/domain/effort.ts`). Hypertrophy and strength
work is productive well short of failure; the engine treats avg RPE ≤ 8 (≥ 2 RIR) as "room to
progress" and near-max sessions as consolidation, matching common autoregulation practice.

### Volume landmarks
~10–20 hard sets per muscle per week is a widely used evidence-based productive range
(Schoenfeld et al. volume meta-analyses; "minimum/maximum adaptive volume" coaching heuristics).
Implementation: generation favors accessories for muscles under 10 trailing-week sets and will
not prescribe past 20 (`WEEKLY_MIN_EFFECTIVE_SETS` / `WEEKLY_MAX_SETS`).

### Recovery & deload heuristics
Fatigue masks fitness: when estimated 1RM stalls (< 1% across 3 sessions) while average effort
is high (≥ 8.5 RPE), the limiter is recovery, not stimulus. Implementation: `detectStagnation`
→ suggest ~10% deload week or exercise variation. A plateau at *easy* effort is not flagged —
the user simply has room to progress.

### Estimated 1RM — Epley formula
`e1RM = w × (1 + reps/30)`, the most common linear estimator. Accuracy degrades past ~10–12
reps, so estimation caps rep input at 12 (`src/domain/oneRepMax.ts`); the inversion used for
prescriptions is deliberately uncapped because extrapolation only errs lighter (safer).
Charts label it "estimated" and the progress screen tells users trends matter more than points.

### Double progression
When the smallest real load increment (e.g. +2 kg dumbbells) exceeds ~2.5% of the working
weight, adding reps within the target range first, then adding load, is the standard practical
resolution. Implementation: `increase_reps` action when the range isn't filled; load increases
always round to real plate/pin increments in the user's unit.

### Load increase sizing
+2.5% for upper-body/isolation, +5% for lower-body compounds (larger muscle mass and absolute
loads tolerate larger jumps) — bounded exactly to the brief's 2.5–5% guidance, with a minimum
of one real equipment increment so suggestions are always actionable.

## What the engine deliberately does not do

- No fatigue modeling beyond the RPE/stagnation heuristics (HRV, velocity tracking, readiness
  scores are out of MVP scope and easy to get wrong).
- No failure-seeking: rationale copy consistently steers toward 1–3 RIR.
- No hidden magic: every suggestion's `rationale` string names the rule that produced it.
