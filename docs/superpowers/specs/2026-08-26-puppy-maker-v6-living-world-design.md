# Puppy Maker V6 Living World — Generational World Evolution Design

## Status
Approved architecture for issue #192.

## Baseline
- Production: `main@64accdd681758ff236f2899ea0d82bf6b11794fa`
- Production tree: `767ab02b30a77dd397e75529297b6f60115bbdfb`
- Integration equivalent: `integration/v3@797af92c8f2646eae45df74f7726c14a27f85b55`
- Work branch: `work/v6-living-world`

## Product Goal
V4 made time advance week by week. V5 made lives advance generation by generation. V6 makes the world itself remember those generations.

The player should be able to begin a later generation and immediately feel that earlier choices changed the setting: traditions persist, roads stay open, alliances become institutions, rift damage leaves scars, public works reshape future opportunities, and familiar NPCs appear in different social roles. These changes must be primarily narrative, availability and world-presentation changes rather than inherited combat/economy power.

## Core Invariants
1. `worldHistory.currentFacts` and `worldHistory.inheritedFacts` remain authoritative typed World Fact evidence and remain separate.
2. `NEW_RUN` remains NG+ only. V6 must not redefine it.
3. `START_NEXT_GENERATION` remains lineage only and must not become an NG+ alias.
4. V4 remains the sole weekly calendar engine: `SELECT_WEEKLY_FOCUS -> COMPLETE_WEEKLY_FOCUS -> ADVANCE_WEEK`.
5. Week 4 continues to reuse existing `NEXT_MONTH` settlement. V6 must not create another month clock.
6. `hubNextAction` remains the sole primary CTA selector.
7. No generation may inherit raw strength, intelligence, magic, gold, gems, inventory, tactical power, expedition power or similar numeric progression.
8. True ancestry never auto-selects or auto-unlocks True Path.
9. Hollow ancestry never inherits current-run danger evidence or auto-selects/auto-unlocks Hollow Path.
10. All new persisted collections are canonical, deduplicated and bounded.

## Domain: Generational World
Create `src/generational-world.ts` as the single owner of V6 long-world state.

### Canonical legacy markers
```ts
export const legacyWorldMarkerIds=[
  'festival_tradition',
  'open_road_network',
  'regional_compact',
  'restored_riftward',
  'forbidden_legacy',
  'hollow_scar',
] as const;
```

Meaning:
- `festival_tradition`: repeated preservation of the festival became a durable local tradition.
- `open_road_network`: opened/limited ancient routes became maintained routes and travel culture.
- `regional_compact`: alliances and coalition leadership became an institution rather than one-run cooperation.
- `restored_riftward`: repeated rift stabilization produced permanent civic monitoring/restoration practice.
- `forbidden_legacy`: forbidden relic use/control survived in collective memory and creates suspicion/taboo hooks.
- `hollow_scar`: Hollow outcomes left visible social/spatial damage without inheriting Hollow danger mechanics.

Markers are derived deterministically from lineage ancestor `majorWorldFacts` plus inherited world history. Derivation has no random selection and therefore no reload reroll. The state stores the derived marker list for save stability, but hydration always canonicalizes it and caps it at six.

### Public projects
```ts
export const publicProjectIds=[
  'guardian_academy',
  'ancient_road_restoration',
  'regional_council',
  'rift_watch',
] as const;
```

Only one project may be active at a time. Projects do not grant permanent raw stat multipliers. They produce narrative/world affordances: weekly event variants, NPC presence/roles, project completion records and compact Chronicle copy.

Project state:
```ts
export type GenerationalWorldState={
  legacyMarkers:LegacyWorldMarkerId[];
  activeProject:PublicProjectId|null;
  projectProgress:number;
  completedProjects:PublicProjectId[];
};
```

Bounds:
- `legacyMarkers.length <= 6`
- `projectProgress` finite integer, clamped to `0..100`
- `completedProjects` canonical, unique, bounded to four initial project IDs
- completing a project clears `activeProject` and resets progress to zero
- completed projects cannot be started again in the first V6 implementation

### Marker derivation
Use evidence, not generation number alone.

Initial deterministic rules:
- `festival_tradition`: at least one ancestor/inherited fact has `festival_saved`, and no stronger contradictory current evidence needs to erase history.
- `open_road_network`: evidence contains `ancient_route_opened` or `ancient_route_limited`.
- `regional_compact`: evidence contains `regional_alliance` or `coalition_command`.
- `restored_riftward`: evidence contains `rift_stabilized` or `true_path_world_rewoven`.
- `forbidden_legacy`: evidence contains `forbidden_relic_used` or `forbidden_relic_controlled`.
- `hollow_scar`: evidence contains `hollow_shortcut_taken` or `hollow_rift_entrenched`.

Registry order determines output order. Duplicate evidence never duplicates a marker.

## Weekly Integration
V6 does not add a new weekly action type for time progression.

When `COMPLETE_WEEKLY_FOCUS` succeeds:
- existing weekly event resolution happens exactly once as today;
- if selected focus is `world` and there is an active public project, add deterministic project progress exactly once for that canonical week;
- project contribution is independent of reload because completion is already keyed by the canonical week and repeated completion is a no-op;
- initial contribution is a constant 10 points per successfully completed `world` focus week.

No contribution occurs for non-world focuses.

Project completion is resolved by the same reducer call that applies the successful weekly focus contribution. Crossing 100 clamps at completion, records the project once, clears active project and leaves the week otherwise unchanged.

## Generation Transition Integration
`START_NEXT_GENERATION` already builds an `AncestorRecord` then resets into `initialState` with preserved `lineage`.

V6 adds one carefully bounded bridge:
1. Build the ancestor as V5 already does.
2. Derive the next generation legacy markers from the new lineage ancestry plus inherited evidence.
3. Preserve completed public projects as narrative world legacy records.
4. Clear any in-progress active project and progress on generation change. A partially built civic project does not magically finish in the child generation.
5. Continue to reset all raw power/economy exactly as V5 does.

`NEW_RUN` preserves `generationalWorld` because NG+ is replay of the same lineage/world history, but current-run World Facts and Hollow danger behavior continue to follow their existing reset rules.

## Living NPC Integration
Extend `LivingNpcContext` with:
```ts
generation:number;
legacyMarkers:readonly LegacyWorldMarkerId[];
completedProjects:readonly PublicProjectId[];
```

Initial behavior changes are deliberately small and deterministic:
- completed `guardian_academy` can surface `eiden` as an institutional mentor when space allows;
- `regional_compact` or completed `regional_council` can surface `noa` more consistently as a civic coordinator;
- `hollow_scar` may surface `lyra` in non-Hollow later-generation weeks as an echo/witness, but never `veyr` unless the active route is actually Hollow;
- active-route primary representative remains first and existing max-three presence bound remains.

This keeps V6 from inventing a second NPC simulation system.

## Weekly Event Integration
Extend `WeeklyLifeContext` with optional legacy/project context. Keep the event registry typed and deterministic.

Add only the minimum first-wave variants:
- `academy_drill` for `world` focus when `guardian_academy` completed;
- `legacy_road_patrol` for `world` focus with `open_road_network` or completed `ancient_road_restoration`;
- `rift_watch_rounds` for `world` focus with completed `rift_watch` or `restored_riftward`;
- `scarred_district` for non-Hollow `world` focus with `hollow_scar` in generation > 1.

Priority must preserve route semantics:
1. active Hollow route -> existing `rift_whisper`
2. active True campaign -> existing `old_echo`
3. lineage/legacy world variants
4. existing life-stage/world focus variants
5. existing by-focus default

Effects remain modest current-run weekly effects only; no permanent inherited multipliers.

## Presentation: World Chronicle
Create a compact `WorldChronicle` component and small stylesheet. It is a secondary view only.

Shows:
- generation number;
- up to three active legacy marker labels;
- active public project and progress, or a completed-project summary;
- one short “why this world is different” sentence derived from canonical markers.

It must not introduce another `.lh-primary-action` or another next-action priority tree.

Mobile/accessibility requirements:
- readable at 360, 390 and 430 CSS px widths;
- no horizontal overflow;
- touch controls >=44px where controls exist;
- keyboard focus visible;
- no essential motion; respect existing reduced-motion patterns;
- safe-area behavior inherited from the existing overlay/container layout.

## Persistence and Sanitization
`hydrateGenerationalWorldState(raw)` must:
- fall back to empty state for non-record input;
- retain only canonical markers/projects;
- dedupe using registry order;
- clamp malformed/non-finite progress to 0..100;
- reject an active project already in completed projects;
- if active project is null, normalize progress to 0.

No unbounded event history is added in V6.

## Soak / Release Gate
Before promotion, a V6 soak must cover at least five generation transitions while exercising:
- repeated world focus contributions;
- project completion and duplicate completion protection;
- save/reload between generations;
- malformed generational world hydration;
- marker derivation from multiple ancestors;
- True ancestry without automatic True activation;
- Hollow ancestry without inherited danger/automatic Hollow activation;
- NG+ preserving long-world state while existing NG+ current-run resets remain green;
- recursive finite-number invariant;
- existing V4 48-week cadence remains intact.

Release gate:
1. targeted V6 suites green;
2. full test suite green;
3. `npm audit` zero vulnerabilities;
4. `tsc -b && vite build` green;
5. merge exact verified work tree into `integration/v3`;
6. verify integration CI/preview;
7. merge release PR to main without force;
8. verify exact main SHA CI;
9. verify production deployment exact SHA READY, root 200, telemetry API 200 and no post-release error/fatal logs;
10. close #192 only after production evidence is recorded.
