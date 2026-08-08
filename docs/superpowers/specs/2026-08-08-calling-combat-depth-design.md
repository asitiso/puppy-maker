# Calling Combat Depth Design

## Goal
Make Guardian Calling choices meaningfully alter expedition play and long-term progression without changing the existing monthly loop or introducing a new screen hierarchy.

## Scope
- Grant Calling mastery from successful expedition use of that Calling's specialist action.
- Implement all eight existing Calling Signature definitions as real effects.
- Implement all four Tier-4 Legend trait effects.
- Implement Pathfinder discovery acceleration and discovery/material bonuses.
- Surface concise Calling effect feedback in the existing Raising Identity and Expedition result UI.

## Non-goals
- No new currencies.
- No new expedition regions or stages.
- No new character art or CSS-drawn decorative illustrations.
- No merge to base/main.

## Specialist action mastery
Each Calling has one specialist expedition action:
- Vanguard -> attack
- Arcanist -> charge
- Caretaker -> dodge
- Pathfinder -> any action, but only when the stage yields a discovery or material bonus.

A successful expedition stage clear grants +1 Calling mastery when the active Calling participated through its specialist condition. Mastery is awarded at most once per stage attempt.

The expedition finish action receives specialist action counts from the battle UI so the reducer can make the award deterministically.

## Signature effects
Existing signature definitions become operational:
- rally_strike: first attack in an expedition +8%.
- guardian_breaker: attack +6% on boss stages.
- mana_echo: first charge +8%.
- astral_core: charge +6% on boss stages.
- gentle_guard: first dodge pressure guard +10%.
- heart_anchor: expedition finish stress delta -2.
- trail_reading: normal-stage first clear material +1.
- star_compass: completing a region grants that region material +1.

Only signatures for the active Calling are applied.

## Tier-4 Legend effects
- vanguard_legend: reduce fatigue from the first expedition clear of the month by 2.
- arcanist_legend: A/S expedition discovery lowers stress by 2.
- caretaker_legend: when a new bond scene unlocks, reduce stress by 4.
- pathfinder_legend: first new outing discovery of the month grants +100G.

Monthly one-shot Legend effects need persisted reward keys so reloads cannot duplicate them. Legacy saves hydrate to safe empty defaults.

## Pathfinder discovery acceleration
When active Calling is Pathfinder with pathfinder_eye, outing exploration outcome evaluates as if location XP were +3. This only affects event/discovery eligibility; stored exploration XP still increases by the normal +1.

## Data additions
Persist only minimal dedupe state:
- `legendRewardKeys: string[]`

Key format is deterministic: `<year>-<month>:<effect-id>`.

No transient battle counters are persisted.

## UI feedback
Raising Identity overlay shows which signatures and Legend effects are active.
Expedition result adds a compact `Calling` row when mastery/signature/Legend bonuses were applied.
No new full-screen navigation layer is introduced.

## Testing
TDD first:
1. combat signature modifiers and first-action behavior,
2. specialist Calling mastery on clear,
3. trail_reading/star_compass rewards,
4. four Legend effects with one-shot dedupe,
5. pathfinder_eye discovery acceleration,
6. hydration/reset persistence,
7. existing full regression + production build.
