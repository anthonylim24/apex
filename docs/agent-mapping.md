# Agent & Skill Mapping

The brief referenced named agents and skill packages. Mapping used in this implementation:

## Design with Intent (installed and applied)

`npx skills add ghaida/intent --all` → `.agents/skills/` (17 skills). Note: the installed skill
package does not itself define the persona names used in the brief (Noor/Ember/Wren/Vigil) — the
only named mode in the package is "Sage", an alias for the `philosopher` reasoning protocol. The
brief's personas are therefore treated as role labels and mapped onto the skills as follows,
with the documents each role produced here:

| Persona (brief) | Skills | Output in this repo |
|---|---|---|
| **Noor** — orientation | `intent` (context mode, principles, anti-pattern catalog) | `docs/design/intent-strategy.md` §1 (project context, ethical stance) |
| **Ember** — strategy/research | `strategize`, `investigate`, `measure` | Strategy + hypothesis + bet ranking (`intent-strategy.md` §2), Goal-Signal-Metric table (§4) |
| **Wren** — journeys/wireframes/content | `journey`, `organize`, `wireframe`, `articulate`, `storytelling` | `docs/design/user-flows.md` (IA + flows + state inventory), voice rules in `design-system.md` §6 |
| **Vigil** — evaluation/accessibility/inclusion | `evaluate`, `include`, `fortify`, `localize` | `docs/design/intent-audit.md` (catalog sweep, a11y review, stress results) |
| Measurement & handoff | `measure`, `specify`, `blueprint`, `transpose`, `philosopher` | Measurement guardrails, component specs in `design-system.md` §5, architecture blueprint in `docs/architecture.md` |

## Model/agent equivalents

| Brief name | Role in brief | Mapped to | Notes |
|---|---|---|---|
| **Fable 5** | Planning, PRD, design system, high-fidelity flows | Claude Fable 5 (this agent) | Produced the PRD, design system, flows, and the implementation itself |
| **Opus 5** | Visual assets & animations | Claude Fable 5 + image-generation tooling + documented Lottie pipeline | App icon/splash generated; exercise-animation *style guide + pipeline + QA gate* delivered (`docs/design/animation-style-guide.md`); in-app procedural visuals (muscle diagram, charts, PR celebration) implemented in code so the app is complete without waiting on bulk animation production |
| **Grok 4.6 Extra High Fast** | Parallel implementation modules | Claude Fable 5 (sequential, shared-types coordination) | A single high-capability agent with a shared `src/domain/types.ts` contract replaced multi-agent parallelism; the module boundaries in `docs/architecture.md` are the ones parallel agents would have owned |

## Environment skills check

Per the brief's instruction to "install and use environment skills for Supabase/Clerk/Expo if
available": the environment provided a shadcn skill (web-only, not applicable), Cloud-Agent
environment skills (not applicable to app code), and no Supabase/Clerk/Expo-specific skills.
Current official best practices were followed instead: Clerk Expo SDK v2 with SecureStore token
cache; Supabase third-party-auth (`accessToken` callback, RLS on `auth.jwt()->>'sub'`, the
current recommended Clerk integration — no deprecated JWT template); Expo SDK 57 with Expo
Router, typed routes, and React Compiler enabled.
