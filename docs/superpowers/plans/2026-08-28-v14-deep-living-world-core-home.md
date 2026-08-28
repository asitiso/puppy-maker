# V14 Deep Living World Core + Home Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing Scene runtime drive visible approach/action/commit/presentation behavior in Home, then add deterministic autonomous Runa/companion presentation without changing canonical gameplay state.

**Architecture:** Extend the existing `scene-runtime.ts`/`SceneDirector.tsx`; do not create a second scene engine. `LayeredHome.tsx` remains a consumer: scene objects start a directed lifecycle, the single commit callback invokes the existing Home callback, and presentation returns to idle. Ambient behavior is a pure selector derived from existing condition/personality/Bond plus canonical calendar seed.

**Tech Stack:** React, TypeScript, Vitest, CSS, existing Scene Resolver/Stage/Director.

**Spec:** `docs/superpowers/specs/2026-08-28-v14-deep-living-world-expansion-design.md`

## Global Constraints

- Reducer/domain logic remains the sole authority for durable state.
- Interaction order is `idle -> approaching -> acting -> committing -> presenting -> idle`.
- Duplicate taps after approach begins cannot cause a second canonical commit.
- Behavior priority is Story > player > activity > state reaction > autonomous > idle.
- Movement is semantic-anchor based; no joystick/pathfinding/collision state.
- No actor pixel positions or animation frames are persisted.
- Mobile targets: 360x640, 390x844, ~430px; >=44px targets; safe-area and reduced-motion parity.

---

### Task 1: Finish the reusable directed interaction controller

**Files:**
- Modify: `src/scene/scene-runtime.ts`
- Modify: `src/scene/SceneDirector.tsx`
- Test: `src/scene/scene-runtime.test.ts`
- Create: `src/scene/SceneDirector.test.tsx`

**Interfaces:**
- Consumes: `ResolvedScene`, `ResolvedSceneInteraction`, existing `claimSceneCommit`.
- Produces: `SceneDirectorController` with `runtime`, `start(id)`, `advance()`, `interrupt()`; `onCommit(interaction)` fires once only at the committing boundary.

- [ ] **Step 1: Write the failing runtime tests**

```ts
it('allows interruption only before commit',()=>{
  const acting=advanceSceneRuntime(beginSceneInteraction(createSceneRuntime(),'bed'));
  expect(interruptSceneRuntime(acting)).toEqual(createSceneRuntime());
  const committing=advanceSceneRuntime(acting);
  expect(interruptSceneRuntime(committing)).toEqual(committing);
});
```

Add a component test that calls `start('bed')`, advances twice, rerenders effects, and expects `onCommit` exactly once even if `advance()` or the same object is pressed again.

- [ ] **Step 2: Run RED**

Run: `npx vitest run src/scene/scene-runtime.test.ts src/scene/SceneDirector.test.tsx`
Expected: FAIL because interrupt/controller behavior is incomplete or unexported.

- [ ] **Step 3: Implement the minimal controller extension**

```ts
export function interruptSceneRuntime(state:SceneRuntimeState):SceneRuntimeState{
  if(state.phase==='committing'||state.phase==='presenting') return state;
  return createSceneRuntime();
}
```

Expose `interrupt` from `SceneDirector`; keep commit claiming inside the Director and do not call domain code in `scene-runtime.ts`.

- [ ] **Step 4: Run GREEN**

Run: `npx vitest run src/scene/scene-runtime.test.ts src/scene/SceneDirector.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/scene/scene-runtime.ts src/scene/scene-runtime.test.ts src/scene/SceneDirector.tsx src/scene/SceneDirector.test.tsx
git commit -m "feat(v14): harden directed scene interaction lifecycle"
```

### Task 2: Add deterministic Home ambient behavior selectors

**Files:**
- Create: `src/scene/home-living-behavior.ts`
- Create: `src/scene/home-living-behavior.test.ts`
- Modify: `src/scene/scene-resolver.ts`

**Interfaces:**
- Produces:
```ts
export type HomeAmbientBehavior={anchorId:string;pose:string;motion:string;tag:string};
export function resolveHomeAmbientBehavior(input:{condition?:string;personality?:string;year:number;month:number;week:number}):HomeAmbientBehavior;
export function resolveCompanionAmbient(input:{actorId:'bear'|'owl'|'wolf'|'cat';bondLevel:number}):{anchorBias:'near'|'watch'|'forward'|'prop';motion:string;tag:string};
```

- [ ] **Step 1: Write failing selector tests**

```ts
expect(resolveHomeAmbientBehavior({condition:'tired',year:1,month:3,week:2}).anchorId).toBe('bed');
expect(resolveHomeAmbientBehavior({condition:'focused',year:1,month:3,week:2}).anchorId).toBe('desk');
expect(resolveCompanionAmbient({actorId:'owl',bondLevel:3}).anchorBias).toBe('watch');
expect(resolveCompanionAmbient({actorId:'wolf',bondLevel:3}).anchorBias).toBe('forward');
```

Also assert equal canonical inputs return equal output.

- [ ] **Step 2: Run RED**

Run: `npx vitest run src/scene/home-living-behavior.test.ts`
Expected: FAIL because module is absent.

- [ ] **Step 3: Implement pure deterministic selectors**

Use fixed condition priorities (`tired -> bed/sit`, `focused -> desk`, otherwise a stable week-seeded choice among center/window/companion area). Bond only changes presentation proximity/intensity; it never returns rewards or state mutations.

- [ ] **Step 4: Thread presentation into Home resolution**

When `location==='home'`, replace only Runa/companion presentation fields in the resolved cast. Preserve registry definitions and canonical state.

- [ ] **Step 5: Run GREEN**

Run: `npx vitest run src/scene/home-living-behavior.test.ts src/scene/scene-resolver.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/scene/home-living-behavior.ts src/scene/home-living-behavior.test.ts src/scene/scene-resolver.ts
git commit -m "feat(v14): derive living home ambient behavior"
```

### Task 3: Route Home objects through SceneDirector before existing callbacks

**Files:**
- Modify: `src/LayeredHome.tsx` (`homeScene`, `handleHomeSceneInteraction`, living scene render)
- Modify: `src/scene/SceneStage.tsx`
- Modify: `src/scene/CharacterActor.tsx`
- Modify: `src/scene/scene.css`
- Create: `src/v14-living-home-deep.test.tsx`

**Interfaces:**
- Scene object click calls `controller.start(interaction.id)`.
- During directed phases, Runa renders at the interaction anchor with `approach`/action pose metadata.
- `onCommit` calls the existing `handleHomeSceneInteraction` mapping exactly once.

- [ ] **Step 1: Write failing static/integration tests**

```ts
expect(source).toContain('<SceneDirector');
expect(source).toContain('controller.start(interaction.id)');
expect(source).toContain('onCommit={handleHomeSceneInteraction}');
```

Add assertions that `bed`, `desk`, `wardrobe`, `bag`, `door`, `world_map`, and `runa` remain available and that existing quick-menu navigation remains present.

- [ ] **Step 2: Run RED**

Run: `npx vitest run src/v14-living-home-deep.test.tsx src/scene/SceneDirector.test.tsx`
Expected: FAIL because Home still commits immediately from `SceneStage`.

- [ ] **Step 3: Implement minimal Home integration**

Wrap the existing living `SceneStage` in `SceneDirector`; pass a runtime actor anchor override to `SceneStage`/`CharacterActor` instead of adding a second Runa. `approaching` uses the target anchor, `acting/committing/presenting` remain at that anchor, and idle returns to the resolved ambient anchor.

- [ ] **Step 4: Add reduced-motion behavior**

In `scene.css`, keep semantic phase changes but remove interpolation under `@media(prefers-reduced-motion:reduce)`. Do not delay canonical commit on an animation-end event.

- [ ] **Step 5: Run GREEN + Home regressions**

Run: `npx vitest run src/v14-living-home-deep.test.tsx src/scene/scene-runtime.test.ts src/scene/SceneDirector.test.tsx src/v14-ux-regression-batch.test.ts src/v13-home-character-safe-zone.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/LayeredHome.tsx src/scene/SceneStage.tsx src/scene/CharacterActor.tsx src/scene/scene.css src/v14-living-home-deep.test.tsx
git commit -m "feat(v14): make home interactions visibly scene driven"
```

### Task 4: Gate Core + Home as a working slice

**Files:** no production changes unless a root-cause regression is found.

- [ ] **Step 1: Run focused scene/Home suite**

Run: `npx vitest run src/scene src/v14-living-home-deep.test.tsx src/v14-ux-regression-batch.test.ts src/v9-mobile-active-play.test.tsx`
Expected: PASS.

- [ ] **Step 2: Run full regression**

Run: `npm test`
Expected: all files/tests PASS. If a legacy test encodes an obsolete implementation detail, change it only after confirming the new invariant is safer and preserving behavior.

- [ ] **Step 3: Run production build**

Run: `npm run build`
Expected: `tsc -b && vite build` PASS.

- [ ] **Step 4: Commit any test-only gate correction, otherwise do not create an empty commit**

```bash
git status --short
```

Expected: clean working tree before proceeding to the Training + Outing plan.
