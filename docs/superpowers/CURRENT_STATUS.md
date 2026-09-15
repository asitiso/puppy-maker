# Puppy Maker Current Development Status

> This file is the handoff baseline for scheduled or agentic continuation. Repository code, CI, and newer commits remain authoritative if they disagree with this snapshot.

## Active branch

- Branch: `work/v16-living-regions`
- Pull request: #246 — V16 living regions foundation
- Last verified implementation baseline: `3fd292921bc5fe741904db750d10fdb5e59804f2`
- Verification: GitHub Actions CI #2507 passed full test + build on the current implementation HEAD.
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
- Focused native controls and typing targets keep their native keyboard behavior: Space/E no longer gets stolen by exploration actions on buttons/links, typing targets suppress exploration movement/actions, while ordinary focused controls still allow WASD movement.
- Story-frame modal focus is isolated from background exploration controls: while a story frame is active, exit, joystick, and action controls cannot be activated.
- Closing or cancelling a story frame now restores keyboard focus to the exploration controls so keyboard players can immediately resume traversal without restarting Tab navigation.
- Cross-region persistence coverage performs real `pick → JSON.stringify → JSON.parse → hydrate` roundtrips for every living region across active, quest-in-progress, discovery, resolved, and post-resolution revisit states.
- All three living regions retain discoveries and completed interaction IDs across reload and still expose their repeatable post-resolution revisit content.
- Six-region accessibility integration coverage verifies one physical crossroads portal for every playable region and an explicit in-world exit for every legacy/living region, including all living-region persistence phases.
- Production-hardening source contracts ensure future UI changes do not reintroduce component-local routing guards or accidentally route living regions through legacy `onOuting` progression.
- Release-readiness pass labels nearby in-world exits as `돌아가기` instead of the misleading generic `조사` action while preserving portal `이동` and story `조사` semantics.
- Short mobile-landscape exploration constrains the center prompt to `min(46vw, 350px)`, preserving a readable center lane between the left joystick and right action control without shrinking either thumb target.
- Expedition Outpost moved Supply Officer Ara and the opening patrol briefing out of tent collision interiors into comfortably walkable foreground positions; regression coverage requires at least 24 px of player-center clearance beyond the expanded tent collision boundary.
- Herb Hills interaction placement was reworked so opening and revisit interactions sit in open walkable space rather than crowding shed/stone-wall collision edges.
- Post-resolution revisit presentation was re-audited across Old Shrine, Herb Hills, and Expedition Outpost; each already has changed objective copy, persistent world/object changes, repeatable revisit content, and dedicated revisit framing, so no cosmetic churn was added.
- Repository-tree inspection found no dedicated historical save fixture/snapshot files. Existing migration/legacy-matrix tests and living-region JSON roundtrip coverage remain the compatibility boundary rather than adding synthetic fixtures without a concrete failure case.

## Continuation rule

1. Start from the latest `work/v16-living-regions` HEAD and inspect PR #246 plus current CI before changing code.
2. Do **not** repeat V15 foundation/overworld work, completed V16 region slices, registry consolidation, routing hardening, keyboard hardening, focused-control handling, story-modal focus isolation/restoration, save/reload integration, or completed release-readiness fixes above.
3. Treat the V16 design as completed implementation scope unless a newer approved spec supersedes it.
4. Preserve existing legacy `onOuting(location)` semantics and additive save compatibility.
5. Keep `regionRegistry` authoritative for canonical region/crossroads metadata and `outing-navigation.ts` authoritative for player-facing outing scene classification.
6. Keep living-region runtime builders separate from static metadata to avoid dependency cycles, and enforce registry/builder key completeness through tests.
7. Preserve the tested keyboard contract: arrows/WASD move, Space/E interact away from native controls, focused controls keep native action keys, Escape backs out, blur clears held movement, active story frames isolate background controls, and closing/cancelling a story restores exploration focus.
8. Prefer product-complete integration batches over minimum patches: close runtime behavior, persistence, routing, regression coverage, and handoff state together.
9. Use focused tests while changing a subsystem, then run the full test/build gate at a meaningful integration boundary.

## Next highest-priority work

V16 implementation, production-hardening, and current release-readiness fixes are GREEN through CI #2507. Before inventing V17 without an approved design, continue only evidence-driven release work:

- perform a true player-facing outing playthrough on representative mobile landscape sizes across crossroads + all six regions, looking only for reproducible interaction, camera, readability, or return-flow friction not already covered by the current contracts;
- verify performance and accessibility behavior around expanded six-region traversal and story-frame overlays, fixing only concrete regressions;
- add historical save fixtures only if an actual older-save incompatibility is reproduced; do not create synthetic fixture maintenance without a protected boundary;
- after any additional release-readiness change, run the same RED → minimal fix → full test/build → CI gate and advance this baseline only after GREEN.