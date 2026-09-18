# V16 Old Shrine Vertical Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `old_shrine` the first fully playable V16 living region, reachable from the crossroads with persistent quest/discovery progress, authored NPC/echo encounters, revisit changes, and original exploration art.

**Architecture:** Keep `MobileExplorationScene` as the canonical movement/camera runtime. Extend it only with optional persistence hooks for completed interactions, route V16 progress through a focused `LivingRegionUpdate` reducer path, and keep legacy `onOuting(location)` untouched. Old Shrine content lives in its own module and derives world/story content from persisted `LivingRegionProgress` plus a small context object for personality/bond/world-fact-sensitive dialogue.

**Tech Stack:** React, Vite, TypeScript, Vitest, existing V3 persistence and exploration runtime.

**Spec:** `docs/superpowers/specs/2026-09-15-v16-world-expansion-living-regions-design.md`

## Global Constraints

- Keep `MobileExplorationScene` as the canonical traversal runtime.
- Preserve existing save/progression behavior and legacy `onOuting(location)` semantics.
- New region progress remains additive and sanitised through `livingRegions`.
- Do not redesign raise/train/rest or Tactical systems.
- Every Old Shrine interaction must remain keyboard/mobile accessible through the existing exploration controls.
- Use TDD: targeted RED, minimal implementation, targeted GREEN, directly coupled regression, full `npm run test`, `npm run build`, then CI inspection.

---

### Task 1: Persist exploration interaction completion through the shared runtime

**Files:**
- Modify: `src/exploration/MobileExplorationScene.tsx`
- Modify: `src/exploration/MobileExplorationScene.test.tsx`

**Interfaces:**
- Add optional prop `completedInteractionIds?: readonly string[]`.
- Add optional prop `onInteractionComplete?: (interactionId:string)=>void`.
- Existing callers that omit both props behave exactly as before.

- [ ] **Step 1: Write a failing contract test** asserting the scene source contains `completedInteractionIds?`, `onInteractionComplete?`, seeds local completion from `completedInteractionIds`, and calls `onInteractionComplete?.(activeInteractionId)` when a story frame is finished.
- [ ] **Step 2: Run** `npm run test -- src/exploration/MobileExplorationScene.test.tsx` and confirm RED.
- [ ] **Step 3: Implement the two optional props.** Create a helper that returns `new Set(completedInteractionIds)` for initial/reset state. In `finishStory`, after adding the active interaction locally, call `onInteractionComplete?.(activeInteractionId)`. Keep the existing one-shot `onProgress` path unchanged.
- [ ] **Step 4: Run** `npm run test -- src/exploration/MobileExplorationScene.test.tsx` and confirm GREEN.
- [ ] **Step 5: Commit** as `feat: persist exploration interaction completion`.

### Task 2: Add a narrow living-region update action to game state

**Files:**
- Modify: `src/exploration/living-region-state.ts`
- Modify: `src/exploration/living-region-state.test.ts`
- Modify: `src/game.ts`
- Modify: `src/game.test.ts` only if the existing reducer contract suite is there; otherwise add `src/living-region-game.test.ts`.
- Modify: `src/App.tsx`
- Modify: `src/Root.tsx`

**Interfaces:**
- Produce `LivingRegionUpdate` with variants `enter`, `startMainQuest`, `resolveMainQuest`, `advancePostResolution`, `recordDiscovery`, and `recordInteraction`.
- Produce `applyLivingRegionUpdate(state,id,update)` from `living-region-state.ts`.
- Extend `game.Action` with `{type:'UPDATE_LIVING_REGION';regionId:LivingRegionId;update:LivingRegionUpdate}`.
- Expose App callback `onLivingRegionUpdateReady?: (update:(regionId:LivingRegionId,update:LivingRegionUpdate)=>void)=>void`.
- Pass the captured callback from `Root` to the outing feature as `onLivingRegionUpdate`.

- [ ] **Step 1: Write failing state tests** that map every update variant to the existing forward-only transition/recording functions and prove invalid repeated phase updates are no-ops.
- [ ] **Step 2: Run** `npm run test -- src/exploration/living-region-state.test.ts` and confirm RED.
- [ ] **Step 3: Implement `LivingRegionUpdate` and `applyLivingRegionUpdate`** as a switch delegating to the existing transition helpers.
- [ ] **Step 4: Add a failing reducer test** proving `UPDATE_LIVING_REGION` changes only `livingRegions` and leaves legacy outing state untouched.
- [ ] **Step 5: Add the reducer branch and App/Root callback plumbing.** Do not extend `OutingLocationId` and do not dispatch `GO_OUTING` for living regions.
- [ ] **Step 6: Run the targeted living-region and reducer tests** and confirm GREEN.
- [ ] **Step 7: Commit** as `feat: wire living region progress updates`.

### Task 3: Author the complete Old Shrine world and state-dependent content

**Files:**
- Create: `src/exploration/old-shrine-world.ts`
- Create: `src/exploration/old-shrine-world.test.ts`
- Create SVG assets under `public/assets/exploration/old-shrine/` for ground, ruins, sealed/open gate, rune device, memory shard, and three authored character/echo landmarks plus story-frame art.

**Interfaces:**
- Produce `OldShrineContext` with `personality`, `affection`, `worldFacts`, and `inheritedWorldFacts` inputs.
- Produce `oldShrineExploration(progress:LivingRegionProgress,context:OldShrineContext): {world:ExplorationWorldDefinition;storyFrames:Record<string,ExplorationStoryFrame>;discoveryByInteraction:Readonly<Record<string,string>>;questStartInteractionId:string;questResolveInteractionId:string;postResolutionInteractionId:string}`.

- [ ] **Step 1: Write a failing world contract test** proving width and height exceed a mobile viewport, start is in bounds, obstacles exist, direct exit exists, three distinct authored characters/echoes exist, there are at least three discoveries, at least two conditional interactions, all story-frame IDs resolve, and required art paths point to authored Old Shrine assets.
- [ ] **Step 2: Add failing state-variant tests** proving `unvisited/active` presents a sealed gate, `mainQuestInProgress` unlocks the rune/memory chain, `mainQuestResolved/postResolution` presents an open gate plus revisit dialogue, and a high-curiosity or existing-world-fact context changes at least one dialogue line.
- [ ] **Step 3: Run** `npm run test -- src/exploration/old-shrine-world.test.ts` and confirm RED.
- [ ] **Step 4: Implement the world/content module** with a roughly 2400×1600 walkable map, collisions, direct exit, three NPC/echo interactions, three discoveries, seal quest start/resolution chain, two state/context-sensitive events, and post-resolution presentation.
- [ ] **Step 5: Add the SVG assets** referenced by the module. Use distinct cracked-stone, rune, echo, and opened-seal silhouettes so landmarks are readable without labels.
- [ ] **Step 6: Run** `npm run test -- src/exploration/old-shrine-world.test.ts` and confirm GREEN.
- [ ] **Step 7: Commit** as `feat: author Old Shrine living region`.

### Task 4: Route the crossroads into Old Shrine and persist its quest loop

**Files:**
- Create: `src/scene/LivingRegionSceneFlow.tsx`
- Create: `src/scene/LivingRegionSceneFlow.test.tsx`
- Modify: `src/MobileLegacyFeaturePage.tsx`
- Add or modify the closest existing outing routing test.

**Interfaces:**
- `LivingRegionSceneFlow` consumes `regionId`, `progress`, context, `onUpdate`, and `onExit`.
- For this slice it accepts `old_shrine`; other living region IDs remain unavailable until their own complete slices rather than rendering placeholder maps.
- On mount/entry it emits `enter` once when needed.
- Interaction completion records the interaction, records mapped discoveries, starts/resolves the main quest at the authored IDs, and advances resolved state to post-resolution only from the authored revisit interaction.

- [ ] **Step 1: Write failing routing tests** proving the `old_shrine` crossroads portal is accepted by the feature page without widening legacy `OutingLocationId`, while `herb_hills` and `expedition_outpost` still do not render unfinished placeholder regions.
- [ ] **Step 2: Write failing flow tests** proving Old Shrine passes persisted completion IDs into `MobileExplorationScene`, maps interaction completions to living-region updates, and exits back to crossroads.
- [ ] **Step 3: Run the targeted routing/flow tests** and confirm RED.
- [ ] **Step 4: Implement `LivingRegionSceneFlow` and feature-page routing.** Use `getRegionDefinition` for V16 title/subtitle; keep the legacy `OutingSceneFlow` branch unchanged for forest/village/lakeside.
- [ ] **Step 5: Run targeted tests** and confirm GREEN.
- [ ] **Step 6: Commit** as `feat: route Old Shrine from crossroads`.

### Task 5: Verify the Old Shrine vertical slice end to end

**Files:**
- Update tests only where verification exposes an actual missing contract.

- [ ] **Step 1: Run coupled tests:** `npm run test -- src/exploration/MobileExplorationScene.test.tsx src/exploration/living-region-state.test.ts src/exploration/old-shrine-world.test.ts src/scene/LivingRegionSceneFlow.test.tsx`.
- [ ] **Step 2: Run full** `npm run test`.
- [ ] **Step 3: Run** `npm run build`.
- [ ] **Step 4: Inspect the GitHub Actions run for the new branch HEAD and require GREEN for both test and build steps.
- [ ] **Step 5: Update `docs/superpowers/CURRENT_STATUS.md` only after CI is GREEN, recording Old Shrine as complete and Herb Hills as the next rollout item.
- [ ] **Step 6: Commit status documentation** as `docs: hand off completed Old Shrine slice` and inspect its CI before treating it as the next baseline.
