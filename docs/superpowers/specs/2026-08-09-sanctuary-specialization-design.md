# Sanctuary Specialization Expansion

## Goal
Turn the existing Starlight Sanctuary from a level-3 facility sink into a long-term strategic build system without replacing current facility upgrades, contracts, prestige, or weekly chests.

## Core Model
Each of the four sanctuary facilities unlocks one permanent specialization choice at level 3. Each facility has two mutually exclusive options, for eight total specializations.

### Training Hall
- `warrior_doctrine`: strengthens training-result growth and physical Guardian Calling play.
- `adaptive_drills`: grants a smaller all-training bonus and improves monthly Growth Point efficiency.

### Archive Library
- `mastery_codex`: improves mastery XP and high-quality training months.
- `living_chronicle`: boosts Season Journey/month-completion progress and record rewards.

### Herb Garden
- `moonwell_garden`: improves fatigue/stress recovery at month end.
- `bonding_grove`: improves bond-oriented gift/outings and relationship-scene recovery.

### Observatory
- `expedition_array`: improves expedition Journey rewards and selected expedition outcomes.
- `season_lens`: improves Season Journey and weekly Live Ops token flow.

## Unlock Rules
- Facility must be level 3.
- One specialization may be chosen per facility.
- Choice is permanent; a second option for the same facility is rejected.
- Unlock has no additional currency cost because reaching sanctuary Lv.3 is already the investment gate.
- Duplicate/invalid unlocks return the exact same state object.

## Synergies
Four derived cross-facility synergies activate when specific specialization pairs are selected:
- `guardian_academy`: warrior_doctrine + mastery_codex
- `living_haven`: bonding_grove + living_chronicle
- `star_route_network`: expedition_array + adaptive_drills
- `season_oracle`: season_lens + moonwell_garden

Synergies are derived, never separately stored.

## Gameplay Effects
Effects remain additive and bounded so they do not replace existing Calling, Sanctuary, Season Legacy, or Lifetime Legacy systems.

- Training specializations add small percentage/stat modifiers after existing training calculations.
- Mastery specializations add at most +1 extra mastery XP in eligible monthly outcomes.
- Recovery specializations reduce fatigue/stress by small fixed amounts at month transition.
- Bond specialization adds a small affection bonus only to explicit gift/outing bond actions; it must not modify balanced schedule synergy.
- Expedition specialization adds a small Journey bonus, not raw combat score.
- Season specialization adds a small weekly token/Journey bonus.
- Synergies add one additional focused bonus each; no synergy grants affection through training schedules.

## Persistence
Add `sanctuarySpecializations` as a sanitized partial record keyed by facility. Invalid options, invalid facilities, and duplicate/conflicting values are discarded during hydration. Existing saves hydrate to an empty specialization map.

## UI
Extend the existing Sanctuary UI rather than create another home entry.
- Lv.3 facilities show their two specialization choices.
- After selection, show the permanent chosen specialization and effect summary.
- Show active cross-facility synergies in a compact `SANCTUARY SYNERGY` block.
- Reuse existing sanctuary/popup art. No CSS-drawn decorative art.

## Architecture
Pure modules:
- `sanctuary-specializations.ts`: definitions, validation, unlock resolution, derived effects, synergies.
- tests for definitions, mutual exclusion, derived effects, hydration/reducer integration.

Integration:
- top-level `game.ts` owns persistence/action routing without changing `game-sanctuary-base.ts` behavior.
- existing Sanctuary UI receives one unlock callback from App/Root bridge.

## Testing
TDD order:
1. pure specialization definitions/unlock/synergy RED→GREEN
2. GameState hydration + permanent unlock RED→GREEN
3. gameplay-effect RED→GREEN for training/month/expedition/live-ops paths
4. UI summary and callback RED→GREEN
5. full test/build regression

## Non-goals
- no respec system
- no new currencies
- no new map
- no new illustrated assets
- no changes to PR base or merge state
