# Outing Overworld Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the outing destination menu with a direct-movement crossroads overworld where the player physically walks to the forest, village, or lakeside entrance.

**Architecture:** Reuse `MobileExplorationScene` as the single movement/camera/collision runtime. Extend exploration interactables with a portal action, author a dedicated crossroads world with three destination landmarks, and route `MobileLegacyFeaturePage` into the crossroads immediately when the outing feature opens. Existing region worlds keep their canonical `onOuting` mutation path; exits return to the crossroads instead of a destination list.

**Tech Stack:** React, TypeScript, Vite, Vitest, authored SVG assets.

**Spec:** Approved V15 exploration RPG direction in the active project conversation.

## Global Constraints

- Keep React/Vite/TypeScript; do not rewrite to Phaser.
- Preserve the existing authoritative `onOuting(location)` mutation path.
- Do not add copied Zelda assets or third-party game art.
- Mobile and keyboard controls must keep using the existing exploration runtime.
- Existing forest, village, and lakeside progression must remain intact.
- Region completion must not return the player to a menu.
- Respect reduced-motion behavior already present in `exploration.css`.

---

### Task 1: Lock the no-menu outing contract

**Files:**
- Modify: `src/v9-mobile-feature-pages.test.tsx`
- Modify: `src/exploration/MobileExplorationScene.test.tsx`

**Interfaces:**
- Consumes: current `MobileLegacyFeaturePage`, `MobileExplorationScene`
- Produces: failing tests requiring immediate overworld entry and portal handling

- [ ] **Step 1: Write the failing tests**

Require `render('outing')` to contain the crossroads exploration shell and all three destination entrances, and require `MobileExplorationScene` to expose an `onPortal` path for `kind==='portal'` interactions.

- [ ] **Step 2: Verify RED**

Run full CI `npm run test`; expected failure is the new no-menu/portal assertions while existing tests remain green.

### Task 2: Add portal-capable exploration runtime

**Files:**
- Modify: `src/exploration/exploration-types.ts`
- Modify: `src/exploration/MobileExplorationScene.tsx`
- Modify: `src/exploration/exploration.css`

**Interfaces:**
- Consumes: `ExplorationInteractable`
- Produces: `kind:'portal'`, `destinationId?:string`, `onPortal?:(destinationId:string)=>void`

- [ ] **Step 1: Extend the interaction type**

Add `portal` to `ExplorationInteractableKind` and `destinationId?: string` to `ExplorationInteractable`.

- [ ] **Step 2: Route portal interaction**

When the nearest interaction is a portal with a destination id, call `onPortal(destinationId)` without opening a story frame or committing outing progression.

- [ ] **Step 3: Give portals distinct world feedback**

Render portal landmarks with `data-kind="portal"`; add a restrained entrance glow that is disabled by `prefers-reduced-motion`.

### Task 3: Author the crossroads overworld and original vector art

**Files:**
- Create: `src/exploration/outing-crossroads.ts`
- Create: `public/assets/exploration/crossroads/crossroads-ground.svg`
- Create: `public/assets/exploration/crossroads/crossroads-landmarks.svg`
- Create: `public/assets/exploration/crossroads/forest-gate.svg`
- Create: `public/assets/exploration/crossroads/village-gate.svg`
- Create: `public/assets/exploration/crossroads/lakeside-gate.svg`

**Interfaces:**
- Produces: `outingCrossroadsWorld: ExplorationWorldDefinition`
- Portals: `forest`, `village`, `lakeside`

- [ ] **Step 1: Build a materially larger-than-screen crossroads**

Use a 2400×1600 authored world with a central starting plaza, branching routes, collision blocks, landscape silhouettes, and three spatially separated entrances.

- [ ] **Step 2: Add original SVG entrance art**

Forest uses a mossy wooden arch, village uses warm stone/lantern architecture, and lakeside uses pale reeds/wind ribbons so destinations are readable before text.

### Task 4: Replace the destination list with continuous world travel

**Files:**
- Modify: `src/MobileLegacyFeaturePage.tsx`
- Modify: `src/scene/OutingSceneFlow.tsx` only if type/export wiring needs consolidation

**Interfaces:**
- `outingScene: 'crossroads' | OutingLocationId`
- Crossroads portal callback selects a region.
- Region exit returns to `crossroads`.
- Top-level exit/back from crossroads invokes the router back action.

- [ ] **Step 1: Enter crossroads immediately**

Initialize outing navigation to `crossroads` when `feature==='outing'`, eliminating the destination rows from normal outing entry.

- [ ] **Step 2: Preserve canonical region mutation**

Keep `onOuting(location)` exactly where region progression commits and do not call it while traversing the crossroads.

- [ ] **Step 3: Return to world instead of menu**

Region exit routes to `crossroads`; crossroads exit routes to the feature back action.

### Task 5: Verify the full branch

**Files:**
- No production changes unless verification reveals a regression.

- [ ] **Step 1: Targeted verification**

Run the changed exploration and mobile feature tests in CI.

- [ ] **Step 2: Full verification**

Run `npm run test` and `npm run build` through the repository CI.

- [ ] **Step 3: Inspect exact failures before any fix**

If a regression appears, identify the exact assertion and distinguish stale contract from production behavior before applying the minimum correction.
