# V16 World Expansion & Living Regions Design

> Status: Approved. This document defines the next architectural scope after the completed V15 Mobile RPG foundation and outing overworld work.

## Summary

V15 converted outings from a destination list into direct movement with a walkable crossroads and three playable regions: forest, village, and lakeside. V16 expands that foundation into a larger, denser exploration layer.

The goal is not to maximize map count. The goal is to add **larger world coverage with region-level completeness**, so every new destination has a distinct play identity, meaningful NPCs, discoveries, a local quest, visible state change, and a reason to revisit.

The first V16 wave adds three living regions:

- `old_shrine` — mystery, ruins, seals, memory
- `herb_hills` — gathering, daily-life exploration, local requests
- `expedition_outpost` — danger, patrol, preparation, escalation

Each region must launch as a small RPG chapter rather than an empty map.

## Goals

1. Expand the explorable world beyond the initial three outing regions.
2. Keep direct movement and the existing `MobileExplorationScene` runtime as the canonical traversal system.
3. Introduce a reusable **Region Registry** so new regions are data-driven instead of hard-coded through repeated branches.
4. Add region-local completeness: NPCs, quests, discoveries, conditional events, and revisit changes.
5. Make region progress visible through dialogue, interactables, paths, and art variants.
6. Produce original visual assets aggressively enough that every new region has a strong identity from first entry.
7. Preserve existing save/progression behavior unless this design explicitly extends it.
8. Keep current `onOuting(location)` semantics intact for canonical outing progression.

## Non-goals

V16 first wave does not include:

- replacing React/Vite/TypeScript or the exploration runtime with a new game engine
- redesigning the raise/train/rest home loop
- a full inventory UI rewrite
- full Tactical battle integration inside exploration
- procedural map generation
- broad save resets or incompatible migration
- sandbox NPC AI

## Player experience target

The intended player experience is:

- the crossroads feels like a real world hub rather than a disguised menu
- new regions are readable visually before text is read
- each region gives the player multiple reasons to walk around
- each region has a local problem or goal that can be resolved
- revisiting a completed region produces different dialogue or world presentation
- exploration choices leave small but visible traces in the world

## First-wave regions

### Old Shrine

**Theme:** mystery, memory, ancient seals.

**Core loop:** enter the ruin, inspect relics and rune devices, open or reactivate a route, resolve a short shrine quest, then revisit a visibly changed shrine.

**Identity signals:** cracked stone, old pillars, sealed gate, rune device, shrine arch, memory/echo illustrations.

**Minimum content:**
- 2–3 unique NPC/echo characters
- one main shrine quest
- at least two conditional events
- 2–3 discoveries
- at least one path or visual state change after resolution
- revisit dialogue after resolution
- at least one world-fact, personality, or bond-sensitive response

### Herb Hills

**Theme:** gathering, local life, calm exploration.

**Core loop:** forage herbs, answer a local request, identify meaningful gathering points, find a rare plant, and unlock a better revisit state.

**Identity signals:** rolling field paths, herb patches, drying racks, baskets, small sheds, signposts, wind and grass silhouettes.

**Minimum content:**
- 2–3 unique NPCs
- one local gathering/request quest
- at least two conditional events
- 2–3 discoveries
- at least one changed gathering point or local visual after resolution
- revisit dialogue after resolution
- at least one personality, bond, or world-fact-sensitive response

### Expedition Outpost

**Theme:** preparation, patrol, danger.

**Core loop:** inspect the outpost, identify a patrol/supply problem, help stabilize it, and leave a clear hook for later Tactical or expedition content without embedding full combat in this wave.

**Identity signals:** tents, supply crates, signal posts, warning banners, watch markers, training props, reinforced gate.

**Minimum content:**
- 2–3 unique NPCs
- one stabilization quest
- at least two conditional events
- 2–3 discoveries
- threatened and stabilized world presentation
- revisit dialogue after resolution
- at least one personality, bond, or world-fact-sensitive response

## Region completeness contract

A V16 region is not considered complete until it contains all of the following:

- 2–3 unique NPCs or equivalent authored characters
- 1 main local quest
- 2 or more conditional events
- 2–3 discoveries or collectibles
- at least one persistent state-dependent change
- revisit dialogue after the main change
- at least one connection to personality, bond, or world facts
- original authored environmental and interaction art beyond a single ground image
- a direct exit path back to the crossroads
- mobile and keyboard accessibility through the existing exploration runtime

## World structure

### Outing location IDs

The current outing IDs are:

- `forest`
- `village`
- `lakeside`

V16 extends the canonical set with:

- `old_shrine`
- `herb_hills`
- `expedition_outpost`

Existing locations must remain backward-compatible.

### Region Registry

V16 introduces a reusable region registry as the authoritative exploration definition source.

Each region definition should provide, either directly or through focused helper modules:

- `id`
- display `name`
- `summary`
- `world`
- `storyFrames`
- NPC definitions or NPC/world derivation function
- quest definition
- discovery definitions
- conditional event definitions
- state transition rules
- crossroads entrance metadata
- reward/progression hooks
- art references

The registry becomes the primary source for:

- outing scene lookup
- crossroads destination metadata
- region labels and summaries
- content completeness tests
- future map/summary UI

The current low-level movement/collision/camera runtime should remain stable. V16 layers richer region content on top instead of rewriting traversal.

## Crossroads expansion

The crossroads remains the canonical travel hub.

Requirements:

- preserve forest, village, and lakeside portals
- add visually distinct portals for old shrine, herb hills, and expedition outpost
- keep direct in-world traversal; do not restore destination menu rows
- preserve the in-world route home
- keep portal feedback compatible with `prefers-reduced-motion`
- expand the world geometry or portal layout enough that all six destinations remain spatially readable

## Region state model

Each new region needs lightweight persistent progress.

The conceptual phases are:

- `unvisited`
- `active`
- `mainQuestInProgress`
- `mainQuestResolved`
- `postResolution`

Production code may encode these more compactly, but the semantics must remain explicit.

Region state may affect:

- NPC dialogue
- interactable availability
- required-completion gates
- path blockers
- discoveries still available
- story frames that can trigger
- world/art variants

### Save compatibility

Existing saves must hydrate with safe defaults for all new region state. New fields must be additive and sanitised. No existing valid save should become unusable because the new region data is absent.

## Quest, event, and discovery model

### Main region quest

Each new region gets one compact authored quest that can be understood through exploration, nearby prompts, NPC dialogue, and story frames rather than a heavy quest UI.

Expected examples:

- Old Shrine: reactivate or resolve an ancient seal and recover a memory fragment
- Herb Hills: collect and deliver a small herb set and find a rare plant
- Expedition Outpost: resolve a patrol or supply problem and stabilize the camp

### Conditional events

Conditional events may depend on:

- region progress
- completed local interactions
- prior discoveries
- exploration history or level
- personality emphasis
- bond context
- current/inherited world facts

### Discoveries

Discoveries should remain mechanically lightweight but region-specific. They can support:

- narrative flavor
- local quest progress
- revisit dialogue
- future reward/crafting hooks

## NPC model

V16 prioritizes authored stateful dialogue over simulation-heavy AI.

Each unique region NPC should support at least:

- first-visit dialogue
- quest-in-progress dialogue
- post-resolution dialogue
- one branch or line influenced by local state or world/personality/bond context

NPCs may remain fixed interactables in this wave. Moving schedules are not required.

## Art and asset strategy

V16 explicitly includes aggressive production of original game art.

### Principles

- Keep the V15 original SVG/top-down visual language unless a later asset-specific design deliberately changes it.
- Favor strong visual readability over decorative density.
- Important interaction objects should be recognizable before the player reads their label.
- Separate common reusable motifs from region-specific art.
- Produce state variants where completion changes how a place should feel.

### Common assets

Potential shared assets include:

- entrance/portal signage
- quest markers
- discovery icons
- NPC interaction indicators
- world-state modifiers
- map-compatible destination icons

### Old Shrine assets

- shrine ground
- cracked-stone/ruin layer
- pillars
- sealed gate
- rune devices
- shrine entrance arch
- memory/echo story-frame art
- resolved-state gate/rune variant

### Herb Hills assets

- field ground
- herb-patch variants
- drying racks
- baskets
- shed/hut structures
- signposts
- rare-herb art
- post-resolution gathering variant

### Expedition Outpost assets

- outpost ground
- tents
- crates
- signal/watch markers
- warning flags
- training props
- reinforced gate
- threatened/stabilized state variants

## Architecture impact

Likely affected areas:

- `src/adventure.ts`
- `src/game.ts` and/or a focused persistent-state module imported by it
- `src/MobileLegacyFeaturePage.tsx`
- `src/scene/OutingSceneFlow.tsx`
- `src/exploration/exploration-types.ts`
- `src/exploration/MobileExplorationScene.tsx` only where richer region state needs a narrow interface
- `src/exploration/outing-crossroads.ts`
- new region registry/state/content modules under `src/exploration/`
- tests beside those modules
- new assets under `public/assets/exploration/`

Prefer focused files over growing `adventure.ts`, `MobileLegacyFeaturePage.tsx`, or `OutingSceneFlow.tsx` into large condition trees.

## Testing strategy

V16 follows repository TDD discipline.

### Contract tests

Add tests for:

- the six canonical outing IDs
- region-registry completeness
- region-state defaulting/sanitization
- all six crossroads portals
- routing from crossroads to each region

### Region tests

Each new region must prove:

- world larger than a mobile viewport
- valid start point
- collision/obstacle presence
- required NPC/interactable anchors
- main-quest interaction chain
- required discoveries
- exit back to crossroads
- state-dependent world/content difference
- story-frame references resolve

### Integration tests

Cover at minimum:

- entering each new region from crossroads
- completing a local main-quest flow
- revisiting after resolution and observing a changed state
- old saves hydrating with default V16 region state
- preservation of existing `onOuting(location)` behavior

### Verification

For each implementation slice:

1. targeted RED
2. minimal implementation
3. targeted GREEN
4. directly coupled regression tests
5. full `npm run test`
6. `npm run build`
7. GitHub Actions CI inspection before the slice is considered verified

## Rollout order

1. Region registry and persistent region-state foundation
2. Crossroads expansion to six destinations
3. Old Shrine full vertical slice
4. Herb Hills full vertical slice
5. Expedition Outpost full vertical slice
6. Cross-region integration and full regression/build gate

Each region must meet the completeness contract before the next region is called complete.

## Risks and mitigations

### Empty-feeling regions

Mitigation: enforce the region completeness contract in tests and review.

### State complexity leaking into unrelated systems

Mitigation: keep region state additive and isolated in a focused persistent-state module; expose narrow selectors/transitions.

### Asset production becoming a late polish phase

Mitigation: every region task includes its art files as part of the same deliverable and testable asset references.

### Repeated hard-coded routing

Mitigation: establish the registry before adding the three new region implementations.

### Existing save regression

Mitigation: add explicit hydration tests before any region content depends on persisted V16 state.

## Success criteria

V16 first wave is successful when:

- all six destinations are reachable through the crossroads overworld
- the three new regions have clearly different traversal/content identities
- each new region meets the completeness contract
- completed regions visibly change on revisit
- original assets make each region visually distinct without placeholder-heavy presentation
- existing save/progression semantics remain valid
- full tests and production build pass
- the result feels like a larger living RPG world, not merely a larger destination list
