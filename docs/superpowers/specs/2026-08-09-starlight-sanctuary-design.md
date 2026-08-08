# Starlight Sanctuary Design

## Goal
Create a long-term home-base progression system that gives accumulated gold, expedition materials, and regional renown meaningful sinks while reinforcing the existing raising and expedition loops.

## Scope
Four permanent facilities, each level 0-3:

1. **Guardian Training Hall** — bounded monthly training growth bonus.
2. **Star Archive Library** — bounded mastery XP bonus.
3. **Moonlit Herb Garden** — bounded fatigue/stress recovery bonus on monthly rollover.
4. **Celestial Observatory** — bounded expedition/Season Journey bonus.

No new premium currency, no timers, no daily chores, no random construction failure, and no destructive downgrade/respec flow.

## Upgrade Rules
- Upgrades are sequential: level 0→1→2→3.
- Each upgrade spends gold plus one or more expedition materials.
- Level 3 additionally requires relevant regional renown thresholds.
- Regional renown is a requirement only and is never consumed.
- Invalid, duplicate, unaffordable, or prerequisite-breaking upgrades return the same state object.
- Upgrade state is permanent and safely hydrated from legacy saves.

## Economy
Costs should grow materially between levels so the system remains a long-term sink.

- Level 1: low gold + one-region material package.
- Level 2: medium gold + mixed material package.
- Level 3: high gold + all-region materials + regional renown gate.

The Sanctuary must not make normal Season Shop, crafting, or Calling progression obsolete.

## Effects
Effects are bounded and additive, not multiplicative with one another.

### Training Hall
- L1 +1% monthly training growth
- L2 +2%
- L3 +3%

### Archive Library
- L1 +0 mastery XP on normal months, but unlocks a small bonus on strong results
- L2 +1 mastery XP for A/S monthly result
- L3 +1 mastery XP for all completed months, capped to avoid skipping mastery progression excessively

### Herb Garden
- L1 extra fatigue recovery 1 at monthly rollover
- L2 fatigue recovery 1 + stress recovery 1
- L3 fatigue recovery 2 + stress recovery 1

### Observatory
- L1 +1 Season Journey point on successful expedition
- L2 +2
- L3 +3

## State
`sanctuaryLevels`:
- `trainingHall: 0|1|2|3`
- `library: 0|1|2|3`
- `garden: 0|1|2|3`
- `observatory: 0|1|2|3`

No duplicate derived ledger is stored.

## Architecture
- `src/starlight-sanctuary.ts`: definitions, costs, requirements, pure upgrade resolution, derived effects.
- `src/starlight-sanctuary.test.ts`: domain contracts.
- `src/sanctuary-progression.test.ts`: reducer/hydration/economy integration.
- `src/SanctuaryOverlay.tsx`: home overlay.
- `src/sanctuary.css`: layout/typography only, reusing existing panel art.
- `src/game.ts`: thin persistent-state/action bridge only.

## UI
Home gets a compact `STARLIGHT SANCTUARY` entry. The overlay shows four facilities, current level, next cost, requirement, effect, and upgrade action. Existing `/ui/popup_panel_frame.png` or other existing panel assets are reused. No CSS-drawn ornamental artwork.

## Testing
- Safe legacy hydration and malformed-level clamp.
- Sequential upgrade requirement.
- Insufficient gold/material no-op identity.
- Level-3 renown gate.
- Exact resource deduction.
- Duplicate/max-level same-state behavior.
- Effects are bounded at level 3.
- Monthly training/mastery/recovery integration.
- Expedition Journey integration.
- Existing monthly/expedition/economy regression suite remains green.

## Isolation
PR #2 remains draft and unmerged. This feature must not modify or depend on the separate `feat/season-legacy-v1` implementation branch beyond reading shared stable game state already present on PR #2.
