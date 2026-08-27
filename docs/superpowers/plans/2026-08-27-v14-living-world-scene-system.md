# V14 Living World / Scene System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Home, Training, Outing, Story, and Expedition into one shared scene-driven, point-and-click living-world presentation while preserving the current reducer/domain systems as the only authority for durable gameplay results.

**Architecture:** Add a focused `src/scene/` subsystem containing typed scene contracts, deterministic world variation, a pure resolver, a Scene Director interaction state machine, actor/prop renderers, thin domain adapters, and sanitized semantic checkpoints. Existing Raising, Story, Outing, Tactical, Bond, equipment, NG+, and World Fact logic remain canonical; Scene Runtime only presents, routes input, commits through existing domain actions/resolvers, then re-renders from committed state.

**Tech Stack:** React, TypeScript, Vite, Vitest, `react-dom/server`, existing CSS and asset fallback infrastructure.

**Spec:** `docs/superpowers/specs/2026-08-27-v14-living-world-scene-system-design.md`

## Global Constraints

- Authoritative implementation baseline: `main@57c4b7975c5ae1936802c66a1a7446a82bf10f14`; execution starts from the latest `main` only after ensuring it contains the approved spec/plan or rebasing those docs into the implementation branch.
- Use one implementation branch: `work/v14-living-world`; never implement directly on `main` or `integration/v3`.
- Reducer/domain logic is authoritative; Scene Runtime cannot directly award stats, items, currency, Bond, discoveries, progression, or battle results.
- V14 minigame performance is presentation-only and cannot modify canonical growth/rewards.
- Gameplay commit happens before result-only presentation.
- Animation frames, camera state, particles, and actor pixel coordinates are never durable game state.
- Long-flow persistence uses sanitized semantic checkpoints with adapter-owned literal phases only.
- Free joystick movement, collision physics, arbitrary pathfinding, tile maps, Live2D/Spine, and a replacement Tactical engine are outside V14.
- Season mapping is fixed: months 1-3 spring, 4-6 summer, 7-9 autumn, 10-12 winter.
- Weekly weather must be deterministic from canonical `weekKey(year, month, week)` and must not reroll on render/re-entry.
- Variant priority is fixed: Story override > Campaign/World Fact override > location special condition > weekly weather > default.
- Mobile acceptance includes 360x640, 390x844, and 430px-class widths, minimum 44px hit areas, safe-area support, Korean wrapping, focus-visible support, and reduced-motion parity.
- Home consumes Scene Runtime; `LayeredHome.tsx` must not become the scene engine.
- Each task follows TDD: RED test -> verify RED -> minimal implementation -> targeted GREEN -> relevant suite -> commit.
- Before each slice promotion run targeted tests, relevant feature tests, full `npx vitest run`, `npx tsc -b`, and `npx vite build`.

---

## File Structure Locked by This Plan

### New scene core

- `src/scene/scene-types.ts` — stable scene/location/actor/interaction/beat contracts.
- `src/scene/scene-calendar.ts` — canonical month -> season derivation.
- `src/scene/scene-weather.ts` — deterministic weekly weather resolver.
- `src/scene/scene-asset-registry.ts` — layered visual lookup and fallback chain.
- `src/scene/scene-registry.ts` — declarative definitions for the nine V14 location families.
- `src/scene/scene-resolver.ts` — pure state/context -> `ResolvedScene` selector.
- `src/scene/scene-runtime.ts` — pure interaction lifecycle reducer and behavior-priority helpers.
- `src/scene/activity-checkpoint.ts` — semantic checkpoint types, sanitization, and safe resume helpers.
- `src/scene/adapters/raising-adapter.ts` — scene training command -> existing Raising action/result.
- `src/scene/adapters/story-adapter.ts` — Story scene choice -> canonical `EVENT_CHOICE`.
- `src/scene/adapters/outing-adapter.ts` — Outing scene interaction -> existing exploration/effect APIs.
- `src/scene/adapters/expedition-adapter.ts` — semantic expedition node/encounter routing.
- `src/scene/adapters/tactical-adapter.ts` — Tactical handoff/return presentation contract; no battle calculation.

### New scene React layer

- `src/scene/SceneDirector.tsx` — orchestration wrapper using runtime reducer + adapter callbacks.
- `src/scene/SceneStage.tsx` — layered background, actors, props, dialogue/overlay regions.
- `src/scene/CharacterActor.tsx` — pose/sprite fallback, anchor placement, facing, motion classes.
- `src/scene/InteractiveObject.tsx` — accessible 44px hit target and interaction affordance.
- `src/scene/WorldMapScene.tsx` — visual location selector/unlock shell.
- `src/scene/scene.css` — shared scene layout, motion, responsive, safe-area, reduced-motion rules.

### Existing files intentionally integrated, not replaced wholesale

- `src/LayeredHome.tsx`
- `src/MobileSceneBackground.tsx`
- `src/MobileCharacterArt.tsx`
- `src/mobile-visual-assets.ts`
- `src/runa-presentation.ts`
- `src/components/StoryEvent.tsx`
- `src/adventure.ts`
- `src/game.ts`
- existing Training/Expedition/Tactical entry components discovered during each task before editing.

### Test layout

- Pure tests live beside scene modules as `src/scene/*.test.ts`.
- React/static-markup tests use `*.test.tsx` and `renderToStaticMarkup`, matching existing V13 tests.
- Cross-feature regressions use `src/v14-*.test.ts(x)` when they intentionally span multiple modules.

---

### Task 1: Scene contracts, season, and deterministic weather

**Slice:** A — Scene Foundation

**Files:**
- Create: `src/scene/scene-types.ts`
- Create: `src/scene/scene-calendar.ts`
- Create: `src/scene/scene-calendar.test.ts`
- Create: `src/scene/scene-weather.ts`
- Create: `src/scene/scene-weather.test.ts`

**Interfaces:**
- Produces: `LocationId`, `TimeOfDay`, `Season`, `Weather`, `InteractionMode`, `SceneDefinition`, `ResolvedScene`, `SceneActorDefinition`, `ResolvedSceneActor`, `SceneAnchor`, `SceneInteractionDefinition`, `ResolvedSceneInteraction`, `SceneBeat`, `SceneVisualLayer`, `SceneRequest`.
- Produces: `seasonForMonth(month:number): Season`.
- Produces: `weatherForWeek(year:number, month:number, week:number): Weather`.
- Consumes: `weekKey` from `src/weekly-calendar.ts`.

- [ ] **Step 1: Write the failing season tests**

```ts
import {describe,expect,it} from 'vitest';
import {seasonForMonth} from './scene-calendar';

describe('V14 scene calendar',()=>{
  it.each([
    [1,'spring'],[3,'spring'],[4,'summer'],[6,'summer'],
    [7,'autumn'],[9,'autumn'],[10,'winter'],[12,'winter'],
  ] as const)('maps month %s to %s',(month,season)=>{
    expect(seasonForMonth(month)).toBe(season);
  });

  it('normalizes malformed months through the canonical calendar range',()=>{
    expect(seasonForMonth(Number.NaN)).toBe('spring');
    expect(seasonForMonth(99)).toBe('winter');
  });
});
```

- [ ] **Step 2: Run the season test and verify RED**

Run: `npx vitest run src/scene/scene-calendar.test.ts`

Expected: FAIL because `scene-calendar.ts` / `seasonForMonth` does not exist.

- [ ] **Step 3: Implement the scene contracts and season helper minimally**

```ts
// src/scene/scene-calendar.ts
import type {Season} from './scene-types';

export function seasonForMonth(month:number):Season{
  const safe=Number.isFinite(month)?Math.min(12,Math.max(1,Math.floor(month))):1;
  if(safe<=3)return 'spring';
  if(safe<=6)return 'summer';
  if(safe<=9)return 'autumn';
  return 'winter';
}
```

`scene-types.ts` must define the fixed nine `LocationId` values and the unions specified by the approved design; no direct stat/reward mutation field is allowed on `SceneInteractionDefinition` or `SceneBeat`.

- [ ] **Step 4: Run the season test and verify GREEN**

Run: `npx vitest run src/scene/scene-calendar.test.ts`

Expected: PASS.

- [ ] **Step 5: Write deterministic weather RED tests**

```ts
import {describe,expect,it} from 'vitest';
import {weatherForWeek} from './scene-weather';

describe('V14 weekly weather',()=>{
  it('returns the same weather for the same canonical week',()=>{
    const a=weatherForWeek(1,8,3);
    const b=weatherForWeek(1,8,3);
    expect(a).toBe(b);
  });

  it('returns only canonical weather values for a representative year',()=>{
    const allowed=new Set(['clear','cloudy','rain','snow','mist']);
    for(let month=1;month<=12;month++){
      for(let week=1;week<=4;week++) expect(allowed.has(weatherForWeek(2,month,week))).toBe(true);
    }
  });
});
```

- [ ] **Step 6: Run the weather test and verify RED**

Run: `npx vitest run src/scene/scene-weather.test.ts`

Expected: FAIL because `weatherForWeek` does not exist.

- [ ] **Step 7: Implement deterministic weather using the canonical week key**

Use one stable string hash of `weekKey(year,month,week)` and map its non-negative modulo to the five weather values. Do not call `Math.random`, `Date`, or browser time APIs.

```ts
const WEATHER:['clear','cloudy','rain','snow','mist']=['clear','cloudy','rain','snow','mist'];
export function weatherForWeek(year:number,month:number,week:number):Weather{
  const key=weekKey(year,month,week);
  let hash=0;
  for(const char of key)hash=((hash*31)+char.charCodeAt(0))|0;
  return WEATHER[Math.abs(hash)%WEATHER.length];
}
```

- [ ] **Step 8: Run Task 1 tests and commit**

Run: `npx vitest run src/scene/scene-calendar.test.ts src/scene/scene-weather.test.ts`

Expected: PASS.

Commit:

```bash
git add src/scene/scene-types.ts src/scene/scene-calendar.ts src/scene/scene-calendar.test.ts src/scene/scene-weather.ts src/scene/scene-weather.test.ts
git commit -m "feat(v14): add scene world contracts"
```

---

### Task 2: Layered asset registry and fail-soft fallback

**Slice:** A — Scene Foundation

**Files:**
- Create: `src/scene/scene-asset-registry.ts`
- Create: `src/scene/scene-asset-registry.test.ts`
- Modify: `src/mobile-visual-assets.ts`
- Reuse: `src/MobileSceneBackground.tsx`, `src/MobileCharacterArt.tsx`

**Interfaces:**
- Consumes: `LocationId`, `Season`, `TimeOfDay`, `Weather`, `SceneVisualLayer`.
- Produces: `resolveSceneVisualLayers(input): SceneVisualLayer[]`.
- Produces: `resolveActorVisual(characterId, pose, motion): {src:string|null; fallbackPose:string}`.

- [ ] **Step 1: Write fallback-order RED tests**

```ts
import {describe,expect,it} from 'vitest';
import {resolveSceneVisualLayers} from './scene-asset-registry';

describe('V14 scene asset fallback',()=>{
  it('always includes a playable base or generic fallback layer',()=>{
    const layers=resolveSceneVisualLayers({
      location:'forest',season:'autumn',timeOfDay:'night',weather:'rain',worldFactIds:[],
    });
    expect(layers.length).toBeGreaterThan(0);
    expect(layers[0]?.kind).toBe('base');
  });

  it('does not throw for an unavailable optional variant',()=>{
    expect(()=>resolveSceneVisualLayers({
      location:'old_shrine',season:'winter',timeOfDay:'night',weather:'mist',worldFactIds:['unknown_fact'],
    })).not.toThrow();
  });
});
```

- [ ] **Step 2: Run and verify RED**

Run: `npx vitest run src/scene/scene-asset-registry.test.ts`

Expected: FAIL because the registry does not exist.

- [ ] **Step 3: Implement a layered lookup that wraps existing visual slots**

Define a text-only registry first. Base scenes may reuse current image slots/fallback classes; optional season/time/weather/world-fact layers may be CSS-only (`src:null`, semantic class token) until dedicated art is added. The function must return a base layer even when every optional lookup misses.

Example result shape:

```ts
[
  {kind:'base',token:'forest',src:null},
  {kind:'season',token:'autumn',src:null},
  {kind:'lighting',token:'night',src:null},
  {kind:'weather',token:'rain',src:null},
]
```

- [ ] **Step 4: Add actor fallback coverage**

Test that missing `magic_cast` for Runa falls back to `training-ready`, then `idle`, and unknown companion pose falls back to the companion default visual/fallback slot without throwing.

- [ ] **Step 5: Run targeted tests and commit**

Run: `npx vitest run src/scene/scene-asset-registry.test.ts src/v13-story-dialogue-stage.test.tsx`

Expected: PASS.

Commit:

```bash
git add src/scene/scene-asset-registry.ts src/scene/scene-asset-registry.test.ts src/mobile-visual-assets.ts
git commit -m "feat(v14): add layered scene asset fallback"
```

---

### Task 3: Nine-location registry and pure Scene Resolver

**Slice:** A — Scene Foundation

**Files:**
- Create: `src/scene/scene-registry.ts`
- Create: `src/scene/scene-registry.test.ts`
- Create: `src/scene/scene-resolver.ts`
- Create: `src/scene/scene-resolver.test.ts`

**Interfaces:**
- Produces: `SCENE_LOCATIONS: Record<LocationId, SceneDefinition>` with all nine location families.
- Produces: `resolveScene(state:GameState, request:SceneRequest):ResolvedScene`.
- Consumes: calendar/weather helpers, asset registry, existing `GameState`, existing Outing/Story/world markers only as read inputs.

- [ ] **Step 1: Write registry completeness RED test**

```ts
import {describe,expect,it} from 'vitest';
import {SCENE_LOCATIONS} from './scene-registry';

it('registers exactly the nine approved V14 location ids',()=>{
  expect(Object.keys(SCENE_LOCATIONS).sort()).toEqual([
    'expedition_field','forest','herb_garden','home','lakeside',
    'magic_classroom','old_shrine','training_ground','village',
  ]);
});
```

- [ ] **Step 2: Run and verify RED**

Run: `npx vitest run src/scene/scene-registry.test.ts`

Expected: FAIL because registry is missing.

- [ ] **Step 3: Implement minimal location definitions**

Each location must define at least a default actor anchor, entry/exit anchors where relevant, and the approved core object IDs. Home must include `bed`, `desk`, `wardrobe`, `bag`, `door`, `world_map`, and `runa`; Forest/Village/Lakeside must include the canonical exploration-facing objects from the spec.

- [ ] **Step 4: Write resolver priority/fallback RED tests**

```ts
import {describe,expect,it} from 'vitest';
import {initialState} from '../game';
import {resolveScene} from './scene-resolver';

it('uses Story override ahead of weekly weather',()=>{
  const scene=resolveScene({...initialState,activeEventId:'quiet_rain'}, {location:'home',activity:'story'});
  expect(scene.weather).toBe('rain');
});

it('falls back unknown runtime location requests to home',()=>{
  const scene=resolveScene(initialState,{location:'bad-location' as never,activity:'home'});
  expect(scene.location).toBe('home');
});
```

- [ ] **Step 5: Run and verify RED**

Run: `npx vitest run src/scene/scene-resolver.test.ts`

Expected: FAIL until resolver exists.

- [ ] **Step 6: Implement pure resolution**

Resolution order must be encoded as one deterministic pipeline: sanitize requested location -> derive season -> derive weekly weather -> apply location transform -> apply World Fact/campaign overlays -> apply Story override -> resolve actor presentation -> resolve available interactions -> resolve visual layers. No state mutation and no random calls.

- [ ] **Step 7: Run Task 3 tests and commit**

Run: `npx vitest run src/scene/scene-registry.test.ts src/scene/scene-resolver.test.ts`

Expected: PASS.

Commit:

```bash
git add src/scene/scene-registry.ts src/scene/scene-registry.test.ts src/scene/scene-resolver.ts src/scene/scene-resolver.test.ts
git commit -m "feat(v14): resolve living world scenes"
```

---

### Task 4: Scene Director runtime state machine, duplicate-tap lock, and behavior priority

**Slice:** A — Scene Foundation

**Files:**
- Create: `src/scene/scene-runtime.ts`
- Create: `src/scene/scene-runtime.test.ts`
- Create: `src/scene/SceneDirector.tsx`

**Interfaces:**
- Produces: `InteractionPhase = 'idle'|'approaching'|'acting'|'committing'|'presenting'`.
- Produces: `SceneRuntimeState`, `SceneRuntimeAction`, `sceneRuntimeReducer`.
- Produces: `resolveActorBehaviorPriority()` implementing fixed Story > player interaction > activity > state reaction > autonomous > idle order.
- `SceneDirector` consumes a `ResolvedScene`, dispatch callback, and adapter router; it does not mutate `GameState` itself.

- [ ] **Step 1: Write lifecycle/lock RED tests**

```ts
import {describe,expect,it} from 'vitest';
import {initialSceneRuntimeState,sceneRuntimeReducer} from './scene-runtime';

it('locks a second interaction once approach starts',()=>{
  const first=sceneRuntimeReducer(initialSceneRuntimeState,{type:'START_INTERACTION',interactionId:'bed'});
  const second=sceneRuntimeReducer(first,{type:'START_INTERACTION',interactionId:'desk'});
  expect(first.phase).toBe('approaching');
  expect(second).toEqual(first);
});

it('advances through commit-before-presentation phases',()=>{
  let state=sceneRuntimeReducer(initialSceneRuntimeState,{type:'START_INTERACTION',interactionId:'bed'});
  state=sceneRuntimeReducer(state,{type:'ARRIVED'});
  state=sceneRuntimeReducer(state,{type:'ACTION_FINISHED'});
  expect(state.phase).toBe('committing');
  state=sceneRuntimeReducer(state,{type:'COMMIT_SUCCEEDED',presentationKey:'rest-ok'});
  expect(state.phase).toBe('presenting');
});
```

- [ ] **Step 2: Run and verify RED**

Run: `npx vitest run src/scene/scene-runtime.test.ts`

Expected: FAIL because runtime module is missing.

- [ ] **Step 3: Implement the minimal pure reducer**

Reject `START_INTERACTION` unless phase is `idle`; allow cancellation only before `committing`; never transition `presenting` back into `committing` for the same interaction.

- [ ] **Step 4: Add behavior-priority test and implementation**

```ts
expect(resolveActorBehaviorPriority({story:true,player:true,activity:true,stateReaction:true,autonomous:true})).toBe('story');
expect(resolveActorBehaviorPriority({story:false,player:false,activity:false,stateReaction:false,autonomous:true})).toBe('autonomous');
```

- [ ] **Step 5: Add thin `SceneDirector` shell**

`SceneDirector` owns only ephemeral runtime state and calls `onCommit(interaction)` when runtime reaches `committing`. It receives the resulting presentation key/state from the adapter callback and then dispatches `COMMIT_SUCCEEDED`; it never alters stats/rewards itself.

- [ ] **Step 6: Run targeted tests and commit**

Run: `npx vitest run src/scene/scene-runtime.test.ts`

Expected: PASS.

Commit:

```bash
git add src/scene/scene-runtime.ts src/scene/scene-runtime.test.ts src/scene/SceneDirector.tsx
git commit -m "feat(v14): add scene director runtime"
```

---

### Task 5: Scene Stage, Character Actor anchors, interactive objects, motion/accessibility CSS

**Slice:** A — Scene Foundation

**Files:**
- Create: `src/scene/SceneStage.tsx`
- Create: `src/scene/CharacterActor.tsx`
- Create: `src/scene/InteractiveObject.tsx`
- Create: `src/scene/scene.css`
- Create: `src/scene/scene-stage.test.tsx`
- Modify: `src/runa-presentation.ts`

**Interfaces:**
- `SceneStage({scene,runtime,onInteraction})` renders background layers, actor anchors, interactive objects, and presentation overlay.
- `CharacterActor({actor,reducedMotion})` renders semantic anchor/facing/motion classes and pose fallback.
- `InteractiveObject` always exposes an accessible button semantics/hit area even when the visible prop is small.

- [ ] **Step 1: Write static-markup/CSS RED tests**

```tsx
import {readFileSync} from 'node:fs';
import {renderToStaticMarkup} from 'react-dom/server';
import {expect,it,vi} from 'vitest';
import {SceneStage} from './SceneStage';

const css=readFileSync(new URL('./scene.css',import.meta.url),'utf8');

it('renders actors and semantic interaction buttons',()=>{
  const html=renderToStaticMarkup(<SceneStage scene={fixtureScene} runtime={fixtureRuntime} onInteraction={vi.fn()}/>);
  expect(html).toContain('v14-scene-stage');
  expect(html).toContain('data-anchor="desk"');
  expect(html).toContain('aria-label="책상"');
});

it('contains mobile hit-area, safe-area, focus and reduced-motion rules',()=>{
  expect(css).toContain('min-width:44px');
  expect(css).toContain('min-height:44px');
  expect(css).toContain('env(safe-area-inset-bottom)');
  expect(css).toContain(':focus-visible');
  expect(css).toContain('@media(prefers-reduced-motion:reduce)');
});
```

- [ ] **Step 2: Run and verify RED**

Run: `npx vitest run src/scene/scene-stage.test.tsx`

Expected: FAIL because the components/CSS do not exist.

- [ ] **Step 3: Implement the minimal stage and actor**

Use CSS variables such as `--anchor-x`, `--anchor-y`, and semantic `data-anchor`; positions come from registry percentages, never durable pixel coordinates. Extend Runa pose selection to cover `happy`, `worried`, and `sit` with asset fallback to current poses when dedicated images are absent.

- [ ] **Step 4: Implement interaction affordance/hint policy**

Default props do not pulse continuously. `InteractiveObject` adds `is-hinted` only for mandatory/new/idle-accessibility hints supplied by resolved scene metadata.

- [ ] **Step 5: Run targeted tests and commit**

Run: `npx vitest run src/scene/scene-stage.test.tsx src/v13-story-dialogue-stage.test.tsx`

Expected: PASS.

Commit:

```bash
git add src/scene/SceneStage.tsx src/scene/CharacterActor.tsx src/scene/InteractiveObject.tsx src/scene/scene.css src/scene/scene-stage.test.tsx src/runa-presentation.ts
git commit -m "feat(v14): render anchored living scenes"
```

---

### Task 6: Semantic activity checkpoints and hydration-safe recovery

**Slice:** A/F shared persistence foundation

**Files:**
- Create: `src/scene/activity-checkpoint.ts`
- Create: `src/scene/activity-checkpoint.test.ts`
- Modify: the smallest existing persistent V3 state module that owns durable cross-screen state; prefer `src/v3-persistent-state.ts` if inspection confirms it is the canonical persisted extension point, otherwise use the existing save-state owner discovered before editing.
- Modify: `src/game.ts` only to thread the sanitized checkpoint field if the selected persistent module requires it.

**Interfaces:**
- Produces: discriminated `ActivityCheckpoint` union exactly matching approved phases.
- Produces: `sanitizeActivityCheckpoint(raw:unknown):ActivityCheckpoint|null`.
- Produces: `resolveSafeResume(checkpoint,state):SceneRequest`.

- [ ] **Step 1: Write sanitization RED tests**

```ts
import {expect,it} from 'vitest';
import {sanitizeActivityCheckpoint} from './activity-checkpoint';

it('accepts canonical Story phases and rejects arbitrary phases',()=>{
  expect(sanitizeActivityCheckpoint({activity:'story',activityId:'lost_bird',phase:'choice',committedKey:null})).toEqual({
    activity:'story',activityId:'lost_bird',phase:'choice',committedKey:null,
  });
  expect(sanitizeActivityCheckpoint({activity:'story',activityId:'lost_bird',phase:'frame-27'})).toBeNull();
});

it('rejects non-finite or missing semantic expedition nodes',()=>{
  expect(sanitizeActivityCheckpoint({activity:'expedition',activityId:'spring',phase:'node',semanticNodeId:'',committedKey:null})).toBeNull();
});
```

- [ ] **Step 2: Run and verify RED**

Run: `npx vitest run src/scene/activity-checkpoint.test.ts`

Expected: FAIL until checkpoint module exists.

- [ ] **Step 3: Implement sanitization and safe defaults**

Unknown activity/phase -> `null`; malformed checkpoint never crashes hydration. A `post_choice`, `post_commit`, `post_encounter`, or `post_reward` checkpoint may only resume post-commit presentation if canonical state also proves the commit occurred; otherwise fall back to the safest pre-commit semantic boundary.

- [ ] **Step 4: Thread checkpoint through existing persistence defensively**

Add one optional/sanitized persisted field; never persist actor coordinates, pose tween, animation frame, camera, particle, or highlight state.

- [ ] **Step 5: Add game hydration regression**

Create a test using `hydrateGameState` proving malformed checkpoint input recovers to `null` while all existing state still hydrates.

- [ ] **Step 6: Run persistence tests and commit**

Run: `npx vitest run src/scene/activity-checkpoint.test.ts src/*save*.test.ts src/*persistence*.test.ts`

If shell glob expansion differs, run the concrete existing save/persistence test files discovered in the repo before editing.

Commit:

```bash
git add src/scene/activity-checkpoint.ts src/scene/activity-checkpoint.test.ts src/v3-persistent-state.ts src/game.ts
git commit -m "feat(v14): persist semantic scene checkpoints"
```

Only add files actually modified; if persistence ownership differs, stage that canonical file instead of `src/v3-persistent-state.ts`.

---

### Task 7: Living Home scene and world-map shell

**Slice:** B — Living Home + Navigation

**Files:**
- Create: `src/scene/WorldMapScene.tsx`
- Create: `src/scene/world-map.test.tsx`
- Create: `src/v14-living-home.test.tsx`
- Modify: `src/LayeredHome.tsx`
- Modify: existing home CSS file(s) used by `LayeredHome`

**Interfaces:**
- Home resolves `location:'home'` through `resolveScene` and renders it through `SceneDirector`/`SceneStage`.
- Existing quick navigation remains functional as a secondary path.
- `WorldMapScene` consumes resolved unlocks and emits canonical `LocationId` selections; it does not commit rewards.

- [ ] **Step 1: Write Home/world-map RED tests**

```tsx
import {renderToStaticMarkup} from 'react-dom/server';
import {expect,it,vi} from 'vitest';
import LayeredHome from './LayeredHome';
import {initialState} from './game';

it('renders the living home scene while retaining quick navigation',()=>{
  const html=renderToStaticMarkup(<LayeredHome
    state={initialState}
    onSchedule={vi.fn()} onClaimAchievement={vi.fn()} onOuting={vi.fn()} onGift={vi.fn()}
    onAttendance={vi.fn()} onMail={vi.fn()} onMonthlyFocus={vi.fn()}
  />);
  expect(html).toContain('v14-scene-stage');
  expect(html).toContain('data-object-id="bed"');
  expect(html).toContain('data-object-id="door"');
  expect(html).toContain('스케줄');
  expect(html).toContain('가방');
});
```

- [ ] **Step 2: Run and verify RED**

Run: `npx vitest run src/v14-living-home.test.tsx src/scene/world-map.test.tsx`

Expected: FAIL until Home consumes the Scene layer.

- [ ] **Step 3: Integrate Home without moving scene logic into `LayeredHome.tsx`**

`LayeredHome` should resolve/render Home and adapt existing callbacks (`onSchedule`, bag/menu, outing, bond) into scene commands. Keep existing panels and quick menu callable; scene-object clicks become the preferred path.

- [ ] **Step 4: Add state-reactive Runa presentation**

At minimum `state.condition==='tired'` resolves a tired/rest-biased pose/anchor; normal/energetic/focused use non-tired presentation. Autonomous behavior is presentation-only and lower priority than directed interactions.

- [ ] **Step 5: Add world-map shell**

World map visually exposes approved locations and uses locked/unlocked presentation. Unavailable destinations must be non-activating, accessible, and represented as world-map state rather than a generic alert button.

- [ ] **Step 6: Run Home + V13 overlap regressions and commit**

Run: `npx vitest run src/v14-living-home.test.tsx src/scene/world-map.test.tsx src/v13-home-character-safe-zone.test.ts src/v13-tactical-no-overlap.test.ts`

Expected: PASS.

Commit:

```bash
git add src/scene/WorldMapScene.tsx src/scene/world-map.test.tsx src/v14-living-home.test.tsx src/LayeredHome.tsx src/*.css
git commit -m "feat(v14): turn home into a living scene"
```

Stage only the CSS files actually changed.

---

### Task 8: Raising Adapter and three Training scenes

**Slice:** C — Training Scenes

**Files:**
- Create: `src/scene/adapters/raising-adapter.ts`
- Create: `src/scene/adapters/raising-adapter.test.ts`
- Create: `src/scene/training-scenes.ts`
- Create: `src/v14-training-scenes.test.tsx`
- Modify: existing schedule/training entry component discovered from the current `onSchedule` flow.
- Modify: `src/scene/scene-registry.ts`

**Interfaces:**
- Produces: `commitTrainingScene(command,state,dispatch):TrainingPresentationResult` or equivalent thin wrapper around the existing canonical training action.
- Training locations: `training_ground`, `magic_classroom`, `herb_garden`.
- V14 minigame result shape may contain only presentation fields such as `{feedback:'clean'|'close'|'miss',effectIntensity:number}`.

- [ ] **Step 1: Write adapter authority RED test**

Test with a spy dispatch that a scene training command emits the same existing canonical training action used by the current schedule flow, and that the adapter return type contains no `stats`, `gold`, `mastery`, or reward mutation field.

```ts
expect(dispatch).toHaveBeenCalledWith(existingExpectedTrainingAction);
expect(result).not.toHaveProperty('stats');
expect(result).not.toHaveProperty('gold');
```

- [ ] **Step 2: Run and verify RED**

Run: `npx vitest run src/scene/adapters/raising-adapter.test.ts`

Expected: FAIL because adapter is missing.

- [ ] **Step 3: Implement thin adapter after inspecting the current canonical training action**

Do not invent a new stat-calculation path. Convert scene object IDs to the existing Activity/Training IDs only, validate availability, dispatch once, and derive presentation from the newly committed `lastGrowthReport`/state.

- [ ] **Step 4: Add the three training scene definitions**

Required interaction IDs:
- Training Ground: `training_dummy`, `weapon_rack`, `instructor`, `exit`.
- Magic Classroom: `magic_circle`, `books`, `practice_target`, `instructor`, `exit`.
- Herb Garden: `herb_patch`, `pots`, `workbench`, `ingredient_rack`, `exit`.

- [ ] **Step 5: Add one bounded presentation-only minigame**

Use Magic Classroom timing as the first implementation. The minigame stores only ephemeral timing feedback; all three feedback bands dispatch the same canonical training action. Static/pure tests must prove canonical dispatch is identical for `clean`, `close`, and `miss`.

- [ ] **Step 6: Add committed-result presentation test**

Render a post-training scene from a state with `lastGrowthReport`; assert the displayed grade/improvement comes from the committed report, not the minigame feedback.

- [ ] **Step 7: Run Training relevant suite and commit**

Run: `npx vitest run src/scene/adapters/raising-adapter.test.ts src/v14-training-scenes.test.tsx src/*raising*.test.ts src/*training*.test.ts`

Commit:

```bash
git add src/scene/adapters/raising-adapter.ts src/scene/adapters/raising-adapter.test.ts src/scene/training-scenes.ts src/v14-training-scenes.test.tsx src/scene/scene-registry.ts <existing-training-entry-files>
git commit -m "feat(v14): stage training as playable scenes"
```

---

### Task 9: Outing Adapter and Forest/Village/Lakeside scenes

**Slice:** D — Outing Scenes

**Files:**
- Create: `src/scene/adapters/outing-adapter.ts`
- Create: `src/scene/adapters/outing-adapter.test.ts`
- Create: `src/scene/outing-scenes.ts`
- Create: `src/v14-outing-scenes.test.tsx`
- Modify: `src/scene/scene-registry.ts`
- Modify: `src/LayeredHome.tsx` only for routing from existing Outing quick path into world-map/scene flow.
- Reuse without rewriting: `src/adventure.ts`

**Interfaces:**
- Maps `forest`, `village`, `lakeside` scene interactions to the existing `OutingLocationId` and exploration result APIs.
- Canonical events/discoveries continue to come from `pickExplorationOutcome` and existing effects/records.

- [ ] **Step 1: Write adapter reuse RED tests**

For a fixed roll/state, prove the adapter returns the same event/discovery as direct `pickExplorationOutcome` for each Outing location.

```ts
const expected=pickExplorationOutcome('forest',0,[],0.1);
const actual=resolveOutingInteraction({location:'forest',xp:0,discoveries:[],roll:0.1});
expect(actual.outcome).toEqual(expected);
```

- [ ] **Step 2: Run and verify RED**

Run: `npx vitest run src/scene/adapters/outing-adapter.test.ts`

Expected: FAIL until adapter exists.

- [ ] **Step 3: Implement Outing adapter with no duplicate reward logic**

The adapter may call existing selection/effect helpers and canonical dispatch paths but must not duplicate stat/reward constants already defined in `adventure.ts`.

- [ ] **Step 4: Define visible scene objects**

Forest exposes trace/tree/herb/path interactions; Village exposes square/shop/performance/repair/alley; Lakeside exposes water/fish/rest/wind-crystal. Each resolves an approach anchor and one standardized interaction mode.

- [ ] **Step 5: Add season/time/weather and companion-reaction integration**

Test that same week/location gives stable weather; changing month across the fixed season boundary changes the season layer; companion role/Bond may add a hint/reaction but cannot remove base progression interactions.

- [ ] **Step 6: Add player-facing static markup test**

Ensure the Forest scene renders a visible clickable trace and Runa/companion staging rather than only a result button/list.

- [ ] **Step 7: Run Outing/adventure regressions and commit**

Run: `npx vitest run src/scene/adapters/outing-adapter.test.ts src/v14-outing-scenes.test.tsx src/*adventure*.test.ts src/*outing*.test.ts`

Commit:

```bash
git add src/scene/adapters/outing-adapter.ts src/scene/adapters/outing-adapter.test.ts src/scene/outing-scenes.ts src/v14-outing-scenes.test.tsx src/scene/scene-registry.ts src/LayeredHome.tsx
git commit -m "feat(v14): make outings scene driven"
```

---

### Task 10: Story Adapter and choreography migration

**Slice:** E — Story Choreography

**Files:**
- Create: `src/scene/adapters/story-adapter.ts`
- Create: `src/scene/adapters/story-adapter.test.ts`
- Create: `src/scene/story-scenes.ts`
- Create: `src/v14-story-scenes.test.tsx`
- Modify: `src/components/StoryEvent.tsx`
- Modify or retire presentation-only rules in `src/story-dialogue-stage.css` only after new `scene.css` covers them.
- Reuse: `src/game/events.ts`

**Interfaces:**
- `commitStoryChoice(eventId,choiceId,dispatch)` validates against existing `STORY_EVENTS` and dispatches exactly one canonical `EVENT_CHOICE`.
- `storySceneFor(eventId)` returns scene metadata/beats; it does not duplicate stat/personality effects.

- [ ] **Step 1: Write canonical dispatch RED tests**

```ts
const dispatch=vi.fn();
commitStoryChoice('lost_bird','help',dispatch);
expect(dispatch).toHaveBeenCalledTimes(1);
expect(dispatch).toHaveBeenCalledWith({type:'EVENT_CHOICE',eventId:'lost_bird',choiceId:'help'});
```

Use the actual canonical `choiceId` read from `STORY_EVENTS`; do not guess it during implementation.

- [ ] **Step 2: Run and verify RED**

Run: `npx vitest run src/scene/adapters/story-adapter.test.ts`

Expected: FAIL until adapter exists.

- [ ] **Step 3: Implement adapter validation against `STORY_EVENTS`**

Unknown event/choice returns a rejected result and never dispatches.

- [ ] **Step 4: Convert all current Story events to scene metadata**

Every event in `STORY_EVENTS` must have a corresponding scene definition with at least location/time, Runa + guest staging, dialogue beats, and canonical choice handoff. Use the existing guest mapping from `StoryEvent.tsx` as the initial cast source, then move that presentation metadata into `story-scenes.ts`.

- [ ] **Step 5: Replace the fixed speaker-toggle shell**

`StoryEvent.tsx` becomes a thin Scene consumer: find active event -> resolve `storySceneFor` -> render Scene Director -> route choice through Story Adapter -> show post-choice scene from committed state.

- [ ] **Step 6: Add reload/idempotence tests**

Cover:
1. uncommitted `choice` checkpoint can show choice;
2. canonical event history/state proving commit means reload cannot expose the choice as claimable again;
3. post-choice presentation cannot dispatch `EVENT_CHOICE` again.

- [ ] **Step 7: Run Story suites and commit**

Run: `npx vitest run src/scene/adapters/story-adapter.test.ts src/v14-story-scenes.test.tsx src/v13-story-dialogue-stage.test.tsx src/*story*.test.ts src/*event*.test.ts`

Commit:

```bash
git add src/scene/adapters/story-adapter.ts src/scene/adapters/story-adapter.test.ts src/scene/story-scenes.ts src/v14-story-scenes.test.tsx src/components/StoryEvent.tsx src/story-dialogue-stage.css
git commit -m "feat(v14): choreograph story events as scenes"
```

Stage `story-dialogue-stage.css` only if actually changed.

---

### Task 11: Expedition semantic nodes and Tactical handoff/return

**Slice:** F — Expedition/Tactical Bridge

**Files:**
- Create: `src/scene/adapters/expedition-adapter.ts`
- Create: `src/scene/adapters/expedition-adapter.test.ts`
- Create: `src/scene/adapters/tactical-adapter.ts`
- Create: `src/scene/adapters/tactical-adapter.test.ts`
- Create: `src/scene/expedition-scenes.ts`
- Create: `src/v14-expedition-tactical.test.ts`
- Modify: current Expedition entry/flow component discovered before editing.
- Modify: Tactical navigation return callback only at the existing screen-transition boundary; do not alter `src/tactical-battle.ts` combat calculations.

**Interfaces:**
- Semantic node IDs cover at least `camp`, `path`, `crossroads`, `ruin`, `rift`, `treasure`, `encounter`, `return`.
- Tactical adapter creates a handoff presentation request and consumes already-committed `COMPLETE_TACTICAL_BATTLE` state to choose the post-encounter node.

- [ ] **Step 1: Write Expedition node/checkpoint RED tests**

```ts
it('resumes after a committed encounter instead of before it',()=>{
  const request=resolveExpeditionResume({
    checkpoint:{activity:'expedition',activityId:'exp-1',phase:'post_encounter',semanticNodeId:'encounter-1',committedKey:'battle:encounter-1'},
    committedBattleKeys:new Set(['battle:encounter-1']),
  });
  expect(request.semanticNodeId).toBe('post-encounter-1');
});
```

- [ ] **Step 2: Run and verify RED**

Run: `npx vitest run src/scene/adapters/expedition-adapter.test.ts src/scene/adapters/tactical-adapter.test.ts`

Expected: FAIL until adapters exist.

- [ ] **Step 3: Implement semantic Expedition routing**

Do not store scene coordinates. Persist only semantic node/checkpoint data through the checkpoint module.

- [ ] **Step 4: Implement Tactical handoff as navigation, not battle logic**

The Scene layer selects an existing encounter and opens the current Tactical engine. Battle completion continues through the existing `COMPLETE_TACTICAL_BATTLE` action with rounds/survivors/damage/companions. Post-battle scene resolution reads canonical battle record/reward/Bond state.

- [ ] **Step 5: Add duplicate-completion tests**

Rapid repeated return/interaction after battle must not grant a second first-clear/reward. Assert canonical state stays equal after a duplicate semantic completion attempt.

- [ ] **Step 6: Add full bridge integration test**

Test the flow as pure state/adapter steps: Expedition encounter request -> Tactical handoff -> one canonical completion action -> post-battle checkpoint -> resolved Expedition scene. Do not mock a second battle engine.

- [ ] **Step 7: Run Tactical/Expedition suites and commit**

Run: `npx vitest run src/scene/adapters/expedition-adapter.test.ts src/scene/adapters/tactical-adapter.test.ts src/v14-expedition-tactical.test.ts src/*tactical*.test.ts src/*expedition*.test.ts`

Commit:

```bash
git add src/scene/adapters/expedition-adapter.ts src/scene/adapters/expedition-adapter.test.ts src/scene/adapters/tactical-adapter.ts src/scene/adapters/tactical-adapter.test.ts src/scene/expedition-scenes.ts src/v14-expedition-tactical.test.ts <existing-expedition-navigation-files>
git commit -m "feat(v14): bridge expedition scenes to tactical"
```

---

### Task 12: World Fact consequences, NG+ echoes, Personality/Bond presentation

**Slice:** G — World Consequences and Character Polish

**Files:**
- Create: `src/scene/scene-consequences.ts`
- Create: `src/scene/scene-consequences.test.ts`
- Modify: `src/scene/scene-resolver.ts`
- Modify: `src/scene/scene-registry.ts`
- Modify: `src/scene/CharacterActor.tsx`

**Interfaces:**
- Produces: `resolveSceneConsequences(state,location):SceneConsequence[]`.
- Current-run World Facts and inherited NG+ echoes remain distinguishable in output metadata (`source:'current'|'echo'`).

- [ ] **Step 1: Write World Fact RED tests**

Use the actual canonical World Fact IDs found in the existing registry. At minimum cover representative equivalents of:
- opened ancient route -> path prop + interaction in Forest;
- saved/recovered festival -> Village decoration/NPC/interaction;
- heavy-loss/damaged state -> alternate Village or region overlay.

Assert current facts produce `source:'current'`.

- [ ] **Step 2: Run and verify RED**

Run: `npx vitest run src/scene/scene-consequences.test.ts`

Expected: FAIL until consequence resolver exists.

- [ ] **Step 3: Implement consequences as presentation/availability overlays**

Do not mutate World Facts. Return props, overlays, and optional interactions consumed by `scene-resolver`.

- [ ] **Step 4: Add NG+ echo distinction test**

An inherited echo may add a visual trace or optional dialogue interaction but must not satisfy a current-run fact condition that unlocks canonical progression unless the existing domain logic already does so.

- [ ] **Step 5: Add Personality/Bond actor reactions**

Test at least:
- high courage -> direct/forward presentation token;
- high calmness -> observe/pause token;
- high curiosity -> excited/quick-inspect token;
- higher companion Bond -> closer/proactive presentation token.

These tokens change choreography only and do not write stats/Bond.

- [ ] **Step 6: Run consequence/NG+ regressions and commit**

Run: `npx vitest run src/scene/scene-consequences.test.ts src/*world*.test.ts src/*ngplus*.test.ts src/*bond*.test.ts`

Commit:

```bash
git add src/scene/scene-consequences.ts src/scene/scene-consequences.test.ts src/scene/scene-resolver.ts src/scene/scene-registry.ts src/scene/CharacterActor.tsx
git commit -m "feat(v14): reflect world choices in living scenes"
```

---

### Task 13: Mobile, reduced-motion, overlap, performance, and fallback regression gate

**Slice:** G — Polish

**Files:**
- Create: `src/v14-scene-mobile-accessibility.test.ts`
- Create: `src/v14-scene-fallback-regression.test.ts`
- Modify: `src/scene/scene.css`
- Modify: scene React components only where tests expose a concrete accessibility/overlap issue.

**Interfaces:**
- No new gameplay interface; this task hardens the shared Scene layer.

- [ ] **Step 1: Write CSS/source RED tests for required constraints**

```ts
const css=readFileSync(new URL('./scene/scene.css',import.meta.url),'utf8');
expect(css).toContain('@media(max-width:430px)');
expect(css).toContain('@media(max-height:640px)');
expect(css).toContain('env(safe-area-inset-bottom)');
expect(css).toContain('@media(prefers-reduced-motion:reduce)');
expect(css).toContain('min-width:44px');
expect(css).toContain('min-height:44px');
```

Also static-render representative Home, Story, and Expedition scenes and assert critical quick-menu and interaction labels coexist in markup.

- [ ] **Step 2: Run and verify RED for any missing rule**

Run: `npx vitest run src/v14-scene-mobile-accessibility.test.ts src/v14-scene-fallback-regression.test.ts`

Expected: at least one failure before final polish unless all foundation tasks already satisfy every assertion.

- [ ] **Step 3: Implement only the missing responsive/accessibility rules**

Required behavior:
- interaction targets >=44px;
- quick menu anchored outside critical actor interaction lane;
- Korean dialogue/labels wrap and scroll rather than cover choices;
- short phones reduce decorative vertical space;
- `:focus-visible` has a visible outline;
- reduced motion snaps/transitions actors without changing runtime semantic phase/order.

- [ ] **Step 4: Add asset-failure and unknown-location render tests**

Render a scene with missing optional asset tokens and an unknown location request; assert no throw and Home/generic fallback is visible/usable.

- [ ] **Step 5: Add resolver memoization-readiness test**

Call `resolveScene` twice with equal meaningful inputs and assert deep-equal output. Ensure it has no render-time randomness/clock dependency. Do not add premature global caching; keep the selector deterministic so React callers may memoize safely.

- [ ] **Step 6: Run targeted V14 + V13 UI regressions and commit**

Run:

```bash
npx vitest run src/scene src/v14-*.test.ts src/v14-*.test.tsx src/v13-home-character-safe-zone.test.ts src/v13-story-dialogue-stage.test.tsx src/v13-tactical-no-overlap.test.ts
```

Commit:

```bash
git add src/v14-scene-mobile-accessibility.test.ts src/v14-scene-fallback-regression.test.ts src/scene/scene.css src/scene/*.tsx
git commit -m "test(v14): harden scene mobile accessibility"
```

Stage only scene components actually modified.

---

### Task 14: End-to-end V14 invariants, full regression, build, PR, integration, main, production verification

**Slice:** Final Gate

**Files:**
- Create: `src/v14-living-world-invariants.test.ts`
- Modify: none unless the final tests reveal a concrete bug; bug fixes receive their own focused RED/GREEN commit before promotion.

**Interfaces:**
- This task verifies the complete architecture and release workflow; it does not add a second implementation path.

- [ ] **Step 1: Write final invariant tests**

Cover these cross-system invariants directly:

```ts
it('Scene definitions contain no direct durable reward mutation fields',()=>{
  for(const scene of Object.values(SCENE_LOCATIONS)){
    expect(JSON.stringify(scene)).not.toMatch(/"(gold|gems|stats|mastery|bondGain|rewardItem)"\s*:/i);
  }
});

it('the same canonical week resolves stable weather',()=>{
  expect(weatherForWeek(3,7,2)).toBe(weatherForWeek(3,7,2));
});

it('reduced-motion is presentation-only',()=>{
  const normal=resolveScene(initialState,{location:'forest',activity:'outing',reducedMotion:false});
  const reduced=resolveScene(initialState,{location:'forest',activity:'outing',reducedMotion:true});
  expect(reduced.interactions.map(x=>x.id)).toEqual(normal.interactions.map(x=>x.id));
});
```

Add integration coverage for the five required playable flows from the spec: Home->Training->Home, Home->Map->Forest->return, Story choice/reload, Expedition->Tactical->post-battle, malformed checkpoint recovery.

- [ ] **Step 2: Run V14 targeted suite**

Run:

```bash
npx vitest run src/scene src/v14-*.test.ts src/v14-*.test.tsx
```

Expected: all GREEN.

- [ ] **Step 3: Run relevant feature suites**

Run concrete Raising, adventure/outing, Story/event, Expedition, Tactical, Bond, World Fact, NG+, save/hydration, and Home/UI test files discovered in the repository. Do not omit a suite because a glob matched zero files.

Expected: all GREEN.

- [ ] **Step 4: Run full regression**

Run: `npx vitest run`

Expected: 100% pass; record exact test-file and test counts in the PR.

- [ ] **Step 5: Run typecheck and production build separately**

Run:

```bash
npx tsc -b
npx vite build
```

Expected: both exit 0.

- [ ] **Step 6: Commit the final invariant test**

```bash
git add src/v14-living-world-invariants.test.ts
git commit -m "test(v14): lock living world invariants"
```

- [ ] **Step 7: Push the exact implementation head and open the V14 PR to `integration/v3`**

PR body must include:
- approved design/spec path;
- plan path;
- exact head SHA;
- slice summary A-G;
- targeted/full test counts;
- `tsc -b` result;
- Vite build result;
- explicit statement that Tactical/domain reward logic was not replaced.

- [ ] **Step 8: Verify PR CI/review at the exact head**

Do not merge while CI, review thread, or preview reports a blocker. Fix the smallest concrete issue with a focused failing regression test, rerun targeted/full/typecheck/build, push, and re-check the new exact head.

- [ ] **Step 9: Merge exact GREEN head to `integration/v3` without force**

After merge, verify remote `integration/v3` SHA, rerun targeted V14 suite, full test, `tsc -b`, and `vite build` on that exact integration composition.

- [ ] **Step 10: Open/verify release PR from exact `integration/v3` to `main`**

Require release CI GREEN at the exact integration head before merge. Merge without force and verify remote `main` SHA equals the merged release head/commit relationship expected by repository policy.

- [ ] **Step 11: Production verification**

For exact `main` SHA verify:
- production deployment is READY;
- production alias `https://puppy-maker-six.vercel.app/` returns HTTP 200;
- runtime/fatal error check reports none;
- verify at least Home scene loads and an interaction/quick-menu path is usable in production.

V14 is not complete until code, integration, main, and production evidence all refer to the correct exact SHAs.

---

## Execution Order and Review Gates

Execute Tasks 1-6 as **Slice A foundation**, then Tasks 7-13 in order. After each numbered Task, stop for the task-level review required by the selected execution skill; do not batch unrelated fixes into the same commit. Task 14 is the release gate only after all implementation Tasks are GREEN.

The intended PR-sized product slices are:

1. **A:** Tasks 1-6 — foundation + persistence primitives.
2. **B:** Task 7 — Living Home + world map.
3. **C:** Task 8 — Training.
4. **D:** Task 9 — Outing.
5. **E:** Task 10 — Story.
6. **F:** Task 11 — Expedition/Tactical bridge.
7. **G:** Tasks 12-13 — world consequences + polish.
8. **Final Gate:** Task 14.

If the repository workflow prefers one long V14 branch/PR, keep the same task commits and review gates on that branch; do not collapse task boundaries or bypass intermediate regression runs.
