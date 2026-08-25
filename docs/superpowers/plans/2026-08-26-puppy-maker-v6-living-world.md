# V6 Living World Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make earlier generations visibly reshape later-generation world events, NPC presence and civic projects without inheriting raw power or duplicating the V4 calendar.

**Architecture:** Add one bounded `GenerationalWorldState` domain, integrate project contribution into the existing successful weekly world-focus completion path, preserve only long-world narrative state across generation/NG+ transitions, and feed derived context into the existing weekly-event/NPC presentation layers. `hubNextAction`, V4 calendar settlement and typed World Facts remain authoritative.

**Tech Stack:** TypeScript, React, Vitest, Vite, existing reducer/persistence architecture.

**Spec:** `docs/superpowers/specs/2026-08-26-puppy-maker-v6-living-world-design.md`

## Global Constraints
- `worldHistory.currentFacts` and `worldHistory.inheritedFacts` remain separate and authoritative.
- `NEW_RUN` remains NG+ only; `START_NEXT_GENERATION` remains lineage only.
- Do not create a second week/month settlement path.
- Do not create a second Hub primary CTA selector.
- No raw stat/gold/gem/inventory/tactical/expedition inheritance.
- Legacy markers <= 6; project progress finite integer 0..100; completed projects canonical and unique.
- True/Hollow ancestry is narrative echo only, never automatic route activation.
- Every production behavior follows RED -> verify failure -> minimal GREEN -> regression.

---

### Task 1: Generational World Domain and Hydration

**Files:**
- Create: `src/generational-world.ts`
- Test: `src/v6-generational-world-domain.test.ts`

**Interfaces:**
- Produces `LegacyWorldMarkerId`, `PublicProjectId`, `GenerationalWorldState`.
- Produces `emptyGenerationalWorldState()`, `hydrateGenerationalWorldState(raw)`, `deriveLegacyWorldMarkers(input)`, `startPublicProject(state,id)`, `contributeToPublicProject(state,amount)`.

- [ ] **Step 1: Write the failing domain test**

```ts
import {describe,expect,it} from 'vitest';
import {
  emptyGenerationalWorldState,
  hydrateGenerationalWorldState,
  deriveLegacyWorldMarkers,
  startPublicProject,
  contributeToPublicProject,
} from './generational-world';

it('hydrates canonical bounded world state',()=>{
  expect(hydrateGenerationalWorldState({
    legacyMarkers:['hollow_scar','bad','festival_tradition','hollow_scar'],
    activeProject:'guardian_academy',
    projectProgress:Number.POSITIVE_INFINITY,
    completedProjects:['regional_council','bad','regional_council'],
  })).toEqual({
    legacyMarkers:['festival_tradition','hollow_scar'],
    activeProject:'guardian_academy',
    projectProgress:0,
    completedProjects:['regional_council'],
  });
});

it('derives legacy markers deterministically from ancestor and inherited facts',()=>{
  expect(deriveLegacyWorldMarkers({
    ancestors:[{majorWorldFacts:['festival_saved','hollow_rift_entrenched']}],
    inheritedFacts:['regional_alliance','rift_stabilized'],
  })).toEqual(['festival_tradition','regional_compact','restored_riftward','hollow_scar']);
});

it('starts one unfinished project and completes it at 100 without duplicate records',()=>{
  const started=startPublicProject(emptyGenerationalWorldState(),'guardian_academy');
  const ninety=contributeToPublicProject(started,90);
  const complete=contributeToPublicProject(ninety,15);
  expect(complete).toEqual({legacyMarkers:[],activeProject:null,projectProgress:0,completedProjects:['guardian_academy']});
  expect(contributeToPublicProject(complete,10)).toEqual(complete);
});
```

- [ ] **Step 2: Run RED**

Run: `npm run test -- src/v6-generational-world-domain.test.ts`
Expected: FAIL because `./generational-world` does not exist.

- [ ] **Step 3: Implement minimal domain**

```ts
export const legacyWorldMarkerIds=[
  'festival_tradition','open_road_network','regional_compact',
  'restored_riftward','forbidden_legacy','hollow_scar',
] as const;
export const publicProjectIds=[
  'guardian_academy','ancient_road_restoration','regional_council','rift_watch',
] as const;

export type LegacyWorldMarkerId=typeof legacyWorldMarkerIds[number];
export type PublicProjectId=typeof publicProjectIds[number];
export type GenerationalWorldState={
  legacyMarkers:LegacyWorldMarkerId[];
  activeProject:PublicProjectId|null;
  projectProgress:number;
  completedProjects:PublicProjectId[];
};

export const emptyGenerationalWorldState=():GenerationalWorldState=>({legacyMarkers:[],activeProject:null,projectProgress:0,completedProjects:[]});
```

Add canonical registry-order sanitization, deterministic fact-to-marker rules, project start and clamped contribution exactly as specified.

- [ ] **Step 4: Run GREEN**

Run: `npm run test -- src/v6-generational-world-domain.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/generational-world.ts src/v6-generational-world-domain.test.ts
git commit -m "feat(v6): add generational world domain"
```

---

### Task 2: Game State, Save Hydration and Weekly Project Contribution

**Files:**
- Modify: `src/game.ts`
- Test: `src/v6-generational-world-game.test.ts`

**Interfaces:**
- Consumes Task 1 state/helpers.
- Produces `GameState.generationalWorld` and action `{type:'START_PUBLIC_PROJECT';projectId:PublicProjectId}`.

- [ ] **Step 1: Write failing reducer tests**

```ts
it('hydrates V6 state and accepts a canonical unfinished project',()=>{
  const state=hydrateGameState({generationalWorld:{activeProject:'guardian_academy',projectProgress:30}});
  expect(state.generationalWorld.activeProject).toBe('guardian_academy');
  expect(state.generationalWorld.projectProgress).toBe(30);
});

it('adds project progress exactly once for a completed world-focus week',()=>{
  let state={...initialState,generationalWorld:startPublicProject(initialState.generationalWorld,'guardian_academy')};
  state=reducer(state,{type:'SELECT_WEEKLY_FOCUS',focus:'world'});
  state=reducer(state,{type:'COMPLETE_WEEKLY_FOCUS'});
  expect(state.generationalWorld.projectProgress).toBe(10);
  const duplicate=reducer(state,{type:'COMPLETE_WEEKLY_FOCUS'});
  expect(duplicate.generationalWorld.projectProgress).toBe(10);
});
```

- [ ] **Step 2: Run RED**

Run: `npm run test -- src/v6-generational-world-game.test.ts`
Expected: FAIL because `GameState` has no `generationalWorld`/action bridge.

- [ ] **Step 3: Minimal reducer bridge**

Add to `GameState`, `initialState`, hydration and `Action`:

```ts
generationalWorld:GenerationalWorldState;
// action
{type:'START_PUBLIC_PROJECT';projectId:PublicProjectId}
```

In successful `COMPLETE_WEEKLY_FOCUS`, after duplicate-resolution guard, update project only when `weekly.focus==='world'`:

```ts
const generationalWorld=weekly.focus==='world'
  ? contributeToPublicProject(state.generationalWorld,10)
  : state.generationalWorld;
return {...applyWeeklyEffect(state,event),weeklyLife,generationalWorld};
```

- [ ] **Step 4: Run GREEN plus V4 cadence regression**

Run: `npm run test -- src/v6-generational-world-game.test.ts src/v4-weekly-boundaries.test.ts src/v4-living-year-soak.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game.ts src/v6-generational-world-game.test.ts
git commit -m "feat(v6): connect world projects to weekly life"
```

---

### Task 3: Generation Transition and NG+ Isolation

**Files:**
- Modify: `src/game.ts`
- Test: `src/v6-generational-world-transition.test.ts`

**Interfaces:**
- Consumes `deriveLegacyWorldMarkers()`.
- Preserves completed projects across generation/NG+; clears in-progress work at generation transition.

- [ ] **Step 1: Write failing transition tests**

```ts
it('derives next-generation markers and preserves completed civic history while resetting raw power',()=>{
  const eligible=makeMatureCompletedState({
    gold:9999,
    worldFacts:['festival_saved','regional_alliance'],
    completedProjects:['guardian_academy'],
    activeProject:'rift_watch',
    projectProgress:70,
  });
  const next=reducer(eligible,{type:'START_NEXT_GENERATION'});
  expect(next.lineage.generation).toBe(2);
  expect(next.generationalWorld.legacyMarkers).toEqual(['festival_tradition','regional_compact']);
  expect(next.generationalWorld.completedProjects).toEqual(['guardian_academy']);
  expect(next.generationalWorld.activeProject).toBeNull();
  expect(next.gold).toBe(initialState.gold);
});

it('NG+ preserves long-world state but does not activate True or Hollow from ancestry',()=>{
  const next=reducer(makeNgPlusEligibleState(),{type:'NEW_RUN'});
  expect(next.generationalWorld).toEqual(expect.objectContaining({legacyMarkers:expect.any(Array)}));
  expect(next.campaignRun.activeRoute).not.toBe('hollow');
  expect(next.campaignRun.activeCampaign).not.toBe('true_path');
});
```

- [ ] **Step 2: Run RED**

Run: `npm run test -- src/v6-generational-world-transition.test.ts`
Expected: FAIL because transition does not preserve/derive V6 state.

- [ ] **Step 3: Minimal transition implementation**

Before returning from `START_NEXT_GENERATION`, compute:

```ts
const completedProjects=state.generationalWorld.completedProjects;
const generationalWorld=hydrateGenerationalWorldState({
  legacyMarkers:deriveLegacyWorldMarkers({
    ancestors:[...lineage.ancestors],
    inheritedFacts:state.worldHistory.inheritedFacts,
  }),
  activeProject:null,
  projectProgress:0,
  completedProjects,
});
return {...initialState,lineage,generationalWorld} as GameState;
```

In `NEW_RUN`, explicitly preserve `generationalWorld:state.generationalWorld` alongside lineage.

- [ ] **Step 4: Run GREEN plus V5 compatibility**

Run: `npm run test -- src/v6-generational-world-transition.test.ts src/v5-generation-transition.test.ts src/v5-lineage-ngplus-compatibility.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game.ts src/v6-generational-world-transition.test.ts
git commit -m "feat(v6): carry narrative world legacy across runs"
```

---

### Task 4: Legacy-Aware Weekly Events and Living NPCs

**Files:**
- Modify: `src/weekly-life.ts`
- Modify: `src/living-npcs.ts`
- Test: `src/v6-living-world-events.test.ts`
- Test: `src/v6-living-world-npcs.test.ts`

**Interfaces:**
- `WeeklyLifeContext` gains optional `legacyMarkers` and `completedProjects`.
- `LivingNpcContext` gains generation, markers and completed projects.

- [ ] **Step 1: Write failing event/NPC tests**

```ts
expect(weeklyEventFor({...worldContext,generation:2,legacyMarkers:['hollow_scar'],completedProjects:[]})).toBe('scarred_district');
expect(weeklyEventFor({...worldContext,legacyMarkers:['open_road_network'],completedProjects:[]})).toBe('legacy_road_patrol');
expect(weeklyNpcPresence({...npcContext,generation:3,legacyMarkers:['regional_compact'],completedProjects:[]})).toContain('noa');
expect(weeklyNpcPresence({...npcContext,generation:3,legacyMarkers:['hollow_scar'],completedProjects:[]})).not.toContain('veyr');
```

- [ ] **Step 2: Run RED**

Run: `npm run test -- src/v6-living-world-events.test.ts src/v6-living-world-npcs.test.ts`
Expected: FAIL on missing context/event IDs.

- [ ] **Step 3: Add minimal canonical variants**

Extend event IDs with `academy_drill`, `legacy_road_patrol`, `rift_watch_rounds`, `scarred_district`; add modest current-run effects and preserve route priority exactly as the spec states. Extend NPC context while preserving primary-first/max-three behavior.

- [ ] **Step 4: Wire context from `src/game.ts` and `src/LayeredHome.tsx` where existing callers construct contexts**

Pass:
```ts
generation:state.lineage.generation,
legacyMarkers:state.generationalWorld.legacyMarkers,
completedProjects:state.generationalWorld.completedProjects,
```

- [ ] **Step 5: Run GREEN**

Run: `npm run test -- src/v6-living-world-events.test.ts src/v6-living-world-npcs.test.ts src/weekly-life.test.ts src/living-npcs.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/weekly-life.ts src/living-npcs.ts src/game.ts src/LayeredHome.tsx src/v6-living-world-events.test.ts src/v6-living-world-npcs.test.ts
git commit -m "feat(v6): make weekly world react to lineage legacy"
```

---

### Task 5: Compact World Chronicle UI

**Files:**
- Create: `src/WorldChronicle.tsx`
- Create: `src/world-chronicle.css`
- Modify: `src/LayeredHome.tsx`
- Test: `src/v6-world-chronicle-ui.test.tsx`

**Interfaces:**
- Component consumes `{generation,world}` only; no dispatch required for first compact view.

- [ ] **Step 1: Write failing UI contract**

```tsx
render(<WorldChronicle generation={3} world={{
  legacyMarkers:['festival_tradition','hollow_scar'],
  activeProject:'rift_watch',projectProgress:40,completedProjects:[],
}}/>);
expect(screen.getByText('3세대의 세계')).toBeTruthy();
expect(screen.getByText('축제의 전통')).toBeTruthy();
expect(screen.getByText('40%')).toBeTruthy();
```

Also assert source/CSS contract contains no `lh-primary-action`, no horizontal overflow rule regression and uses existing focus/reduced-motion conventions.

- [ ] **Step 2: Run RED**

Run: `npm run test -- src/v6-world-chronicle-ui.test.tsx`
Expected: FAIL because component does not exist.

- [ ] **Step 3: Implement compact secondary card**

Use canonical label maps from `generational-world.ts`; show max three markers and project summary. Mount once near lineage/weekly secondary information in `LayeredHome` without introducing navigation priority logic.

- [ ] **Step 4: Run GREEN plus Hub/mobile tests**

Run: `npm run test -- src/v6-world-chronicle-ui.test.tsx src/layered-home-ui.test.ts src/LayeredHome.test.tsx src/spring-hub-mobile.test.ts src/autumn-hub-mobile.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/WorldChronicle.tsx src/world-chronicle.css src/LayeredHome.tsx src/v6-world-chronicle-ui.test.tsx
git commit -m "feat(v6): show generational World Chronicle"
```

---

### Task 6: Five-Generation Soak, Malformed Persistence and Release Gate

**Files:**
- Create: `src/v6-living-world-soak.test.ts`
- Test/verify existing V3/V4/V5 suites.

**Interfaces:**
- Exercises only public reducer APIs and hydrate/save paths.

- [ ] **Step 1: Write failing/coverage-completing five-generation soak**

The soak must loop canonical weekly actions, complete at least two different public projects, transition five generations, save/reload between generations, inject malformed V6 persisted data once, and assert:

```ts
expect(state.lineage.generation).toBe(6);
expect(state.generationalWorld.legacyMarkers.length).toBeLessThanOrEqual(6);
expect(new Set(state.generationalWorld.completedProjects).size).toBe(state.generationalWorld.completedProjects.length);
expect(Number.isFinite(state.generationalWorld.projectProgress)).toBe(true);
expect(state.campaignRun.activeRoute).not.toBe('hollow'); // unless explicitly selected in that run
```

Recursively assert no persisted numeric leaf is NaN/Infinity.

- [ ] **Step 2: Run targeted soak**

Run: `npm run test -- src/v6-living-world-soak.test.ts`
Expected: PASS after Tasks 1-5; if it fails, add a RED reproducer before any production fix.

- [ ] **Step 3: Full regression**

Run: `npm run test`
Expected: all test files/tests PASS.

- [ ] **Step 4: Dependency and build gate**

Run: `npm audit --json`
Expected: total vulnerabilities 0.

Run: `npm run build`
Expected: `tsc -b && vite build` PASS.

- [ ] **Step 5: Verify exact branch head and open/update PR to `integration/v3`**

Record exact SHA/tree and CI evidence in PR # for issue #192. No force push.

- [ ] **Step 6: Integration, release PR, main and production verification**

Only after exact work tree is green:
- merge normally to `integration/v3`;
- verify integration CI/preview;
- create release PR `integration/v3 -> main`;
- verify release synthetic CI;
- merge normally to main;
- verify main push CI on exact SHA;
- verify Vercel production exact main SHA READY;
- root HTTP 200;
- `/api/client-telemetry` HTTP 200 `{"ok":true}`;
- error/fatal runtime logs empty in the release window;
- comment evidence and close #192 `completed`.

## Self-Review
- Spec coverage: domain, bounded hydration, public projects, weekly contribution, generation/NG+ separation, NPC/event variation, compact UI, mobile constraints, True/Hollow isolation, five-generation soak and production gate are all assigned to tasks.
- Placeholder scan: no TBD/TODO/implement-later steps remain.
- Type consistency: `GenerationalWorldState`, `LegacyWorldMarkerId`, `PublicProjectId`, `generationalWorld` and action names are consistent across tasks.
