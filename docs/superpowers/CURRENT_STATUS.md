# Puppy Maker Current Development Status

> This file is the handoff baseline for scheduled or agentic continuation. Repository code, CI, and newer commits remain authoritative if they disagree with this snapshot.

## Active branch

- Branch: `work/v16-living-regions`
- Pull request: #246 — V16 living regions foundation
- Last verified implementation baseline: `728dbaa80dcaaa2153606fa21214f0637a33f444`
- Verification: GitHub Actions CI #2487 passed the full test suite and production build.
- Approved scope: `docs/superpowers/specs/2026-09-15-v16-world-expansion-living-regions-design.md`
- No newer approved design spec exists on this branch as of this baseline.

## Completed work

- V15 direct-movement exploration runtime remains canonical for outing traversal.
- The walkable crossroads exposes six spatially distinct destinations: `forest`, `village`, `lakeside`, `old_shrine`, `herb_hills`, and `expedition_outpost`.
- V16 persistent living-region state is additive, sanitised, save-compatible, and supports `unvisited → active → mainQuestInProgress → mainQuestResolved → postResolution`, discoveries, and completed interactions.
- Old Shrine, Herb Hills, and Expedition Outpost are complete playable living-region vertical slices with authored NPCs, local main quests, conditional content, discoveries, persistent visual/revisit changes, original art, direct crossroads exits, and shared mobile/keyboard exploration runtime integration.
- Existing legacy `onOuting(location)` progression behavior remains unchanged for `forest`, `village`, and `lakeside`.
- `LivingRegionSceneFlow` uses the shared `livingRegionExplorationBuilders` registry for all three living regions.
- `regionRegistry` owns authoritative canonical-region and crossroads portal metadata; `outingCrossroadsWorld` materializes all six portals from it.
- Cross-module contracts lock `LEGACY_REGION_IDS` to legacy adventure progression, `LIVING_REGION_IDS` to living persistence/builders, and `REGION_IDS` to crossroads destinations.
- `outing-navigation.ts` is now the canonical UI routing boundary for crossroads, legacy regions, and living regions. `MobileLegacyFeaturePage` no longer carries duplicate local destination/type guards.
- Portal destination parsing rejects unknown destinations and derives destination titles from the canonical region registry.
- `exploration-keyboard.ts` centralizes tested arrows/WASD movement, Space/E interaction, and Escape exit behavior. Repeated action/exit commands are suppressed while movement remains repeatable.
- `MobileExplorationScene` clears keyboard/joystick movement state on browser focus loss and preserves both touch exit and keyboard Escape return paths.
- Cross-region persistence coverage now performs real `pick → JSON.stringify → JSON.parse → hydrate` roundtrips for every living region across active, quest-in-progress, discovery, resolved, and post-resolution revisit states.
- All three living regions retain discoveries and completed interaction IDs across reload and still expose their repeatable post-resolution revisit content.
- Six-region accessibility integration coverage verifies one physical crossroads portal for every playable region and an explicit in-world exit for every legacy/living region, including all living-region persistence phases.
- Production-hardening source contracts ensure future UI changes do not reintroduce component-local routing guards or accidentally route living regions through legacy `onOuting` progression.

## Continuation rule

1. Start from the latest `work/v16-living-regions` HEAD and inspect PR #246 plus current CI before changing code.
2. Do **not** repeat V15 foundation/overworld work, any completed V16 region slice, registry consolidation, routing hardening, keyboard hardening, or save/reload integration work.
3. Treat the V16 design as completed implementation scope unless a newer approved spec supersedes it.
4. Preserve existing legacy `onOuting(location)` semantics and additive save compatibility.
5. Keep `regionRegistry` authoritative for canonical region/crossroads metadata and `outing-navigation.ts` authoritative for player-facing outing scene classification.
6. Keep living-region runtime builders separate from static metadata to avoid dependency cycles, and enforce registry/builder key completeness through tests.
7. Preserve the tested keyboard contract: arrows/WASD move, Space/E interact, Escape backs out, and blur clears held movement.
8. Prefer product-complete integration batches over minimum patches: close runtime behavior, persistence, routing, regression coverage, and handoff state together.
9. Use focused tests while changing a subsystem, then run the full test/build gate at a meaningful integration boundary.

## Next highest-priority work

V16 implementation and production-hardening are now GREEN. Before inventing V17 without an approved design, use the next batch for release/readiness quality work:

- perform player-facing end-to-end outing playthrough validation across crossroads + all six regions, prioritizing mobile landscape readability, interaction reachability, back/exit consistency, and post-resolution revisit clarity;
- inspect concrete visual/UX friction found by that playthrough and fix it as one coherent polish batch rather than isolated cosmetic patches;
- verify save compatibility against representative older V15/V16 snapshots if fixtures exist, and add fixtures only where they protect a real compatibility boundary;
- keep performance and accessibility regressions within the same release-readiness gate, then run the full test/build gate and update this baseline only after GREEN.
