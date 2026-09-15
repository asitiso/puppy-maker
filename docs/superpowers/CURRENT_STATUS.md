# Puppy Maker Current Development Status

> This file is the handoff baseline for scheduled or agentic continuation. Repository code, CI, and newer commits remain authoritative if they disagree with this snapshot.

## Active branch

- Branch: `work/v16-living-regions`
- Pull request: #246 — V16 living regions foundation
- Last verified implementation baseline: `ad85a33eebf0ab02a244b5d4dca0e79e2aca41d7`
- Verification: GitHub Actions CI #2473 passed the full test suite and production build.
- Approved scope: `docs/superpowers/specs/2026-09-15-v16-world-expansion-living-regions-design.md`
- No newer approved design spec exists on this branch as of this baseline.

## Completed work

- V15 direct-movement exploration runtime remains canonical for outing traversal.
- The walkable crossroads exposes six spatially distinct destinations: `forest`, `village`, `lakeside`, `old_shrine`, `herb_hills`, and `expedition_outpost`.
- V16 persistent living-region state is additive, sanitised, save-compatible, and supports `unvisited → active → mainQuestInProgress → mainQuestResolved → postResolution`, discoveries, and completed interactions.
- Old Shrine, Herb Hills, and Expedition Outpost are all complete playable living-region vertical slices with authored NPCs, local main quests, conditional content, discoveries, persistent visual/revisit changes, original art, direct crossroads exits, and shared mobile/keyboard exploration runtime integration.
- Existing legacy `onOuting(location)` progression behavior remains unchanged for `forest`, `village`, and `lakeside`.
- `LivingRegionSceneFlow` uses the shared `livingRegionExplorationBuilders` registry for all three living regions.
- Cross-region integration coverage proves all living regions remain reachable and can progress through the shared persistent quest/revisit lifecycle.
- `regionRegistry` now owns authoritative crossroads portal metadata for every canonical region: interaction id, label, position, radius, and art source.
- `outingCrossroadsWorld` materializes its six portals from `regionRegistry` instead of duplicating destination metadata.
- Cross-module routing contracts lock `LEGACY_REGION_IDS` to legacy adventure progression, `LIVING_REGION_IDS` to living persistence/builders, and `REGION_IDS` to crossroads destinations.
- Canonical region type guards are available from `region-registry.ts` for future routing boundaries.

## Continuation rule

1. Start from the latest `work/v16-living-regions` HEAD and inspect PR #246 plus current CI before changing code.
2. Do **not** repeat V15 foundation/overworld work or any completed V16 region slice.
3. Do **not** rebuild Herb Hills or Expedition Outpost; both are complete and covered by integration contracts.
4. Treat the V16 design as completed scope unless a newer approved spec supersedes it.
5. Preserve existing `onOuting(location)` semantics and additive save compatibility.
6. Keep `regionRegistry` authoritative for canonical region/crossroads metadata; do not reintroduce hard-coded portal destination metadata elsewhere.
7. Keep living-region runtime builders separate from static metadata to avoid dependency cycles, and enforce registry/builder key completeness through tests.
8. Prefer product-complete integration batches over minimum patches: close runtime behavior, persistence, routing, regression coverage, and handoff state together.
9. Use focused tests while changing a subsystem, then run the full test/build gate at a meaningful integration boundary.

## Next highest-priority work

Run a V16 production-hardening pass rather than inventing a new V17 feature without an approved design. Highest value targets are:

- migrate remaining outing UI routing boundaries to the canonical region-registry guards where practical, without changing legacy `onOuting` behavior;
- strengthen save/reload integration coverage for all three living regions through resolved and post-resolution revisit states;
- verify mobile/keyboard portal entry and exit accessibility across all six crossroads destinations;
- fix only concrete regressions found by those checks, then record the next verified GREEN baseline here.
