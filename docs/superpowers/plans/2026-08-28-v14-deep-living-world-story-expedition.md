# V14 Deep Living World Story + Expedition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Run Story choices and Guardian Expedition through directed scene choreography and semantic journey nodes while preserving current `EVENT_CHOICE`, Tactical, Expedition, and checkpoint authority.

**Architecture:** Story metadata converts canonical events into `SceneBeat[]`; SceneDirector locks unrelated interactions during required beats and calls the existing story adapter at the commit boundary. Expedition wraps the existing `TacticalExpeditionFlow`: semantic camp/path/crossroads/ruin/rift/treasure/encounter/return scenes determine presentation and checkpoint position, while Tactical still creates and completes battle sessions.

**Tech Stack:** React, TypeScript, Vitest, current Story/Tactical/Expedition modules and Scene runtime.

**Spec:** `docs/superpowers/specs/2026-08-28-v14-deep-living-world-expansion-design.md`

## Global Constraints
- Story choices still commit only through `EVENT_CHOICE`.
- Post-choice presentation is derived from committed state/history.
- Tactical calculations and `COMPLETE_TACTICAL_BATTLE` remain canonical.
- Expedition durability uses semantic checkpoints only.
- Reload cannot replay a committed choice, battle, or reward.
- Guardian Expedition Start CTA safe-area footer regression must remain GREEN.

---

### Task 1: Expand Story event-to-scene choreography metadata

**Files:**
- Modify: `src/scene/story-scenes.ts`
- Create: `src/scene/story-scenes.test.ts`
- Modify: `src/scene/scene-types.ts` only if an approved beat field is missing

**Interfaces:**
```ts
export type StoryScenePlan={location:LocationId;beats:readonly SceneBeat[];requiredInteractionId:string|null};
export function storyScenePlan(eventId:string):StoryScenePlan;
```

- [ ] **Step 1: Write failing metadata tests**
For `lost_bird`, require a deterministic location/beat list containing dialogue before a required choice interaction. Unknown events fall back Home with safe dialogue/no domain commit.
- [ ] **Step 2: Run RED**
Run: `npx vitest run src/scene/story-scenes.test.ts`
Expected: FAIL because current file only maps location.
- [ ] **Step 3: Implement minimal data-driven plans**
Use existing `SceneBeat` variants (`move`, `pose`, `dialogue`, `effect`, `interaction`, `handoff`). Do not copy Story reward effects.
- [ ] **Step 4: Run GREEN**
Run: `npx vitest run src/scene/story-scenes.test.ts src/scene/scene-resolver.test.ts`
Expected: PASS.
- [ ] **Step 5: Commit**
```bash
git add src/scene/story-scenes.ts src/scene/story-scenes.test.ts src/scene/scene-types.ts
git commit -m "feat(v14): map story events to scene choreography"
```

### Task 2: Build the directed Story scene player around the canonical adapter

**Files:**
- Create: `src/scene/StorySceneFlow.tsx`
- Create: `src/scene/StorySceneFlow.test.tsx`
- Modify: `src/scene/adapters/story-adapter.ts`
- Modify: `src/scene/adapters/story-adapter.test.ts`
- Modify: current Story presentation boundary found in `src/App.tsx` / the active Story UI consumer; do not introduce a second Story reducer
- Modify: `src/scene/scene.css`

**Interfaces:**
`StorySceneFlow` consumes `eventId`, canonical event state/history, calendar/world inputs, `dispatch`, and semantic checkpoint callbacks. Choice buttons call `commitStoryChoice(eventId,choiceId,dispatch)` only in the Director committing phase.

- [ ] **Step 1: Lock in adapter exactness**
```ts
expect(commitStoryChoice('lost_bird','help',dispatch)).toBe(true);
expect(dispatch).toHaveBeenCalledTimes(1);
expect(dispatch).toHaveBeenCalledWith({type:'EVENT_CHOICE',eventId:'lost_bird',choiceId:'help'});
```
Also assert unknown choice dispatches zero times.
- [ ] **Step 2: Write failing Story flow tests**
Assert required Story beat disables unrelated scene objects, choice is not claimable after canonical history says resolved, and reduced-motion changes movement only, not beat order.
- [ ] **Step 3: Run RED**
Run: `npx vitest run src/scene/StorySceneFlow.test.tsx src/scene/adapters/story-adapter.test.ts`
Expected: flow tests FAIL; adapter stays GREEN.
- [ ] **Step 4: Implement the player**
Track beat index ephemerally. At required interaction use shared SceneDirector; commit first, then select post-choice beats from updated canonical state/history. Persist only `{activity:'story',activityId,phase,step}`.
- [ ] **Step 5: Run GREEN + checkpoint regression**
Run: `npx vitest run src/scene/StorySceneFlow.test.tsx src/scene/adapters/story-adapter.test.ts src/scene/activity-checkpoint.test.ts`
Expected: PASS.
- [ ] **Step 6: Commit**
```bash
git add src/scene/StorySceneFlow.tsx src/scene/StorySceneFlow.test.tsx src/scene/adapters/story-adapter.ts src/scene/adapters/story-adapter.test.ts src/scene/scene.css src/App.tsx
git commit -m "feat(v14): play story choices as directed scenes"
```

### Task 3: Expand Expedition semantic scene resolution

**Files:**
- Modify: `src/scene/expedition-scenes.ts`
- Modify: `src/scene/adapters/expedition-adapter.ts`
- Modify: `src/scene/adapters/expedition-adapter.test.ts`
- Create: `src/scene/expedition-scenes.test.ts`

**Interfaces:**
Use existing exact node union from adapter: `camp | path | crossroads | ruin | rift | treasure | encounter | return`.
```ts
export type ExpeditionScenePlan={node:ExpeditionSceneNode;location:'old_shrine'|'expedition_field';primaryInteractionId:string;nextNodes:readonly ExpeditionSceneNode[]};
export function resolveExpeditionScenePlan(node:unknown):ExpeditionScenePlan;
```

- [ ] **Step 1: Write failing semantic-node tests**
Assert all 8 node plans exist, malformed node sanitizes to camp, encounter maps to battle interaction, return maps to travel/end interaction.
- [ ] **Step 2: Run RED**
Run: `npx vitest run src/scene/expedition-scenes.test.ts src/scene/adapters/expedition-adapter.test.ts`
Expected: new plan tests FAIL.
- [ ] **Step 3: Implement plan resolution without Tactical state**
The module returns scene/presentation routing only. Keep `reconcileExpeditionCheckpoint(checkpoint,hasCanonicalBattleProof)` as authority for post-encounter recovery.
- [ ] **Step 4: Run GREEN**
Run: `npx vitest run src/scene/expedition-scenes.test.ts src/scene/adapters/expedition-adapter.test.ts`
Expected: PASS.
- [ ] **Step 5: Commit**
```bash
git add src/scene/expedition-scenes.ts src/scene/expedition-scenes.test.ts src/scene/adapters/expedition-adapter.ts src/scene/adapters/expedition-adapter.test.ts
git commit -m "feat(v14): resolve guardian expedition journey nodes"
```

### Task 4: Wrap TacticalExpeditionFlow in a journey scene shell

**Files:**
- Create: `src/scene/ExpeditionJourneyFlow.tsx`
- Create: `src/scene/ExpeditionJourneyFlow.test.tsx`
- Modify: `src/TacticalExpeditionFlow.tsx`
- Modify: `src/tactical-expedition-flow.css`
- Modify: `src/scene/adapters/tactical-adapter.ts`
- Modify: existing Root/overlay integration only where the current expedition entry is mounted

**Interfaces:**
`ExpeditionJourneyFlow` owns semantic node/checkpoint presentation. At `encounter`, it renders existing `TacticalExpeditionFlow`. Tactical completion continues through current `onComplete(...)` / `onExpeditionFinish(...)`; journey advances only after canonical proof is observable.

- [ ] **Step 1: Write failing flow tests**
Assert `camp -> path -> encounter` can be represented without starting Tactical early; battle completion proof advances to `post_encounter`; without proof reload remains/reverts to encounter.
- [ ] **Step 2: Preserve Tactical duplicate protection**
Add/retain test that `buildTacticalCompletionAction(input,true)` returns null and false returns exactly one `COMPLETE_TACTICAL_BATTLE` action.
- [ ] **Step 3: Run RED**
Run: `npx vitest run src/scene/ExpeditionJourneyFlow.test.tsx src/scene/adapters/tactical-adapter.test.ts src/scene/adapters/expedition-adapter.test.ts`
Expected: journey test RED.
- [ ] **Step 4: Implement thin journey wrapper**
Never recreate `BattleSession`, score, Bond or rewards in the wrapper. Keep `TacticalExpeditionFlow` responsible for setup/battle/result internals. After completion, re-resolve checkpoint from canonical records before showing next node.
- [ ] **Step 5: Keep short-phone CTA invariant**
Do not move `.tactical-setup-actions` back into scrolling content. Maintain grid `minmax(0,1fr) auto`, safe-area padding, and >=48px Start button.
- [ ] **Step 6: Run GREEN + Tactical regressions**
Run: `npx vitest run src/scene/ExpeditionJourneyFlow.test.tsx src/scene/adapters/tactical-adapter.test.ts src/scene/adapters/expedition-adapter.test.ts src/v13-tactical-no-overlap.test.ts src/v14-ux-regression-batch.test.ts`
Expected: PASS.
- [ ] **Step 7: Commit**
```bash
git add src/scene/ExpeditionJourneyFlow.tsx src/scene/ExpeditionJourneyFlow.test.tsx src/TacticalExpeditionFlow.tsx src/tactical-expedition-flow.css src/scene/adapters/tactical-adapter.ts
git commit -m "feat(v14): bridge expedition journey scenes to tactical"
```

### Task 5: Story + Expedition reload/idempotence gate

- [ ] Run: `npx vitest run src/scene/StorySceneFlow.test.tsx src/scene/ExpeditionJourneyFlow.test.tsx src/scene/activity-checkpoint.test.ts src/scene/adapters/story-adapter.test.ts src/scene/adapters/expedition-adapter.test.ts src/scene/adapters/tactical-adapter.test.ts`
Expected: PASS.
- [ ] Add one integration regression proving `commit -> interrupt presentation -> reload` keeps the canonical result and cannot claim it again.
- [ ] Run: `npm test`
Expected: all tests PASS.
- [ ] Run: `npm run build`
Expected: TypeScript and Vite production build PASS.
