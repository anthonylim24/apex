# User Flows & Information Architecture

Produced with the Intent `/journey` + `/organize` skills. Route names map 1:1 to
`src/app/` (Expo Router).

## Information architecture

```
Entry gate (/)                      — auth + onboarding routing only, never seen twice
├─ /sign-in                        — Clerk email/password + email-code verification (Clerk mode only)
├─ /onboarding                     — 5-step wizard, one decision per screen
└─ /(tabs)
   ├─ Train (index)                — start/resume workout, this week, last workout
   ├─ Exercises (library)          — search + filters + favorites + custom
   ├─ Progress (history)           — consistency, volume, trends, workout log
   └─ Profile                      — everything editable, sync status, bodyweight
Modal-depth stack routes:
   /workout/new                    — generate | build manually
   /workout/player                 — Live Workout Player (gesture-back disabled)
   /exercise/[id], /exercise/new   — detail / create custom
   /session/[id]                   — past workout detail
   /progress/[exerciseId]          — e1RM + volume trends
   /dev/gallery                    — component gallery (Storybook equivalent)
```

Wayfinding rules: tabs are the only persistent navigation; stack screens always carry an explicit
back/cancel; the player is deliberately hard to leave accidentally (no swipe-back, two-tap
discard, explicit Finish).

## Flow 1 — First run → first workout (target: < 3 minutes)

```
Launch → gate: no session? → /sign-in (Clerk mode) or skip (local mode)
      → gate: no profile? → /onboarding
Onboarding: goal → experience → equipment → limitations (skippable) → prefs → Start training
      → Train tab → "Start a workout" → /workout/new
      → [Generate for me] plan preview (name, ~minutes, exercises with set×rep @ weight)
        · Regenerate | intensity Light/Moderate/Heavy
      → Start workout → /workout/player
```

Design intent: the plan preview is fully transparent before commitment (no "trust the black
box"); regenerate is free; manual building is equally prominent — generation is a convenience,
not a funnel.

## Flow 2 — Live workout loop (the critical 90 seconds, repeated 15–25×)

```
[SetLogger prefilled] ──(adjust? steppers ±)──(effort? one tap)──> LOG SET (1 tap, haptic)
        │                                                              │
        │                                            session persisted locally, rest armed
        ▼                                                              ▼
   suggestion banner (why + confidence)                     [RestTimerOverlay]
   previous cue: "Last time: 80 kg × 8 @ RPE 7"             ring + m:ss + Next: …
                                                            −15s | +15s | Skip
        ▲                                                              │
        └────────────── auto-return with next set prefilled ◄──── timer ends (haptic + notification)
```

Interruption handling: phone call / app kill / navigation away → all logged sets are already
saved; Home shows a Resume card; rest end time is wall-clock anchored.

Exercise navigation: Prev/Next in the footer thumb zone; Finish in the header (used once per
session); Discard needs two taps.

## Flow 3 — Finish → progress

```
Finish → PRs? ──yes──> PR celebration (single pulse, reduce-motion aware) → Keep going
        └──no───────────────────────────────────────────────┐
                                                             ▼
                                 Progress tab: log entry, weekly volume/consistency updated
                                 → /session/[id] set-by-set detail
                                 → /progress/[exerciseId] e1RM + volume trends
```

## Flow 4 — Library learning loop

```
Exercises tab → search (ranked) / filters (muscle · equipment · difficulty · pattern · favorites)
   → /exercise/[id]: description → muscle diagram (front/back) → numbered form steps → own trend
   → favorite (★, optimistic) | no match → empty state → /exercise/new (custom)
```

## Flow 5 — Sync (invisible by design)

```
any write → local commit (instant) → outbox
background (30 s / after mutations): outbox → push (oldest first, stop on failure, retry later)
                                     → pull since checkpoint → last-write-wins merge
Profile tab surfaces the only user-facing state: "All changes saved" / "n changes waiting to sync".
```

Failure semantics: push failure keeps the queue intact; pull failure is non-fatal; local data is
always authoritative for the UI.

## Empty / loading / error states (inventory)

| Surface | State | Treatment |
|---|---|---|
| Gate | loading auth/profile | Centered spinner on `bg` |
| Home, no history | first run | "Your first workout is one tap away" card |
| Library, no match | search/filter miss | Empty state + "Create custom exercise" |
| Charts, < 1 session | no data | "Log a few sessions to see your trend" |
| Player, no active session | deep link/back-nav | "No active workout" + Back home |
| Sign-in | auth error | Inline plain-language error, form preserved |
| Sync | offline/queue | Non-blocking count in Profile; never a modal |
