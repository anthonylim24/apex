# Exercise animation assets (Lottie)

This directory holds the Lottie form animations referenced by the seed exercise data
(`animationUrl: "lottie/<exercise-id>"` → `assets/lottie/<exercise-id>.json`).

- **Style contract:** `docs/design/animation-style-guide.md` — character, colors (theme tokens
  only), 2.4 s rep loop (144 frames @ 60 fps), camera angles, ≤ 40 KB, and the per-asset QA
  checklist. Batch production goes family-by-family (all squats, then all hinges…) so joint
  angles stay comparable.
- **Pipeline:** After Effects / Figma → Bodymovin export → drop the JSON here with the exact
  exercise id as filename → the exercise detail screen picks it up.
- **Fallback:** until an exercise's animation exists, the app shows the MuscleDiagram — the
  library is fully functional without any file in this directory.
- `rep-tempo-pulse.json` is the timing/palette reference sample (accent-lime pulse at the exact
  2.4 s rep cadence): use it to verify tempo and color when reviewing new exports.
