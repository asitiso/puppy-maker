# Astral Rift Design

## Goal
Add a repeatable endgame combat loop after Celestial Ascension that turns Sanctuary, Astral Trial, Calling, and Ascension progress into an active challenge with persistent records and rewards.

## Role in the game
- Astral Trials remain deterministic monthly tests.
- Astral Rift is repeatable endgame content available from Celestial Ascension `awakened` onward.
- No online leaderboard. All records are personal and persistent.
- Existing monthly raising, expedition, Sanctuary, and Astral Trial flows must remain unchanged.

## Rift map
Six rifts, each with three intensities (I/II/III):
1. `nebula_garden` — Nebula Garden — unlock at Ascension score 12.
2. `lunar_ruins` — Lunar Ruins — unlock at score 12.
3. `comet_pass` — Comet Pass — unlock at score 28.
4. `eclipse_vault` — Eclipse Vault — unlock at score 28.
5. `starforge_core` — Starforge Core — unlock at score 48.
6. `empyrean_gate` — Empyrean Gate — unlock at score 72.

Intensity II requires an A-or-better clear of intensity I for that rift. Intensity III requires an A-or-better clear of intensity II.

## Rift power
`astralRiftPower` is derived; no duplicated power field is stored.
Inputs:
- Celestial Ascension score.
- Sanctuary Grand progress.
- active Calling mastery level.
- purchased Astral Blessing count.

Power formula:
- Ascension score × 2.
- Sanctuary Grand progress × 1.
- Calling mastery level × 8.
- Blessing count × 10.

## Challenge resolution
Each rift/intensity has a target power. Result grades are deterministic:
- S: power >= target + 30.
- A: power >= target + 10.
- B: power >= target.
- C: power below target.

A C result is a failed clear and grants no persistent clear record or Rift Echoes.

## Persistent records
Store best record per `riftId:intensity`:
- best grade.
- best power.
- clear count.
- first-clear flag is derived from record existence.

Replays may improve grade/power and increment clear count. First-clear rewards are granted once.

## Rift Echo currency
Successful clears grant Rift Echoes:
- Base by intensity: I=4, II=7, III=11.
- Grade bonus: B=0, A=2, S=4.
- First clear bonus: +3.

Rift Echoes are permanent across months/years.

## Rift Relics
Nine permanent Rift Relics, grouped into three branches with three tiers each:
- Vanguard branch: attack/pressure-oriented identity.
- Arcane branch: charge/magic-oriented identity.
- Wayfinder branch: exploration/resource-oriented identity.

Relics are purchased with Rift Echoes. Each branch is sequential: tier 2 requires tier 1, tier 3 requires tier 2. No duplicate purchases. Relic ownership is permanent.

Costs:
- tier 1: 15 Echoes.
- tier 2: 30 Echoes.
- tier 3: 50 Echoes.

Immediate purchase rewards are intentionally omitted; the relic itself is the reward. The first implementation exposes passive metadata only and does not mutate existing training/expedition formulas until a later dedicated balancing cycle.

## Weekly Rift Directives
Three deterministic directives per game week, derived from year/month/week:
- clear any Rift twice.
- earn A-or-better once.
- clear a featured Rift once.

Each directive rewards Rift Echoes once per weekly key. Progress is capped at target and duplicate rewards are impossible after save/load.

## Completion Honors
Permanent one-time honors:
- first_rift_clear: clear any Rift — 250G.
- six_rifts: clear all six rifts at any intensity — 2 Gems.
- six_rifts_s: earn S on all six rifts at any intensity — 600G + 2 Gems.
- full_intensity: clear all 18 rift/intensity combinations — 1200G + 4 Gems.

## UI
Integrate Astral Rift into `SanctuaryOverlay` as a dedicated section/tab using existing panel artwork and normal code-rendered text/progress.
Show:
- current Rift power and Ascension gate.
- six rifts and three intensity states.
- best grade/power.
- Rift Echo balance.
- weekly directives.
- nine relics with costs/prerequisites.
- completion honors.

No new decorative CSS illustration. Existing frame/image assets are reused.

## Save safety
New fields must hydrate safely from legacy saves:
- `astralRiftRecords` -> `{}`.
- `astralRiftEchoes` -> `0`.
- `purchasedAstralRiftRelics` -> `[]`.
- `astralRiftWeeklyKey` -> `null`.
- `astralRiftWeeklyProgress` -> `{}`.
- `rewardedAstralRiftDirectives` -> `[]`.
- `claimedAstralRiftHonors` -> `[]`.

Malformed IDs, negative numbers, duplicate relics, duplicate reward keys, and impossible intensity keys are sanitized.

## Architecture
Create focused pure modules:
- `astral-rift.ts`: definitions, power, unlocks, resolution, records, Echo rewards.
- `astral-rift-relics.ts`: relic definitions and purchase resolution.
- `astral-rift-weekly.ts`: deterministic weekly directives/progression.
- `astral-rift-honors.ts`: completion progress and one-time rewards.
- `astral-rift-ui.ts`: presentation summary.

Integrate persistence/reducer behavior in a thin outer `game.ts` layer or a new wrapper file if the current top-level reducer has grown too large. Do not rewrite inner historical engines.

## Testing
Use strict RED -> GREEN cycles.
Required coverage:
- map/unlock/intensity sequencing.
- deterministic power and grading.
- record upgrades and first-clear Echo reward.
- relic prerequisites/cost/deduplication.
- weekly deterministic directives/rewards.
- honor one-time rewards.
- hydration sanitization.
- reducer no-op identity on invalid/duplicate operations.
- full regression + production build.
