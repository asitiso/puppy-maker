# V3 Spring World Implementation Plan

**Baseline:** `integration/v3@46faf9031a86ff09d92cc17ee043e9180414d510`

## Guardrails

- Reuse the existing 3 Expedition regions and 9 stages; do not create campaign-specific maps.
- Reuse `GuardianCallingId` for Caretaker / Pathfinder / Vanguard / Arcanist campaign identity.
- Keep Spring World as a pure adapter/model layer. Do not edit App, Root, shared game/save, or 05 UI.
- Preserve existing Expedition correctness and accessibility/UI behavior.
- Prepare Great Expedition prerequisites only; do not implement Autumn Great Expedition gameplay.

## Tasks

1. Add a typed `WorldFactId` registry with canonical IDs only.
2. Add sanitation for stale, malformed, unknown, and duplicate fact IDs.
3. Model current-run facts and inherited echoes as separate collections and never merge echoes into current-run outcomes.
4. Add Spring/Summer campaign World objective definitions over existing Expedition regions/stages.
5. Add a fail-forward canonical outcome contract (`victory`, `defeat`, `costly`, `exceptional`) with once-only resolution and Story/Ending-consumable records.
6. Add a Great Expedition prerequisite snapshot that carries campaign, current facts, inherited echoes, and resolved Spring/Summer outcomes without starting Autumn gameplay.
7. Verify targeted World tests, full suite, `tsc -b`, and production build. Push only to `work/v3-spring-world` and open a Draft PR against `integration/v3`.

## TDD order

For each behavior: RED regression test → confirm failing CI → minimal production adapter/model → confirm GREEN → continue.
