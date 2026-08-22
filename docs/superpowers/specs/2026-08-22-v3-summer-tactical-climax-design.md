# V3 Summer Tactical Climax Design

Baseline: `integration/v3@9d5f6b711a806fd04af1497fb723d205019cfe92`
Lane: #89 World + Tactical
Lead: 04 Tactical

## Goal
Create four Guardian Festival Tactical identities without a new battle engine. Each route compiles into the existing `TacticalScenario` contract and delegates execution to the existing 3v3 engine.

## Campaign identities
- Caretaker: `forest_guardian`, survive 3 rounds, rescue + survive pressure.
- Pathfinder: `city_gallery`, escape after 2 completed rounds, scout + turn-limit + escape pressure.
- Vanguard: `city_core`, eliminate the elite target, elite + final chained-battle pressure.
- Arcanist: `lake_tempest`, standard terminal battle under relic resonance + break amplification + rule shift.

## Boundaries
- Reuse existing Expedition stage ids and Tactical scenario/modifier contracts.
- No new engine, map, shared game/save/App/Root wiring, or CharacterBondState mutation.
- Tactical exposes climax scenarios and combat terminal facts only.
- Lane B composition with 02 maps authoritative Tactical terminal facts into existing World Guardian Festival outcome reconciliation.
- Terminal commitment remains once-only via existing `scenarioId + attemptKey` canonical handoff.

## Verification
RED -> minimal climax catalog -> targeted Tactical + stability -> full -> `tsc -b` -> production build -> compose exact 02 candidate on `verify/v3-summer-world-tactical` -> four-route World/Tactical/World E2E -> full/stress/build.
