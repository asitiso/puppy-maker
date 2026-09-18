# Mobile RPG Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a mobile-first forest exploration vertical slice with direct movement, camera follow, proximity interaction, and illustrated frame-style story delivery while preserving existing puppy-maker progression state.

**Architecture:** Add a small deterministic exploration runtime under `src/exploration`, render it with React/CSS, route only the forest outing through it, and leave village/lakeside on the existing SceneStage until the foundation proves stable. Runtime geometry is pure/testable; React owns only input and transient presentation state.

**Tech Stack:** React, TypeScript, Vite, Vitest, CSS, SVG assets

**Spec:** `docs/superpowers/specs/2026-09-14-mobile-rpg-foundation-design.md`

## Global Constraints

- Primary target: phone portrait and landscape.
- Preserve existing GameState/save format and existing `onOuting(location)` progression callback.
- No new game-engine dependency.
- Forest only for the first slice; village and lakeside keep current SceneStage behavior.
- Touch controls must be safe-area aware and expose keyboard fallback.
- Story delivery must use framed visual scenes with concise copy rather than long prose panels.
- Progression commit must be one-shot.

---

### Task 1: Pure exploration runtime

**Files:**
- Create: `src/exploration/exploration-types.ts`
- Create: `src/exploration/exploration-runtime.ts`
- Test: `src/exploration/exploration-runtime.test.ts`

**Interfaces:**
- Produces `Vec2`, `WorldBounds`, `CollisionRect`, `ExplorationInteractable`, `ExplorationWorldDefinition`, `ExplorationStoryFrame`.
- Produces `normalizeDirection`, `moveWithCollisions`, `cameraForPlayer`, `nearestInteractable`.

- [ ] **Step 1: Write the failing runtime tests**

```ts
expect(normalizeDirection({x:1,y:1})).toEqual({x:Math.SQRT1_2,y:Math.SQRT1_2});
expect(moveWithCollisions({x:20,y:20},{x:-40,y:0},world,16)).toEqual({x:16,y:20});
expect(cameraForPlayer({x:1600,y:900},{width:2400,height:1600},{width:390,height:844})).toEqual({x:1405,y:478});
expect(nearestInteractable({x:100,y:100},items)?.id).toBe('tracks');
```

- [ ] **Step 2: Run targeted test and verify RED**

Run: `npm test -- src/exploration/exploration-runtime.test.ts`
Expected: FAIL because exploration runtime modules do not exist.

- [ ] **Step 3: Implement minimal deterministic runtime**

Use world-space pixels, clamped finite deltas, normalized diagonal movement, axis-separated rectangular collision, viewport-aware camera clamping, and nearest enabled interaction selection.

- [ ] **Step 4: Run targeted test and verify GREEN**

Run: `npm test -- src/exploration/exploration-runtime.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

`feat: add deterministic exploration runtime`

---

### Task 2: Forest world definition and original vector art

**Files:**
- Create: `src/exploration/forest-world.ts`
- Create: `public/assets/exploration/forest/forest-ground.svg`
- Create: `public/assets/exploration/forest/forest-trees.svg`
- Create: `public/assets/exploration/forest/glowing-tracks.svg`
- Create: `public/assets/exploration/forest/ancient-tree.svg`
- Create: `public/assets/exploration/forest/runa-topdown.svg`
- Create: `public/assets/exploration/forest/story-tracks.svg`
- Create: `public/assets/exploration/forest/story-frame.svg`
- Test: `src/exploration/forest-world.test.ts`

**Interfaces:**
- Produces `forestWorld` and `forestStoryFrames` consumed by the mobile exploration scene.

- [ ] **Step 1: Write failing world contract tests**

Assert the world is larger than a mobile viewport, has a valid start point, has obstacles, exposes `tracks`, `ancient-tree`, and `exit`, and connects tracks/tree to story frames.

- [ ] **Step 2: Run and verify RED**

Run: `npm test -- src/exploration/forest-world.test.ts`
Expected: FAIL because `forest-world.ts` is missing.

- [ ] **Step 3: Add world data and original SVG assets**

Create a 2200×1400 forest with a curved central clearing, collision islands around large trees/rocks, start near the southwest entry, tracks deeper northeast, ancient tree northwest, and exit near the start. Use coherent moss/teal/gold vector art with no borrowed game assets.

- [ ] **Step 4: Run and verify GREEN**

Run targeted world test.

- [ ] **Step 5: Commit**

`feat: add forest exploration world and art`

---

### Task 3: Mobile joystick and story frame components

**Files:**
- Create: `src/exploration/MobileJoystick.tsx`
- Create: `src/exploration/StoryFrameOverlay.tsx`
- Create: `src/exploration/exploration.css`
- Test: `src/exploration/mobile-exploration-ui.test.tsx`

**Interfaces:**
- `MobileJoystick({disabled,onDirection})`
- `StoryFrameOverlay({frame,onComplete})`

- [ ] **Step 1: Write failing component/source contract tests**

Verify joystick has an accessible label and pointer-cancel reset path. Verify story frame uses `role="dialog"`, `aria-modal="true"`, framed illustration, speaker/caption slots, and one primary action. Verify CSS contains `100dvh`, `env(safe-area-inset-*)`, portrait and low-height landscape rules, and minimum 52px action target.

- [ ] **Step 2: Run and verify RED**

Run: `npm test -- src/exploration/mobile-exploration-ui.test.tsx`

- [ ] **Step 3: Implement joystick, story frame, and mobile CSS**

Joystick uses pointer capture and emits normalized vectors. Story frame blocks movement while active. CSS puts joystick bottom-left and action bottom-right with safe-area padding, and switches story frame to horizontal layout in short landscape viewports.

- [ ] **Step 4: Run and verify GREEN**

Run targeted UI test.

- [ ] **Step 5: Commit**

`feat: add mobile exploration controls and story frame`

---

### Task 4: Mobile exploration scene

**Files:**
- Create: `src/exploration/MobileExplorationScene.tsx`
- Test: `src/exploration/MobileExplorationScene.test.tsx`

**Interfaces:**
- `MobileExplorationScene({world,onProgress,onExit})`
- Consumes runtime helpers, joystick, story overlay, and forest world definition.

- [ ] **Step 1: Write failing scene tests**

Verify the scene renders objective HUD, player/world/camera layers, joystick/action controls, disables action when no interactable is near, opens the correct story frame for a nearby interaction, and invokes `onProgress` once when a progression story completes.

- [ ] **Step 2: Run and verify RED**

Run: `npm test -- src/exploration/MobileExplorationScene.test.tsx`

- [ ] **Step 3: Implement requestAnimationFrame movement loop and controls**

Unify keyboard and joystick input, clamp frame delta, update player through pure collision helpers, derive camera and nearest interaction, pause movement during stories, and protect progression with a ref.

- [ ] **Step 4: Run and verify GREEN**

Run targeted scene test.

- [ ] **Step 5: Commit**

`feat: build mobile exploration scene`

---

### Task 5: Route forest outing into exploration runtime

**Files:**
- Modify: `src/scene/OutingSceneFlow.tsx`
- Modify: `src/scene/OutingSceneFlow.test.tsx`

**Interfaces:**
- Forest uses `MobileExplorationScene` and calls existing `onOuting('forest')`.
- Village/lakeside retain `SceneStage` and current behavior.

- [ ] **Step 1: Extend outing tests first**

Add assertions that forest imports/renders the mobile exploration scene and maps progress to `onOuting('forest')`, while existing SceneStage still handles non-forest outings.

- [ ] **Step 2: Run and verify RED**

Run: `npm test -- src/scene/OutingSceneFlow.test.tsx`

- [ ] **Step 3: Implement minimal forest branch**

Return the new exploration scene when `location==='forest'`; keep the current code path unchanged otherwise.

- [ ] **Step 4: Run and verify GREEN**

Run outing tests plus exploration tests.

- [ ] **Step 5: Commit**

`feat: route forest outing through mobile RPG exploration`

---

### Task 6: Regression and production gate

**Files:**
- No feature scope expansion.

- [ ] **Step 1: Run targeted suite**

`npm test -- src/exploration src/scene/OutingSceneFlow.test.tsx`

- [ ] **Step 2: Run full suite**

`npm test`

- [ ] **Step 3: Run TypeScript/build**

`npm run build`

- [ ] **Step 4: Inspect PR CI and fix only regressions caused by this slice**

Expected: full GREEN.

- [ ] **Step 5: Review diff for accidental text-heavy regressions, desktop-only controls, or duplicate progression state**

- [ ] **Step 6: Final commit if verification fixes are needed**

`fix: harden mobile exploration foundation`
