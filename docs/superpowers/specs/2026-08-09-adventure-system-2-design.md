# Adventure System 2.0 Design

## Goal
Turn the ten existing adventures into distinct, replayable mobile minigames while retaining five shared engines and connecting player skill, Runa growth, rewards, collection, memory and ending progression.

## Architecture
Keep `src/game/adventure/runtime.ts` as the deterministic engine layer. Add stage-rule configuration and progression helpers rather than ten unrelated game implementations. `AdventureRunner` renders engine-specific play and stage-specific modifiers; reducer/world-state remains authoritative for permanent rewards and records.

## Player loop
World Hub → stage intro → 20–45 second minigame → live judgement/combo/fever → result rank → first-clear/mastery rewards → memory/collection/progression → World Hub.

Cancelling before completion never consumes the adventure. A low score still completes with a C-grade reward so campaign flow cannot dead-end.

## Ten stage identities
1. Forest Path — clue-driven route choices; wrong routes cost score and break combo.
2. Moon Garden — precision timing; shrinking perfect windows at higher months.
3. Crystal Creek — rapid good-target collection while avoiding hazards.
4. Village Market — short request/memory sequence with choice finish.
5. Whispering Grove — increasingly long sequence recall.
6. Sunset Field — reaction rounds combining target avoidance and timing pressure.
7. Old Shrine — rune/sequence puzzle with intelligence assistance.
8. Cloud Bridge — balance control with increasingly unstable drift.
9. Starlight Hill — target collection with streak and hazard pressure.
10. Guardian Sanctum — multi-phase final trial rotating timing, target, sequence, balance and choice mechanics.

## Shared mastery systems
- Judgements: PERFECT / GOOD / MISS.
- Combo and best combo.
- Perfect streak milestone bonus.
- Fever activates after a clean streak and temporarily multiplies scoring.
- Session quality: CLEAR / GREAT / MASTER.
- Stage records: best score, best grade, mastery status and first-clear status.
- Difficulty scales by campaign month but never blocks progression.

## Runa growth assistance
Existing stats provide small, bounded assistance instead of replacing player skill: magic widens timing precision, strength softens reaction penalties, intelligence supplies puzzle tolerance, calmness stabilizes balance, affection grants limited recovery. Assistance must remain visible in result explanation and capped so a high-stat Runa cannot auto-win.

## Rewards and collection
Base completion rewards remain compatible with existing world reward flow. Add one-time first-clear bonus and meaningful S/MASTER milestones using existing currencies/materials/collection structures where possible. Do not create a second economy. Mastery contributes to collection completion and explorer-ending weight.

## Guardian Sanctum
Unlocked late in the campaign and implemented as a phase controller over existing engines, not a sixth engine. It has five short phases and a final aggregate result. Failure in a phase reduces final score but does not restart the whole trial.

## Mobile UX
One-hand portrait play is the baseline. Primary controls are at least 48px high, no precision drag requirement, safe-area aware, and resilient on short screens. Runa feedback uses existing assets. Dynamic text, score and progress remain code-rendered.

## Persistence
Persist only completed permanent records. Do not persist frame-level or in-progress minigame state. App interruption restarts the minigame without consuming the adventure. Save migration supplies safe defaults for new mastery fields.

## Testing
TDD for runtime mechanics, stage rules, difficulty, rewards, persistence and Guardian phases. Add campaign-level regression proving all ten stages can complete across twelve months without corrupting the schedule→training→dialogue→result→next month→Layered Home loop. Final verification requires full tests and production build; CI/Preview success may only be reported after observed success.

## Constraints
No PR/main merge. Preserve existing core game data and compatibility. Prefer reusable rules over duplicated stage code. Do not add systems whose player benefit is marginal relative to maintenance cost.