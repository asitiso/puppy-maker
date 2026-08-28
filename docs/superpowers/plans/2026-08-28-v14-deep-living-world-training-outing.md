# V14 Deep Living World Training + Outing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn Hunt, Magic, Herb, Forest, Village, and Lakeside into distinct scene-first playable activities while preserving current Training and Outing domain authority.

**Architecture:** Training activity selection resolves a location scene and then hands into the existing `TrainingActivityMinigame`/canonical `TRAIN` and `FINISH_TRAINING` actions. Outing renders visible scene targets, but `resolveOutingOutcome` continues delegating to `adventure.ts`; scene targets select presentation context, not rewards.

**Tech Stack:** React, TypeScript, Vitest, existing Scene modules, existing Training/Adventure domain.

**Spec:** `docs/superpowers/specs/2026-08-28-v14-deep-living-world-expansion-design.md`

## Global Constraints
- Hunt/Magic/Herb are all first-class recurring V14 minigames.
- Minigame performance is presentation-only; no direct stat/reward/mastery scaling.
- Non-rest schedule order and duplicates are preserved.
- Outing reward/event/discovery calculation remains in `adventure.ts`.
- Scene interactions use the shared SceneDirector lifecycle and >=44px mobile targets.

---

### Task 1: Resolve Training activities into real Scene locations

**Files:**
- Create: `src/scene/training-scenes.ts`
- Create: `src/scene/training-scenes.test.ts`
- Modify: `src/TrainingActivityMinigame.tsx`
- Modify: `src/scene/scene-registry.ts`

**Interfaces:**
```ts
export function sceneLocationForTraining(activity:'hunt'|'magic'|'herb'):'training_ground'|'magic_classroom'|'herb_garden';
export function primaryTrainingInteraction(activity:'hunt'|'magic'|'herb'):string;
```

- [ ] **Step 1: Write failing mapping tests**
```ts
expect(sceneLocationForTraining('hunt')).toBe('training_ground');
expect(sceneLocationForTraining('magic')).toBe('magic_classroom');
expect(sceneLocationForTraining('herb')).toBe('herb_garden');
```
- [ ] **Step 2: Run RED**
Run: `npx vitest run src/scene/training-scenes.test.ts`
Expected: FAIL because module is absent/incomplete.
- [ ] **Step 3: Implement pure mappings and verify registry objects**
Hunt primary target=`dummy`, Magic=`circle`, Herb=`workbench`; exits remain secondary routes.
- [ ] **Step 4: Run GREEN**
Run: `npx vitest run src/scene/training-scenes.test.ts src/scene/scene-registry.test.ts`
Expected: PASS.
- [ ] **Step 5: Commit**
```bash
git add src/scene/training-scenes.ts src/scene/training-scenes.test.ts src/scene/scene-registry.ts
git commit -m "feat(v14): resolve training into distinct places"
```

### Task 2: Deepen Hunt, Magic, Herb without creating a second progression engine

**Files:**
- Modify: `src/training-minigames.ts`
- Modify: `src/training-minigames.test.ts`
- Modify: `src/TrainingActivityMinigame.tsx`
- Modify: `src/training-minigames.css`
- Modify: `src/scene/adapters/raising-adapter.ts`
- Create: `src/v14-training-depth.test.tsx`

**Interfaces:**
```ts
export type TrainingPresentationGrade='clean'|'good'|'recovered';
export function challengeForRound(activity:'hunt'|'magic'|'herb',seed:number,round:number):{difficulty:number;presentationGradeFloor:TrainingPresentationGrade};
```
Canonical dispatch remains `trainingStepAction(kind,accuracy)` then one `finishTrainingAction(eventRoll)`.

- [ ] **Step 1: Write failing pure tests**
Assert difficulty increases across rounds, same seed is deterministic, and `buildTrainingActivityQueue(['magic','magic','rest','herb'])` remains `['magic','magic','herb']`.
- [ ] **Step 2: Run RED**
Run: `npx vitest run src/training-minigames.test.ts`
Expected: FAIL for new challenge helpers.
- [ ] **Step 3: Implement minimal challenge progression**
Hunt narrows timing/varies required action; Magic grows rune length and shortens preview within an accessible floor; Herb adds closer clue distractors. Do not alter canonical reward formulas.
- [ ] **Step 4: Add presentation-only combo/grade**
Keep grade in component-local state. On success/failure dispatch only the existing canonical `TRAIN` action mapping; completion still dispatches one `FINISH_TRAINING`.
- [ ] **Step 5: Run GREEN**
Run: `npx vitest run src/training-minigames.test.ts src/v14-training-depth.test.tsx src/v9-mobile-active-play.test.tsx`
Expected: PASS.
- [ ] **Step 6: Commit**
```bash
git add src/training-minigames.ts src/training-minigames.test.ts src/TrainingActivityMinigame.tsx src/training-minigames.css src/scene/adapters/raising-adapter.ts src/v14-training-depth.test.tsx
git commit -m "feat(v14): deepen three scheduled training minigames"
```

### Task 3: Mount each Training minigame inside its resolved Scene

**Files:**
- Modify: `src/App.tsx` (`Training` boundary only)
- Create: `src/scene/TrainingSceneFlow.tsx`
- Create: `src/scene/TrainingSceneFlow.test.tsx`
- Modify: `src/scene/scene.css`

**Interfaces:**
`TrainingSceneFlow` consumes schedule/calendar/score/combo and the existing `onTrain(kind,accuracy)` / `onFinish()` callbacks. It owns only presentation routing between SceneStage and minigame.

- [ ] **Step 1: Write failing source/component test**
Assert App renders `<TrainingSceneFlow` and the flow renders `SceneStage` for current activity before/around the matching minigame.
- [ ] **Step 2: Run RED**
Run: `npx vitest run src/scene/TrainingSceneFlow.test.tsx src/v9-mobile-active-play.test.tsx`
Expected: FAIL because App directly renders `TrainingActivityMinigame`.
- [ ] **Step 3: Implement thin wrapper**
Use `sceneLocationForTraining`, `resolveScene`, and shared SceneDirector; do not move training reward logic into the wrapper.
- [ ] **Step 4: Run GREEN**
Run: `npx vitest run src/scene/TrainingSceneFlow.test.tsx src/training-minigames.test.ts src/v14-training-depth.test.tsx src/v9-mobile-active-play.test.tsx`
Expected: PASS.
- [ ] **Step 5: Commit**
```bash
git add src/App.tsx src/scene/TrainingSceneFlow.tsx src/scene/TrainingSceneFlow.test.tsx src/scene/scene.css
git commit -m "feat(v14): present scheduled training through scenes"
```

### Task 4: Make Forest, Village, Lakeside target-driven exploration scenes

**Files:**
- Modify: `src/scene/outing-scenes.ts`
- Modify: `src/scene/adapters/outing-adapter.ts`
- Modify: `src/scene/adapters/outing-adapter.test.ts`
- Create: `src/scene/OutingSceneFlow.tsx`
- Create: `src/scene/OutingSceneFlow.test.tsx`
- Modify: `src/LayeredHome.tsx` only at existing Outing entry/routing boundary
- Modify: `src/scene/scene.css`

**Interfaces:**
```ts
export type OutingTarget={interactionId:string;location:'forest'|'village'|'lakeside';presentationHint:string};
export function outingTargets(location:OutingLocationId):readonly OutingTarget[];
```
`OutingSceneFlow` emits the existing canonical outing callback once after the shared committing boundary.

- [ ] **Step 1: Write failing target tests**
Forest must expose trace/tree/herb/path; Village square/shop/performance/repair/alley; Lakeside water/fish/rest/wind-crystal.
- [ ] **Step 2: Prove adapter parity**
```ts
expect(resolveOutingOutcome(location,xp,discoveries,roll)).toEqual(pickExplorationOutcome(location,xp,discoveries,roll));
```
Run: `npx vitest run src/scene/adapters/outing-adapter.test.ts src/scene/OutingSceneFlow.test.tsx`
Expected: new flow test RED, adapter parity stays GREEN.
- [ ] **Step 3: Implement scene-first flow**
Tap target -> approach -> inspect/action -> committing boundary -> existing outing callback/domain -> staged event/discovery result -> re-resolved scene. Never embed event/reward constants in React.
- [ ] **Step 4: Add deterministic place differentiation**
Pass year/month/week/current and inherited world facts into `resolveScene`; same week must not reroll weather.
- [ ] **Step 5: Run GREEN + adventure regressions**
Run: `npx vitest run src/scene/OutingSceneFlow.test.tsx src/scene/adapters/outing-adapter.test.ts src/scene/scene-resolver.test.ts src/v14-ux-regression-batch.test.ts`
Expected: PASS.
- [ ] **Step 6: Commit**
```bash
git add src/scene/outing-scenes.ts src/scene/adapters/outing-adapter.ts src/scene/adapters/outing-adapter.test.ts src/scene/OutingSceneFlow.tsx src/scene/OutingSceneFlow.test.tsx src/LayeredHome.tsx src/scene/scene.css
git commit -m "feat(v14): make outings explorable living scenes"
```

### Task 5: Training + Outing gate

- [ ] Run: `npx vitest run src/training-minigames.test.ts src/scene/training-scenes.test.ts src/scene/TrainingSceneFlow.test.tsx src/scene/OutingSceneFlow.test.tsx src/scene/adapters/raising-adapter.test.ts src/scene/adapters/outing-adapter.test.ts src/v14-ux-regression-batch.test.ts src/v9-mobile-active-play.test.tsx`
Expected: PASS.
- [ ] Run: `npm test`
Expected: all tests PASS.
- [ ] Run: `npm run build`
Expected: TypeScript + Vite production build PASS.
- [ ] Confirm no primary action is hidden at 360x640 through existing static/mobile assertions before moving to Story + Expedition.
