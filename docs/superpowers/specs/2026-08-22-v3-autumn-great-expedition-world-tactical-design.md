# V3 Autumn Great Expedition World + Tactical Design

## Scope
Autumn Lane B delivers one shared Great Expedition event with four campaign-specific objectives. It reuses existing Expedition regions/stages, the existing `CampaignEncounterDefinition -> TacticalScenario` adapter, and the current 3v3 engine. It does not implement Major Choice commit, Winter/Long Night, a new map, a new battle engine, or shared save wiring.

Authoritative baseline: `integration/v3@4933642fec103504ac7cf97192513058b37d20c3`.
Lane: #110. Work branches: `work/v3-autumn-world`, `work/v3-autumn-tactical`. Verify branch: `verify/v3-autumn-world-tactical`.

## Architecture
The implementation follows the Summer Lane B pattern with a thin Autumn layer.

1. `campaign-world.ts` gains Autumn Great Expedition objective definitions that reuse existing Expedition stages.
2. `world-history.ts` remains the single typed WorldFact registry. Add only stable facts required by Autumn consequences that are not already represented.
3. `autumn-campaign-world.ts` maps each campaign to a Great Expedition route and exposes a validated lookup. It consumes the existing `buildGreatExpeditionWorldPrerequisite` so no route is ready without a valid active campaign plus resolved Guardian Festival history.
4. `autumn-tactical-climax.ts` maps the four routes to existing TacticalScenario objective/modifier vocabulary. No new tactical engine behavior is introduced.
5. `autumn-world-tactical-lane.ts` is verification/lane glue only: it ensures World and Tactical campaign/stage identity match, maps terminal results to Great Expedition evidence, and exposes a pure canonical mapping from Autumn Major Choice option IDs to typed WorldFact IDs. It does not commit the Major Choice itself.

## Campaign identities
- Caretaker: rescue/protection/resource-sharing pressure. Great Expedition evidence records whether the team protected the critical person and shared responsibility. Choice-facing typed facts distinguish `save_one`, `spread_risk`, and earned `team_solution`.
- Pathfinder: ancient-route discovery/traversal under limited-action pressure. Reuse `ancient_route_opened`, `ancient_route_sealed`, `ancient_route_limited` for the three Autumn choices.
- Vanguard: elite/chained command pressure. Reuse `eiden_central_command` and `regional_alliance`; add one stable coalition-command fact for the earned third option.
- Arcanist: forbidden Relic/Rift/rule-shift pressure. Reuse `forbidden_relic_used`, `forbidden_relic_destroyed`, and add one controlled-use fact for the earned third option while preserving existing rift facts for environmental evidence.

## Stable World Facts
Add only these missing consequence IDs to the central registry:
- `caretaker_critical_person_saved`
- `caretaker_risk_shared`
- `caretaker_team_solution`
- `coalition_command`
- `forbidden_relic_controlled`

Existing facts remain authoritative where already available. Current/inherited arrays continue to hydrate through the central registry and remain separate.

## Great Expedition outcome/evidence contract
Lane B owns Great Expedition gameplay result and evidence, not Major Choice persistence. Terminal Tactical results use existing objective/battle result fields and once-only handoff semantics. Lane tests derive a bounded outcome/evidence record containing campaign, objective success/failure, battle result, surviving allies, damage, and typed evidence. Replayed terminal results must not produce a second handoff or overwrite the first result.

Major Choice consequence mapping is pure and typed:
`(campaign, choiceOptionId) -> readonly WorldFactId[]`.
Invalid cross-campaign option IDs return no mapping or throw at the boundary; they never synthesize a fallback string.

## Tactical mapping
Use only existing objective/modifier vocabulary already supported by `tactical-scenario.ts`.
- Caretaker: protect/survive + rescue pressure.
- Pathfinder: escape/traversal + scout + turn-limit pressure.
- Vanguard: target-elimination/standard with elite + chained-battle pressure.
- Arcanist: standard/target-elimination with relic-resonance + status-amplify + rule-shift pressure.

All scenarios set `failForward: true` and reuse existing Expedition stage IDs.

## Guardrails
- No direct `integration/v3` merge from feature/lane branches.
- No main/prod changes.
- No `App.tsx`, `Root.tsx`, shared game/save persistence edits in Lane B.
- No Winter/Long Night implementation.
- No Major Choice commit/runtime ownership; Lane C owns exactly-once choice state.
- No free-form World history strings.
- Preserve Guardian Festival history, current/inherited separation, Tactical sanitation, terminal once-only behavior, and AUTO boundedness.

## Verification
TDD order:
1. World objective/route contracts and typed WorldFact registry.
2. Great Expedition prerequisite gating and malformed campaign lookup.
3. Four Tactical climax definitions using existing stages/engine.
4. Lane E2E for all four campaigns: World route -> Tactical battle -> objective terminal -> once-only handoff -> Great Expedition evidence.
5. Choice-to-typed-fact mapping for all twelve Autumn options, including cross-campaign rejection.
6. Replay/re-entry cannot overwrite terminal evidence.
7. Current/inherited facts remain distinct and sanitation removes stale IDs.
8. Tactical stability and 10/50/100 AUTO stress remain GREEN.
9. Full test suite, `tsc -b`, and production build GREEN.

Lane B is complete only when exact 02/04 candidates are composed on `verify/v3-autumn-world-tactical` and the lane E2E is GREEN.