# Celestial Convergence Design

## Goal
Create the next late-game loop after Astral Rift: a deterministic guardian challenge system that reuses Astral Rift, Sanctuary, Calling and Ascension progress instead of introducing a parallel stat grind.

## Scope
- Four Celestial Guardians: Dawn Stag, Moon Crane, Storm Wolf, Star Fox.
- Three intensities per guardian for 12 total challenges.
- Entry requires late Astral Rift progression; higher intensities require deeper Rift records.
- Deterministic Convergence Power derived from Celestial Ascension, Sanctuary Grand progress, Calling mastery, Astral Rift clears and Rift Relics.
- Personal best records by guardian/intensity: best grade, best power, clear count.
- Permanent Guardian Sigils earned from first clears; Sigils are a spendable endgame currency only for Convergence rewards.
- Eight sequential Guardian Boons purchased with Sigils.
- Deterministic weekly Convergence directives generated from year/month/week.
- Four one-time Convergence honors for first clear, all guardians, all intensity-3 clears and all-S completion.
- Dedicated Convergence overlay added to the existing Sanctuary/Astral endgame hub.

## Challenge Rules
- Grades are B/A/S only; failed attempts do not mutate state.
- First clears grant more Sigils than repeat clears.
- A higher personal-best grade/power overwrites only the best fields; clear count always increments on success.
- Intensity 1 requires at least 6 Astral Rift clears total.
- Intensity 2 requires that guardian's mapped Rift family to have an intensity-2 clear.
- Intensity 3 requires 12 total Rift clears and at least 6 purchased Rift Relics.

## Guardian Mapping
- Dawn Stag -> strength / Vanguard bias.
- Moon Crane -> magic / Arcanist bias.
- Storm Wolf -> exploration / Pathfinder bias.
- Star Fox -> bond / Caretaker bias.

The bias is additive and small. It rewards identity without making one Calling mandatory.

## Power Formula
Convergence Power is deterministic and capped only by upstream systems:
- Celestial Ascension score × 2
- Sanctuary Grand progress
- Calling mastery level × 5
- Astral Rift successful clear count × 2
- purchased Rift Relics × 4
- active guardian/Calling affinity bonus +12 when matched

## Rewards
- Successful clear: 2/3/5 Guardian Sigils for B/A/S.
- First clear bonus: +3 Sigils.
- Weekly directive completion: +2 Sigils each, once per week.
- Guardian Boons cost 5, 8, 12, 16, 22, 30, 40, 55 Sigils in sequence.
- Boons grant immediate gold/gem rewards only; passive combat bonuses are deliberately excluded from this first version to avoid circular endgame scaling.

## Weekly Directives
Three deterministic directives rotate from year/month/week:
- clear 2 Convergence battles
- earn one A/S grade
- clear the featured guardian

Each directive has its own persistent rewarded key.

## Honors
- First Convergence: 500G
- Four Guardians: 2 Gems
- Intensity-3 Quartet: 1000G + 3 Gems
- All-S Convergence: 1500G + 5 Gems

Honors are persistent and deduped.

## Persistence
Add fields with safe hydration defaults:
- `celestialConvergenceRecords`
- `guardianSigils`
- `purchasedGuardianBoons`
- `convergenceWeeklyKey`
- `convergenceWeeklyProgress`
- `rewardedConvergenceDirectives`
- `claimedConvergenceHonors`

All invalid ids, negative numbers and malformed keys are sanitized.

## Architecture
New pure modules own rules:
- `celestial-convergence.ts`
- `guardian-boons.ts`
- `convergence-weekly.ts`
- `convergence-honors.ts`

`game.ts` remains the top persistence/reducer integration layer. Existing lower game layers remain untouched.

## UI
Extend the existing late-game Sanctuary/Astral overlay instead of creating another home button. Show:
- Convergence Power and Sigils
- four guardian cards with three intensity buttons each
- personal records
- weekly directives
- boon purchase track
- honor progress

Reuse existing popup/panel assets. No CSS-drawn decorative fantasy art.

## Testing
TDD for every domain module, then reducer integration, then UI summary/build regression. Existing Astral Rift tests must remain unchanged and GREEN.
