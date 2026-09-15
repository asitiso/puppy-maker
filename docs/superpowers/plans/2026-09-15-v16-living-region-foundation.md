# V16 Living Region Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the six-region registry and additive, save-compatible persistent state foundation required before V16 crossroads and authored region content are added.

**Architecture:** Keep V15 movement/camera runtime untouched. Add a focused registry under `src/exploration/` for canonical region identity/metadata and a separate `living-region-state` module for safe defaults, hydration, and narrow forward-only transitions. Compose that state through `V3PersistentState` so old saves hydrate safely and new runs reset only local region progress.

**Tech Stack:** React/Vite/TypeScript, Vitest, existing V3 persistence composition.

**Spec:** `docs/superpowers/specs/2026-09-15-v16-world-expansion-living-regions-design.md`

## Global Constraints

- Keep `MobileExplorationScene` as the canonical traversal runtime.
- Preserve existing save/progression behavior unless explicitly extended.
- New fields are additive and sanitised; existing valid saves without V16 data remain usable.
- Do not rewrite home/raise/train/rest or Tactical systems.
- Preserve existing `onOuting(location)` semantics; routing expansion belongs to the next slice.
- Use TDD: targeted RED, minimal implementation, targeted GREEN, coupled regression, full test, build, CI inspection.

---

### Task 1: Canonical region registry foundation

**Files:**
- Create: `src/exploration/region-registry.ts`
- Test: `src/exploration/region-registry.test.ts`

**Interfaces:**
- Produces: `REGION_IDS`, `LEGACY_REGION_IDS`, `LIVING_REGION_IDS`, `RegionId`, `LivingRegionId`, `RegionDefinition`, `regionRegistry`, `getRegionDefinition`.
- Later slices consume these IDs for crossroads routing and authored region modules.

- [ ] **Step 1: Write the failing test** proving the canonical order is `forest`, `village`, `lakeside`, `old_shrine`, `herb_hills`, `expedition_outpost`; all IDs resolve to definitions; the three living regions expose distinct names, summaries, and entrance labels.
- [ ] **Step 2: Run targeted test** with `npm run test -- src/exploration/region-registry.test.ts` and confirm RED because the registry module does not exist.
- [ ] **Step 3: Write minimal implementation** with readonly ID tuples and data-only metadata. Do not import world/runtime modules yet.
- [ ] **Step 4: Run targeted test** and confirm GREEN.
- [ ] **Step 5: Commit** as `feat: add V16 region registry foundation`.

### Task 2: Persistent living-region state

**Files:**
- Create: `src/exploration/living-region-state.ts`
- Test: `src/exploration/living-region-state.test.ts`

**Interfaces:**
- Consumes: `LivingRegionId`, `LIVING_REGION_IDS` from `region-registry`.
- Produces: `RegionProgressPhase`, `LivingRegionProgress`, `LivingRegionState`, `emptyLivingRegionState`, `hydrateLivingRegionState`, `enterLivingRegion`, `startLivingRegionMainQuest`, `resolveLivingRegionMainQuest`, `advanceLivingRegionPostResolution`, `recordLivingRegionDiscovery`, `recordLivingRegionInteraction`.

- [ ] **Step 1: Write failing tests** for fresh state, malformed hydration fallback, phase sanitization, deduplicated string histories, unknown-key removal, and legal forward transitions.
- [ ] **Step 2: Run targeted test** with `npm run test -- src/exploration/living-region-state.test.ts` and confirm RED because the module does not exist.
- [ ] **Step 3: Implement minimal state module**. Each region starts as `{phase:'unvisited', discoveries:[], completedInteractions:[]}`. Hydration accepts only known region keys and valid phases, filters non-empty strings, deduplicates entries, and never aliases mutable defaults.
- [ ] **Step 4: Implement narrow transitions**: enter only changes `unvisited -> active`; quest start only `active -> mainQuestInProgress`; resolve only `mainQuestInProgress -> mainQuestResolved`; post-resolution only `mainQuestResolved -> postResolution`; duplicate discoveries/interactions are no-ops.
- [ ] **Step 5: Run targeted test** and confirm GREEN.
- [ ] **Step 6: Commit** as `feat: add persistent living region state`.

### Task 3: Compose V16 region state into saves

**Files:**
- Modify: `src/v3-persistent-state.ts`
- Modify: `src/v3-persistent-state.test.ts`

**Interfaces:**
- Consumes: `LivingRegionState`, `emptyLivingRegionState`, `hydrateLivingRegionState`.
- Extends: `V3PersistentState` with `livingRegions: LivingRegionState`.
- Guarantees: `emptyV3PersistentState()` owns a fresh default slice; `hydrateV3PersistentState()` supplies defaults for old saves and sanitizes malformed V16 data; `pickV3PersistentState()` preserves sanitized state; `prepareNewRunState()` resets local region progress.

- [ ] **Step 1: Add failing persistence tests** proving an old save with no `livingRegions` gets safe defaults, malformed region state is sanitized, picked persistence retains region progress, and `prepareNewRunState` resets region progress.
- [ ] **Step 2: Run `npm run test -- src/v3-persistent-state.test.ts`** and confirm RED because `livingRegions` is absent.
- [ ] **Step 3: Make the minimal composition changes** in `v3-persistent-state.ts`; do not touch `game.ts` unless TypeScript demonstrates it is required, because `GameState` already composes `V3PersistentState` and spreads `emptyV3PersistentState()/hydrateV3PersistentState()`.
- [ ] **Step 4: Run targeted persistence + living-region + registry tests** and confirm GREEN.
- [ ] **Step 5: Run full `npm run test`**.
- [ ] **Step 6: Run `npm run build`**.
- [ ] **Step 7: Commit** as `feat: persist V16 living region progress`.
- [ ] **Step 8: Inspect GitHub Actions for the new head**; do not start crossroads expansion until CI is GREEN.
