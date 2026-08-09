# Astral Rift Depth Design

## Goal
Turn the nine Astral Rift relics from collection-only rewards into meaningful permanent endgame passives, and add deterministic weekly Rift Mutators so repeat runs change week to week without random save-state rolls.

## Design choice
Use both permanent relic effects and weekly mutators.

Alternatives considered:
1. Relic effects only — strong long-term progression, weak weekly replay variety.
2. Weekly mutators only — strong variety, weak reason to collect all nine relics.
3. Combined system — recommended. Permanent relic progression changes account power/rewards while weekly mutators change the optimal Rift target and grading pressure.

## Relic passive effects
Effects apply only to Astral Rift unless explicitly noted. Existing monthly raising, Guardian Expedition, and Astral Trial formulas remain unchanged.

### Vanguard branch
- `vanguard_seed`: +8 Rift Power.
- `vanguard_core`: additional +10 Rift Power when challenging intensity II or III.
- `vanguard_crown`: first successful Rift clear each game week grants +3 bonus Echoes.

### Arcane branch
- `arcane_seed`: +5 Rift Power per purchased Astral Blessing, capped at +20.
- `arcane_core`: A or S Rift clears grant +2 Echoes.
- `arcane_crown`: S Rift clears grant an additional +3 Echoes.

### Wayfinder branch
- `wayfinder_seed`: weekly featured-Rift directive reward +2 Echoes.
- `wayfinder_core`: first clear of a new Rift/intensity grants +2 bonus Echoes.
- `wayfinder_crown`: every third successful Rift clear in a game week grants +5 Echoes once for that third-clear threshold. Only one threshold reward per week is required in this version; clears 6/9 do not add more rewards yet.

## Weekly Rift Mutators
A deterministic mutator is derived from year/month/week. No mutator ID is stored.

Four mutators rotate:
1. `surging_stars` — target power +15, successful clears +3 Echoes.
2. `gentle_orbit` — target power -10, no Echo bonus.
3. `prismatic_flux` — S threshold is target+20 instead of target+30; no Echo bonus.
4. `echo_storm` — target unchanged, all successful clears +2 Echoes.

The weekly key determines the mutator. Save/reload and backup recovery always produce the same mutator for that game week.

## Challenge resolution
`resolveAstralRift` remains the base grading engine.
A new pure depth resolver composes:
- base Rift power,
- purchased relic power bonus,
- weekly mutator target/S-threshold changes,
- base Echo reward,
- relic Echo bonuses,
- mutator Echo bonus.

Do not mutate the base `astral-rift.ts` grading constants in place. Keep the original domain stable and add an outer pure module so regression risk stays low.

## Weekly counters and dedupe
New persistent state:
- `astralRiftDepthWeekKey: string | null`
- `astralRiftWeeklyClearCount: number`
- `rewardedAstralRiftRelicWeekly: string[]`

Reward keys:
- `<weekKey>:vanguard_crown`
- `<weekKey>:wayfinder_crown`

When week key changes, clear count logically starts from zero. Old reward keys are retained for audit/dedupe safety.

## UI
Extend Astral Rift panel with:
- current weekly Mutator label + description.
- effective Rift Power showing relic contribution.
- per-relic passive description and whether active.
- next weekly relic-trigger hint (for Vanguard/Wayfinder crown).

No new illustrated assets. Existing Sanctuary/Rift panel artwork is reused; CSS only handles text/layout/status.

## Balance constraints
- Relic effects cannot alter non-Rift training, gifts, Guardian Expedition, Sanctuary or Astral Trial values.
- Maximum static relic power bonus is bounded and deterministic.
- Echo bonuses stack additively but only after a successful clear.
- C/failure always grants zero Echoes regardless of relic/mutator bonuses.
- Invalid or duplicate relic operations retain same-object no-op behavior.

## Persistence/hydration
Legacy saves default to:
- `astralRiftDepthWeekKey: null`
- `astralRiftWeeklyClearCount: 0`
- `rewardedAstralRiftRelicWeekly: []`

Hydration sanitizes malformed week keys, negative counts and invalid reward keys.

## Architecture
Create:
- `astral-rift-relic-effects.ts` — derived power/Echo effects from purchased relics.
- `astral-rift-mutators.ts` — deterministic weekly mutator and challenge modifiers.
- `astral-rift-depth.ts` — combines base challenge, relic effects and mutator into final clear result.
- `astral-rift-depth.test.ts` and focused module tests.

Integrate through the current outer `game.ts` by first preserving the current Rift implementation as `game-astral-rift-depth-base.ts`, then making a new thin wrapper own only the new weekly counters/dedupe if necessary.

## Testing
Strict RED → GREEN cycles:
- relic power effects and Echo effects.
- deterministic weekly mutators.
- modified grading boundaries.
- failure always zero Echoes.
- weekly crown reward dedupe.
- third-clear Wayfinder crown reward.
- hydration sanitization.
- week rollover behavior.
- UI summary mutator/relic status.
- full regression and production build.
