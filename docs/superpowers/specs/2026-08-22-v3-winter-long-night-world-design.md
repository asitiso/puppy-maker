# V3 Winter Long Night World Design

## Scope

World-owned Long Night input and consequence contracts for Winter Lane B.

## Inputs

The adapter consumes an `AutumnChoiceCommitment` and `WorldHistoryState`. The commitment and matching typed current-run World Fact must agree. Inherited facts are kept separate and cannot satisfy current-run evidence.

## Campaign mapping

- Caretaker → existing `forest_guardian`, preservation crisis, responsibility-sharing adjustment.
- Pathfinder → existing `city_core`, unstable-route crisis, route-history adjustment.
- Vanguard → existing `city_core`, command siege, authority/coalition adjustment.
- Arcanist → existing `lake_tempest`, Reality/Rift/Memory crisis, forbidden-relic adjustment.

## Outcomes

Registered `long_night` outcomes map to typed fail-forward World consequence categories. Defeat is valid and resolves the run rather than creating a retry-only dead end.

## Boundaries

No Tactical engine changes, persistence changes, shared game/save state changes, Ending UI, or NG+ work. 04 consumes this contract and owns Lane B composition.
