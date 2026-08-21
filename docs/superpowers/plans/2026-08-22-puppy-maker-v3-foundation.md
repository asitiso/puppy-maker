# Puppy Maker V3 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the V3 persistent-state and save foundation—typed campaign contracts, World History, Character Bonds, Legacy, safe V2→V3 migration, and an inert NEW_RUN boundary—without changing current V2 gameplay behavior.

**Architecture:** Add four nested persistent slices (`campaignRun`, `worldHistory`, `characterBonds`, `legacy`) behind `v3-persistent-state.ts`, with shared sanitation helpers in `v3-state-sanitize.ts`. `src/game.ts` only mounts, hydrates, and preserves these slices. The app-facing resilient save envelope in `src/save-schema.ts` moves from schema 2 to 3 while preserving the existing integrity algorithm and backup rotation; incoming schema-v2 envelopes must pass their old integrity check before migration.

**Tech Stack:** React 19, TypeScript strict mode, Vite, Vitest, Node 22 CI, existing localStorage/resilient-save infrastructure only.

**Spec:** `docs/superpowers/specs/2026-08-22-puppy-maker-v3-master-design.md`

## Global Constraints

- Authoritative V2 code baseline: `integration/v2@edd0ca99537ed92c7993969166b80c269f3aced8`.
- Approved design/plan history lives on `design/v3-master-spec`.
- After this plan is approved, Room 06 creates `integration/v3` from the approved documentation head, then creates `work/v3-foundation` from `integration/v3` for implementation. A Draft PR targets `integration/v3`; only Room 06 integrates the verified head.
- `integration/v2`, `main`, and production remain untouched.
- Rooms 01–05 do not start V3 implementation until the Foundation Gate is GREEN on `integration/v3`.
- Preserve `hub -> schedule -> training -> dialogue -> result -> next month -> hub` exactly.
- Foundation contains no affinity scoring, Path Convergence, campaign story effects, Tactical modifiers, Seasonal objectives, True/Hollow unlocking, ending composition, reward application, or active NG+ transition.
- Existing `BondScene` remains the Runa/player relationship system. New NPC bonds exist only in `characterBonds`.
- Existing Raising, World, Season, Tactical, Sanctuary, Astral, Celestial, and Rift engines remain authoritative and receive no campaign branching logic in this wave.
- No new dependencies, state framework, event bus, UI, CSS, `App.tsx`, `Root.tsx`, `LayeredHome.tsx`, `main.tsx`, or `vercel.json` changes.
- App-facing save key remains `puppy-maker-save`; three-generation backup rotation remains unchanged.
- `src/game/save.ts` and `src/game/world-save.ts` are separate compatibility serializers. Their current versions stay `3` and `7` respectively; they inherit new fields through `hydrateGameState`.
- All persisted numeric values reject NaN/Infinity and invalid negatives. Registered ID collections remove stale IDs and duplicates during hydration.
- Hydration is idempotent: `hydrate -> serialize -> hydrate` returns the same canonical state.
- A V2 save with existing top-level `endingCollection` seeds `legacy.endingCollection` when no V3 `legacy` object exists. No existing ending history is silently discarded.
- TDD for every code task: RED test, targeted RED command, minimal implementation, targeted GREEN, typecheck, focused commit.

## File Structure

### New production files

- `src/v3-state-sanitize.ts` — shared record/number/string/registry sanitation primitives.
- `src/campaign-model.ts` — stable V3 identifiers and registries; no gameplay rules.
- `src/campaign-state.ts` — `CampaignRunState`, defaults, hydration.
- `src/world-history.ts` — typed current/inherited World Facts.
- `src/character-bonds.ts` — eight NPC Character Bond containers and ID registries.
- `src/legacy-state.ts` — compact Legacy and RunSummary contracts.
- `src/v3-persistent-state.ts` — composition/hydration and unused future NEW_RUN boundary helper.

### New tests

- `src/campaign-state.test.ts`
- `src/world-history.test.ts`
- `src/character-bonds.test.ts`
- `src/legacy-state.test.ts`
- `src/v3-persistent-state.test.ts`
- `src/game-v3-foundation.test.ts`

### Modified files

- `src/game.ts`
- `src/save-schema.ts`
- `src/save-schema.test.ts`
- `src/save-resilience.ts`
- `src/save-resilience.test.ts`
- `src/game/save.test.ts`
- `src/game/world-save.test.ts`

---

### Task 1: Shared Sanitizers, Stable IDs, and CampaignRunState

**Files:**
- Create: `src/v3-state-sanitize.ts`
- Create: `src/campaign-model.ts`
- Create: `src/campaign-state.ts`
- Test: `src/campaign-state.test.ts`

**Interfaces:**
- `isV3Record(value): value is Record<string,unknown>`
- `safeNonNegativeInt(value,fallback=0): number`
- `safePositiveInt(value,fallback=1): number`
- `uniqueRegistered<T extends string>(raw, ids): T[]`
- `safeOptionalString(value): string|null`
- `CampaignId = 'caretaker'|'pathfinder'|'vanguard'|'arcanist'|'true_path'`
- `MainCampaignId = Exclude<CampaignId,'true_path'>`
- `CampaignPhase = 'spring_exploration'|'path_selection'|'summer'|'autumn'|'winter'|'ending'`
- `CampaignRoute = 'normal'|'hollow'`
- `CharacterId = 'mira'|'kael'|'rex'|'selene'|'noa'|'eiden'|'lyra'|'veyr'`
- `MajorEventId = 'guardian_festival'|'great_expedition'|'long_night'`
- `MajorOutcomeResult = 'exceptional_victory'|'victory'|'costly_victory'|'defeat'`
- `MajorChoiceId = 'caretaker_autumn'|'pathfinder_autumn'|'vanguard_autumn'|'arcanist_autumn'`
- `CampaignMilestoneId = 'path_convergence'|'summer_resolved'|'autumn_resolved'|'winter_resolved'|'ending_committed'`
- `DangerBehaviorId = 'sacrificed_ally_for_victory'|'used_forbidden_relic'|'exploited_bond'|'ignored_civilians'|'accepted_veyr_power'`
- `emptyCampaignRunState(): CampaignRunState`
- `hydrateCampaignRunState(raw): CampaignRunState`

Canonical state:

```ts
export type CampaignRunState = {
  runNumber:number;
  phase:CampaignPhase;
  activeCampaign:CampaignId|null;
  activeRoute:CampaignRoute;
  campaignAffinities:Record<MainCampaignId,number>;
  dangerState:{score:number;behaviors:DangerBehaviorId[]};
  seasonMilestones:CampaignMilestoneId[];
  majorChoices:Partial<Record<MajorChoiceId,MajorChoiceOptionId>>;
  majorOutcomes:Partial<Record<MajorEventId,MajorOutcomeResult>>;
  failForwardOutcomes:MajorEventId[];
  claimedCampaignRewards:CampaignMilestoneId[];
};
```

Major Choice options are fixed per choice:

```ts
export const majorChoiceOptions = {
  caretaker_autumn:['save_one','spread_risk','team_solution'],
  pathfinder_autumn:['open_route','seal_route','limited_access'],
  vanguard_autumn:['centralize','preserve_independence','coalition_command'],
  arcanist_autumn:['use_relic','destroy_relic','controlled_use'],
} as const;
export type MajorChoiceId=keyof typeof majorChoiceOptions;
export type MajorChoiceOptionId=typeof majorChoiceOptions[MajorChoiceId][number];
```

- [ ] **Step 1: Write the failing sanitizer/default/malformed test.**

```ts
import {describe,expect,it} from 'vitest';
import {emptyCampaignRunState,hydrateCampaignRunState} from './campaign-state';

describe('V3 campaign run hydration',()=>{
  it('starts as an inert first-run Spring state',()=>{
    expect(emptyCampaignRunState()).toMatchObject({
      runNumber:1,phase:'spring_exploration',activeCampaign:null,activeRoute:'normal',
      campaignAffinities:{caretaker:0,pathfinder:0,vanguard:0,arcanist:0},
      dangerState:{score:0,behaviors:[]},
    });
  });

  it('canonicalizes malformed campaign state',()=>{
    const state=hydrateCampaignRunState({
      runNumber:-4,phase:'spring_99',activeCampaign:'stale_path',activeRoute:'forced',
      campaignAffinities:{caretaker:12.8,pathfinder:Infinity,vanguard:-2,arcanist:NaN},
      dangerState:{score:Infinity,behaviors:['used_forbidden_relic','used_forbidden_relic','stale']},
      seasonMilestones:['path_convergence','path_convergence','stale'],
      majorChoices:{pathfinder_autumn:'centralize'},
      majorOutcomes:{guardian_festival:'defeat',unknown_event:'victory'},
      failForwardOutcomes:['guardian_festival','guardian_festival','unknown_event'],
    });
    expect(state.runNumber).toBe(1);
    expect(state.phase).toBe('spring_exploration');
    expect(state.activeCampaign).toBeNull();
    expect(state.activeRoute).toBe('normal');
    expect(state.campaignAffinities).toEqual({caretaker:12,pathfinder:0,vanguard:0,arcanist:0});
    expect(state.dangerState).toEqual({score:0,behaviors:['used_forbidden_relic']});
    expect(state.seasonMilestones).toEqual(['path_convergence']);
    expect(state.majorChoices).toEqual({});
    expect(state.majorOutcomes).toEqual({guardian_festival:'defeat'});
    expect(state.failForwardOutcomes).toEqual(['guardian_festival']);
  });
});
```

- [ ] **Step 2: Run RED.**

Run: `npx vitest run src/campaign-state.test.ts`

Expected: FAIL because the modules do not exist.

- [ ] **Step 3: Implement the sanitation primitives and registries.**

```ts
// src/v3-state-sanitize.ts
export const isV3Record=(value:unknown):value is Record<string,unknown>=>
  typeof value==='object'&&value!==null&&!Array.isArray(value);

export function safeNonNegativeInt(value:unknown,fallback=0):number{
  return typeof value==='number'&&Number.isFinite(value)&&value>=0?Math.floor(value):fallback;
}

export function safePositiveInt(value:unknown,fallback=1):number{
  const safe=safeNonNegativeInt(value,0);
  return safe>=1?safe:fallback;
}

export function uniqueRegistered<T extends string>(raw:unknown,ids:readonly T[]):T[]{
  if(!Array.isArray(raw))return [];
  return ids.filter(id=>raw.includes(id));
}

export function safeOptionalString(value:unknown):string|null{
  if(typeof value!=='string')return null;
  const trimmed=value.trim();
  return trimmed.length?trimmed:null;
}
```

```ts
// src/campaign-model.ts — keep registries exported so later waves extend one source of truth.
export const mainCampaignIds=['caretaker','pathfinder','vanguard','arcanist'] as const;
export const campaignIds=[...mainCampaignIds,'true_path'] as const;
export const campaignPhases=['spring_exploration','path_selection','summer','autumn','winter','ending'] as const;
export const campaignRoutes=['normal','hollow'] as const;
export const characterIds=['mira','kael','rex','selene','noa','eiden','lyra','veyr'] as const;
export const majorEventIds=['guardian_festival','great_expedition','long_night'] as const;
export const majorOutcomeResults=['exceptional_victory','victory','costly_victory','defeat'] as const;
export const campaignMilestoneIds=['path_convergence','summer_resolved','autumn_resolved','winter_resolved','ending_committed'] as const;
export const dangerBehaviorIds=['sacrificed_ally_for_victory','used_forbidden_relic','exploited_bond','ignored_civilians','accepted_veyr_power'] as const;
export const majorChoiceOptions={
  caretaker_autumn:['save_one','spread_risk','team_solution'],
  pathfinder_autumn:['open_route','seal_route','limited_access'],
  vanguard_autumn:['centralize','preserve_independence','coalition_command'],
  arcanist_autumn:['use_relic','destroy_relic','controlled_use'],
} as const;
```

Implement `hydrateCampaignRunState` by iterating the exported registries; only retain a Major Choice option when `(majorChoiceOptions[id] as readonly string[]).includes(rawValue)`.

- [ ] **Step 4: Run GREEN and typecheck.**

Run: `npx vitest run src/campaign-state.test.ts && npx tsc -b`

Expected: PASS / exit 0.

- [ ] **Step 5: Commit only Task 1 files.**

```bash
git add -- src/v3-state-sanitize.ts src/campaign-model.ts src/campaign-state.ts src/campaign-state.test.ts
git commit -m "feat(v3): add campaign state contracts"
```

---

### Task 2: Typed World History

**Files:**
- Create: `src/world-history.ts`
- Test: `src/world-history.test.ts`

**Interfaces:**
- `WorldFactId`
- `WorldHistoryState = {currentFacts:WorldFactId[];inheritedFacts:WorldFactId[]}`
- `emptyWorldHistoryState()`
- `hydrateWorldHistoryState(raw)`

Approved Foundation facts:

```ts
export const worldFactIds=[
  'festival_saved','festival_heavy_losses','ancient_route_opened','ancient_route_sealed','ancient_route_limited',
  'eiden_central_command','regional_alliance','forbidden_relic_used','forbidden_relic_destroyed','rift_stabilized','rift_unstable',
] as const;
```

- [ ] **Step 1: Write RED tests.**

```ts
it('keeps current and inherited facts canonical and separate',()=>{
  expect(hydrateWorldHistoryState({
    currentFacts:['rift_unstable','rift_unstable','stale'],
    inheritedFacts:['regional_alliance','festival_saved','stale'],
  })).toEqual({
    currentFacts:['rift_unstable'],
    inheritedFacts:['festival_saved','regional_alliance'],
  });
});

it('is idempotent',()=>{
  const once=hydrateWorldHistoryState({currentFacts:['festival_saved'],inheritedFacts:['regional_alliance']});
  expect(hydrateWorldHistoryState(once)).toEqual(once);
});
```

- [ ] **Step 2: Run RED.** `npx vitest run src/world-history.test.ts` → FAIL because module absent.

- [ ] **Step 3: Implement the pure registry-filtered module.**

```ts
import {isV3Record,uniqueRegistered} from './v3-state-sanitize';

export const worldFactIds=[
  'festival_saved','festival_heavy_losses','ancient_route_opened','ancient_route_sealed','ancient_route_limited',
  'eiden_central_command','regional_alliance','forbidden_relic_used','forbidden_relic_destroyed','rift_stabilized','rift_unstable',
] as const;
export type WorldFactId=typeof worldFactIds[number];
export type WorldHistoryState={currentFacts:WorldFactId[];inheritedFacts:WorldFactId[]};
export const emptyWorldHistoryState=():WorldHistoryState=>({currentFacts:[],inheritedFacts:[]});
export function hydrateWorldHistoryState(raw:unknown):WorldHistoryState{
  const source=isV3Record(raw)?raw:{};
  return {
    currentFacts:uniqueRegistered(source.currentFacts,worldFactIds),
    inheritedFacts:uniqueRegistered(source.inheritedFacts,worldFactIds),
  };
}
```

- [ ] **Step 4: Run GREEN/typecheck.** `npx vitest run src/world-history.test.ts && npx tsc -b` → PASS.

- [ ] **Step 5: Commit.**

```bash
git add -- src/world-history.ts src/world-history.test.ts
git commit -m "feat(v3): add typed world history"
```

---

### Task 3: Character Bond Persistent Containers

**Files:**
- Create: `src/character-bonds.ts`
- Test: `src/character-bonds.test.ts`

**Interfaces:**
- `CharacterBondState = {trust:number;conflicts:string[];promises:string[];memories:string[]}`
- `CharacterBondsState = Record<CharacterId,CharacterBondState>`
- `characterBondIdRegistry`
- `emptyCharacterBondsState()`
- `hydrateCharacterBondsState(raw)`

Foundation registry contains only already-approved concrete IDs:

```ts
export const characterBondIdRegistry={
  mira:{conflicts:['mira_self_sacrifice'],promises:['mira_share_the_burden'],memories:['mira_festival_rescue','mira_long_night']},
  kael:{conflicts:[],promises:[],memories:[]},
  rex:{conflicts:['rex_obsession_with_victory'],promises:['rex_fair_rivalry'],memories:['rex_first_defeat','rex_tournament_final']},
  selene:{conflicts:[],promises:[],memories:[]},
  noa:{conflicts:[],promises:[],memories:[]},
  eiden:{conflicts:[],promises:[],memories:[]},
  lyra:{conflicts:[],promises:[],memories:[]},
  veyr:{conflicts:[],promises:[],memories:[]},
} as const;
```

- [ ] **Step 1: Write RED tests for eight-character completeness and per-character sanitation.**

```ts
it('sanitizes character-specific bond records',()=>{
  const state=hydrateCharacterBondsState({
    mira:{trust:42.9,conflicts:['mira_self_sacrifice','mira_self_sacrifice','rex_obsession_with_victory'],promises:['mira_share_the_burden'],memories:['mira_festival_rescue','stale']},
    rex:{trust:Infinity,conflicts:['rex_obsession_with_victory'],promises:['rex_fair_rivalry'],memories:['rex_first_defeat']},
    stale_character:{trust:99},
  });
  expect(Object.keys(state)).toEqual(['mira','kael','rex','selene','noa','eiden','lyra','veyr']);
  expect(state.mira).toEqual({trust:42,conflicts:['mira_self_sacrifice'],promises:['mira_share_the_burden'],memories:['mira_festival_rescue']});
  expect(state.rex.trust).toBe(0);
  expect(state.kael).toEqual({trust:0,conflicts:[],promises:[],memories:[]});
});
```

Also pass `first_trust` from the existing `BondSceneId` list and assert it is rejected from every NPC memory list.

- [ ] **Step 2: Run RED.** `npx vitest run src/character-bonds.test.ts` → FAIL.

- [ ] **Step 3: Implement fixed-character hydration.**

```ts
import {characterIds,type CharacterId} from './campaign-model';
import {isV3Record,safeNonNegativeInt,uniqueRegistered} from './v3-state-sanitize';

export type CharacterBondState={trust:number;conflicts:string[];promises:string[];memories:string[]};
export type CharacterBondsState=Record<CharacterId,CharacterBondState>;

const emptyBond=():CharacterBondState=>({trust:0,conflicts:[],promises:[],memories:[]});

export function emptyCharacterBondsState():CharacterBondsState{
  return Object.fromEntries(characterIds.map(id=>[id,emptyBond()])) as CharacterBondsState;
}

export function hydrateCharacterBondsState(raw:unknown):CharacterBondsState{
  const source=isV3Record(raw)?raw:{};
  return Object.fromEntries(characterIds.map(id=>{
    const value=isV3Record(source[id])?source[id]:{};
    const registry=characterBondIdRegistry[id];
    return [id,{
      trust:safeNonNegativeInt(value.trust),
      conflicts:uniqueRegistered(value.conflicts,registry.conflicts),
      promises:uniqueRegistered(value.promises,registry.promises),
      memories:uniqueRegistered(value.memories,registry.memories),
    }];
  })) as CharacterBondsState;
}
```

- [ ] **Step 4: Run Character Bond + existing BondScene tests and typecheck.**

Run: `npx vitest run src/character-bonds.test.ts src/bond-scenes.test.ts && npx tsc -b`

Expected: PASS; existing BondScene semantics unchanged.

- [ ] **Step 5: Commit.**

```bash
git add -- src/character-bonds.ts src/character-bonds.test.ts
git commit -m "feat(v3): add character bond containers"
```

---

### Task 4: Compact Legacy and Run Summaries

**Files:**
- Create: `src/legacy-state.ts`
- Test: `src/legacy-state.test.ts`

**Interfaces:**
- `TrueClueId = 'caretaker_life_anomaly'|'pathfinder_world_route'|'vanguard_hidden_conflict_record'|'arcanist_rift_cycle'`
- `NgPlusUnlockId = 'past_life_dialogue'|'relationship_reunion'|'world_echo'|'fifth_path_candidate'`
- `CharacterMemoryRef = {characterId:CharacterId;memoryId:string}`
- `RunSummary`
- `LegacyState`
- `emptyLegacyState()`
- `hydrateLegacyState(raw)`

```ts
export type RunSummary={
  runNumber:number;
  campaign:CampaignId;
  route:CampaignRoute;
  ending:string|null;
  career:string|null;
  majorWorldOutcomes:WorldFactId[];
  keyBondMemories:CharacterMemoryRef[];
  trueClues:TrueClueId[];
};

export type LegacyState={
  completedRuns:number;
  completedCampaigns:CampaignId[];
  endingCollection:string[];
  careerCollection:string[];
  trueClues:TrueClueId[];
  legacyWorldFacts:WorldFactId[];
  relationshipEchoes:Partial<Record<CharacterId,string[]>>;
  ngPlusUnlocks:NgPlusUnlockId[];
  runSummaries:RunSummary[];
};
```

- [ ] **Step 1: Write RED tests.** Cover empty defaults, trimmed/deduped ending/career strings, invalid campaign/route, stale World Facts/True Clues/Character memories, NaN/Infinity/negative counts, duplicate run numbers keeping the first valid record, and ascending runNumber order.

```ts
it('hydrates compact run summaries without stale IDs or duplicate run numbers',()=>{
  const state=hydrateLegacyState({
    completedRuns:Infinity,
    completedCampaigns:['vanguard','vanguard','stale'],
    endingCollection:[' guardian ','guardian',''],
    trueClues:['arcanist_rift_cycle','stale'],
    runSummaries:[
      {runNumber:2,campaign:'vanguard',route:'normal',ending:'guardian',career:'captain',majorWorldOutcomes:['regional_alliance','stale'],keyBondMemories:[{characterId:'rex',memoryId:'rex_first_defeat'}],trueClues:['vanguard_hidden_conflict_record']},
      {runNumber:2,campaign:'arcanist',route:'normal'},
      {runNumber:1,campaign:'stale',route:'normal'},
    ],
  });
  expect(state.completedRuns).toBe(0);
  expect(state.completedCampaigns).toEqual(['vanguard']);
  expect(state.endingCollection).toEqual(['guardian']);
  expect(state.trueClues).toEqual(['arcanist_rift_cycle']);
  expect(state.runSummaries.map(item=>item.runNumber)).toEqual([2]);
  expect(state.runSummaries[0].majorWorldOutcomes).toEqual(['regional_alliance']);
});
```

- [ ] **Step 2: Run RED.** `npx vitest run src/legacy-state.test.ts` → FAIL.

- [ ] **Step 3: Implement registry-backed Legacy hydration.** Use these exact registries and validate `CharacterMemoryRef.memoryId` against `characterBondIdRegistry[characterId].memories`.

```ts
export const trueClueIds=['caretaker_life_anomaly','pathfinder_world_route','vanguard_hidden_conflict_record','arcanist_rift_cycle'] as const;
export const ngPlusUnlockIds=['past_life_dialogue','relationship_reunion','world_echo','fifth_path_candidate'] as const;

function uniqueStrings(raw:unknown):string[]{
  if(!Array.isArray(raw))return [];
  return [...new Set(raw.map(safeOptionalString).filter((value):value is string=>value!==null))];
}

function hydrateMemoryRefs(raw:unknown):CharacterMemoryRef[]{
  if(!Array.isArray(raw))return [];
  const out:CharacterMemoryRef[]=[];
  for(const value of raw){
    if(!isV3Record(value)||!characterIds.includes(value.characterId as CharacterId)||typeof value.memoryId!=='string')continue;
    const characterId=value.characterId as CharacterId;
    if(!(characterBondIdRegistry[characterId].memories as readonly string[]).includes(value.memoryId))continue;
    if(!out.some(item=>item.characterId===characterId&&item.memoryId===value.memoryId))out.push({characterId,memoryId:value.memoryId});
  }
  return out;
}
```

For `runSummaries`, iterate the raw array, reject invalid required fields, hydrate nested collections, skip a runNumber already accepted, then `sort((a,b)=>a.runNumber-b.runNumber)`.

- [ ] **Step 4: Run GREEN/typecheck.** `npx vitest run src/legacy-state.test.ts && npx tsc -b` → PASS.

- [ ] **Step 5: Commit.**

```bash
git add -- src/legacy-state.ts src/legacy-state.test.ts
git commit -m "feat(v3): add legacy state contracts"
```

---

### Task 5: Compose V3 Persistent State and Mount It in GameState

**Files:**
- Create: `src/v3-persistent-state.ts`
- Test: `src/v3-persistent-state.test.ts`
- Test: `src/game-v3-foundation.test.ts`
- Modify: `src/game.ts`
- Modify: `src/game/save.test.ts`
- Modify: `src/game/world-save.test.ts`

**Interfaces:**

```ts
export type V3PersistentState={
  campaignRun:CampaignRunState;
  worldHistory:WorldHistoryState;
  characterBonds:CharacterBondsState;
  legacy:LegacyState;
};
export function emptyV3PersistentState():V3PersistentState;
export function hydrateV3PersistentState(raw:unknown):V3PersistentState;
export function pickV3PersistentState(state:V3PersistentState):V3PersistentState;
export function prepareNewRunState(current:V3PersistentState):V3PersistentState;
```

`prepareNewRunState` is an unused contract helper in Foundation. It clears current run/Character Bond/current World facts, preserves `legacy`, and sets inherited facts from `legacy.legacyWorldFacts`. It does not create RunSummary, increment runs, calculate echoes, or dispatch itself.

- [ ] **Step 1: Write RED composition/migration-seed tests.**

```ts
it('seeds legacy ending history from V2 top-level endingCollection when legacy is absent',()=>{
  const state=hydrateV3PersistentState({endingCollection:['guardian','guardian','scholar']});
  expect(state.legacy.endingCollection).toEqual(['guardian','scholar']);
});

it('prefers an explicit V3 legacy object over the V2 seed',()=>{
  const state=hydrateV3PersistentState({endingCollection:['old'],legacy:{endingCollection:['v3']}});
  expect(state.legacy.endingCollection).toEqual(['v3']);
});

it('prepares but does not activate a clean future run boundary',()=>{
  const current={...emptyV3PersistentState(),worldHistory:{currentFacts:['rift_unstable'],inheritedFacts:[]},legacy:{...emptyLegacyState(),legacyWorldFacts:['regional_alliance']}};
  const next=prepareNewRunState(current);
  expect(next.campaignRun).toEqual(emptyCampaignRunState());
  expect(next.characterBonds).toEqual(emptyCharacterBondsState());
  expect(next.worldHistory).toEqual({currentFacts:[],inheritedFacts:['regional_alliance']});
  expect(next.legacy).toEqual(current.legacy);
});
```

- [ ] **Step 2: Run RED.** `npx vitest run src/v3-persistent-state.test.ts` → FAIL.

- [ ] **Step 3: Implement composition with V2 ending seed.**

```ts
export function emptyV3PersistentState():V3PersistentState{
  return {
    campaignRun:emptyCampaignRunState(),
    worldHistory:emptyWorldHistoryState(),
    characterBonds:emptyCharacterBondsState(),
    legacy:emptyLegacyState(),
  };
}

export function hydrateV3PersistentState(raw:unknown):V3PersistentState{
  const source=isV3Record(raw)?raw:{};
  const legacySource=isV3Record(source.legacy)
    ? source.legacy
    : {endingCollection:source.endingCollection};
  return {
    campaignRun:hydrateCampaignRunState(source.campaignRun),
    worldHistory:hydrateWorldHistoryState(source.worldHistory),
    characterBonds:hydrateCharacterBondsState(source.characterBonds),
    legacy:hydrateLegacyState(legacySource),
  };
}

export function pickV3PersistentState(state:V3PersistentState):V3PersistentState{
  return {campaignRun:state.campaignRun,worldHistory:state.worldHistory,characterBonds:state.characterBonds,legacy:state.legacy};
}

export function prepareNewRunState(current:V3PersistentState):V3PersistentState{
  return {
    campaignRun:emptyCampaignRunState(),
    worldHistory:{currentFacts:[],inheritedFacts:[...current.legacy.legacyWorldFacts]},
    characterBonds:emptyCharacterBondsState(),
    legacy:current.legacy,
  };
}
```

- [ ] **Step 4: Write RED `GameState` integration tests.**

```ts
it('mounts safe V3 defaults in the canonical game state',()=>{
  expect(initialState.campaignRun).toEqual(emptyCampaignRunState());
  expect(initialState.worldHistory).toEqual(emptyWorldHistoryState());
  expect(initialState.characterBonds).toEqual(emptyCharacterBondsState());
  expect(initialState.legacy).toEqual(emptyLegacyState());
});

it('preserves V3 slices across existing reducer actions',()=>{
  const state={...initialState,campaignRun:{...initialState.campaignRun,runNumber:3}};
  const next=reducer(state,{type:'SET_TACTICAL_PREFERENCES',auto:true,speed:2});
  expect(next.campaignRun.runNumber).toBe(3);
});

it('keeps top-level NEW_RUN inert during Foundation',()=>{
  const state={...initialState,campaignRun:{...initialState.campaignRun,runNumber:3}};
  expect(reducer(state,{type:'NEW_RUN'})).toBe(state);
});
```

Also test malformed nested V3 hydration and `RESET` returning V3 defaults.

- [ ] **Step 5: Run RED.** `npx vitest run src/game-v3-foundation.test.ts` → FAIL because `GameState` does not expose the slices.

- [ ] **Step 6: Modify `src/game.ts` minimally.**

```ts
import {
  emptyV3PersistentState,
  hydrateV3PersistentState,
  pickV3PersistentState,
  type V3PersistentState,
} from './v3-persistent-state';

export type GameState = Omit<Base.GameState,'memories'|'lastGrowthReport'> & V3PersistentState & {
  // keep every existing field unchanged
};

const v3Defaults=emptyV3PersistentState();
export const initialState:GameState={
  ...Base.initialState,
  // keep existing Tactical defaults unchanged
  ...v3Defaults,
};
```

Inside `hydrateGameState`, compute `const v3=hydrateV3PersistentState(source)` and spread `...v3` into the returned object. In the final Base reducer merge, add `...pickV3PersistentState(state)` after `...next` so lower reducers cannot drop these fields. Leave these existing lines behaviorally unchanged:

```ts
if(action.type==='RESET')return initialState;
if(action.type==='NEW_RUN'||action.type==='EVENT_CHOICE')return state;
```

- [ ] **Step 7: Run targeted GREEN.**

Run: `npx vitest run src/v3-persistent-state.test.ts src/game-v3-foundation.test.ts`

Expected: PASS.

- [ ] **Step 8: Add compatibility serializer tests; do not change serializer versions.**

In `src/game/save.test.ts`, add a round-trip with `campaignRun.runNumber=4` and `worldHistory.currentFacts=['festival_saved']`, while retaining `expect(CURRENT_SAVE_VERSION).toBe(3)`.

In `src/game/world-save.test.ts`, add equivalent assertions through `serializeWorldState/hydrateWorldSave`, while retaining `expect(WORLD_SAVE_VERSION).toBe(7)`.

- [ ] **Step 9: Run compatibility/new-run matrix.**

```bash
npx vitest run \
  src/game/save.test.ts \
  src/game/world-save.test.ts \
  src/game/world-save-legacy-matrix.test.ts \
  src/game/world-save-null.test.ts \
  src/game/new-run-meta.test.ts \
  src/game/world-new-run-monthly-reset.test.ts
```

Expected: PASS. Existing lower World `NEW_RUN` meta behavior stays intact; top-level V3 `NEW_RUN` remains inert.

- [ ] **Step 10: Typecheck and commit.**

```bash
npx tsc -b
git add -- src/v3-persistent-state.ts src/v3-persistent-state.test.ts src/game-v3-foundation.test.ts src/game.ts src/game/save.test.ts src/game/world-save.test.ts
git commit -m "feat(v3): mount persistent foundation state"
```

Expected: typecheck exit 0 and focused commit only.

---

### Task 6: Upgrade Active Save Envelope from Schema 2 to 3 Safely

**Files:**
- Modify: `src/save-schema.ts`
- Modify: `src/save-schema.test.ts`

**Interfaces:**
- `CURRENT_SAVE_SCHEMA_VERSION = 3 as const`
- `SaveInspectionStatus` adds `'migrated-v2'`
- Schema 3 requires integrity exactly as schema 2 did.
- Schema 2 also requires valid old integrity before migration. Missing/mismatched integrity returns `integrity-failed` with fresh hydrated state.
- Schema 1 remains the pre-integrity `migrated-v1` path.
- Unversioned legacy, malformed envelope, future version, and invalid JSON behavior remain unchanged.

- [ ] **Step 1: Write RED migration tests using a realistic V2 state that does not contain V3 slices.**

```ts
function integrityForTest(state:unknown):string{
  const serialized=JSON.stringify(state);
  let hash=0x811c9dc5;
  for(let index=0;index<serialized.length;index+=1){
    hash^=serialized.charCodeAt(index);
    hash=Math.imul(hash,0x01000193)>>>0;
  }
  return hash.toString(16).padStart(8,'0');
}

function v2State(){
  const {campaignRun,worldHistory,characterBonds,legacy,...state}=initialState;
  void campaignRun;void worldHistory;void characterBonds;void legacy;
  return {...state,gold:444,endingCollection:['guardian']};
}

it('validates v2 integrity before migration and seeds V3 defaults/history',()=>{
  const state=v2State();
  const serialized=JSON.stringify({schemaVersion:2,integrity:integrityForTest(state),state});
  const inspection=inspectSavedGame(serialized);
  expect(inspection.status).toBe('migrated-v2');
  expect(inspection.state.gold).toBe(444);
  expect(inspection.state.campaignRun).toEqual(emptyCampaignRunState());
  expect(inspection.state.legacy.endingCollection).toEqual(['guardian']);
});

it('rejects a tampered v2 envelope instead of migrating it',()=>{
  const state=v2State();
  const envelope={schemaVersion:2,integrity:integrityForTest(state),state};
  envelope.state.gold=999999;
  expect(inspectSavedGame(JSON.stringify(envelope)).status).toBe('integrity-failed');
});

it('rejects a v2 envelope with missing integrity',()=>{
  expect(inspectSavedGame(JSON.stringify({schemaVersion:2,state:v2State()})).status).toBe('integrity-failed');
});
```

Also update the current-envelope assertion from version 2 to version 3 and add `parseSavedGame(serializeSavedGame(hydrated))` equality for V2→V3 load/save/load idempotency.

- [ ] **Step 2: Run RED.** `npx vitest run src/save-schema.test.ts` → FAIL because current version is 2 and `migrated-v2` does not exist.

- [ ] **Step 3: Implement explicit v2 validation before migration.**

```ts
export const CURRENT_SAVE_SCHEMA_VERSION=3 as const;

export type SaveInspectionStatus=
  | 'missing'|'invalid-json'|'malformed-envelope'|'integrity-failed'
  | 'legacy'|'migrated-v1'|'migrated-v2'|'future-version'|'valid';

function validIntegrity(raw:UnknownRecord):boolean{
  return typeof raw.integrity==='string'&&raw.integrity===integrityForState(raw.state);
}

function inspectRawSavedGame(raw:unknown):SaveInspection{
  if(!isRecord(raw))return {status:'legacy',state:hydrateGameState(raw),schemaVersion:null};
  const version=schemaVersionOf(raw);
  if(version===null)return {status:'legacy',state:hydrateGameState(raw),schemaVersion:null};
  if(!('state' in raw))return {status:'malformed-envelope',state:hydrateGameState(null),schemaVersion:version};
  if(version===CURRENT_SAVE_SCHEMA_VERSION){
    if(!validIntegrity(raw))return {status:'integrity-failed',state:hydrateGameState(null),schemaVersion:version};
    return {status:'valid',state:hydrateGameState(raw.state),schemaVersion:version};
  }
  if(version===2){
    if(!validIntegrity(raw))return {status:'integrity-failed',state:hydrateGameState(null),schemaVersion:version};
    return {status:'migrated-v2',state:hydrateGameState(raw.state),schemaVersion:version};
  }
  if(version===1)return {status:'migrated-v1',state:hydrateGameState(raw.state),schemaVersion:version};
  if(version>CURRENT_SAVE_SCHEMA_VERSION)return {status:'future-version',state:hydrateGameState(raw.state),schemaVersion:version};
  return {status:'legacy',state:hydrateGameState(raw.state),schemaVersion:version};
}
```

Keep `integrityForState` hashing algorithm unchanged.

- [ ] **Step 4: Run GREEN/typecheck.**

Run: `npx vitest run src/save-schema.test.ts src/game-v3-foundation.test.ts && npx tsc -b`

Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
git add -- src/save-schema.ts src/save-schema.test.ts
git commit -m "feat(v3): migrate resilient saves to schema 3"
```

---

### Task 7: Preserve Resilient Backup Recovery Across V2→V3

**Files:**
- Modify: `src/save-resilience.ts`
- Modify: `src/save-resilience.test.ts`

**Interfaces:**
- `acceptableStatuses` adds `migrated-v2`.
- Valid V2 primary/backup may load; tampered V2 may not load or be rotated into history.
- Storage keys, backup count, backup order, recovery source names, and repair behavior stay unchanged.

- [ ] **Step 1: Write RED resilient-migration tests.** Add the same local `integrityForTest` and realistic `v2State()` helper used in Task 6.

```ts
it('accepts a valid v2 backup when the primary is corrupt',()=>{
  const storage=new MemoryStorage();
  const state=v2State();
  storage.setItem(saveStorageKeys.primary,'{broken');
  storage.setItem(saveStorageKeys.backups[0],JSON.stringify({schemaVersion:2,integrity:integrityForTest(state),state}));
  const result=loadResilientSave(storage);
  expect(result.source).toBe('backup-1');
  expect(result.recovered).toBe(true);
  expect(result.state.gold).toBe(444);
  expect(result.state.campaignRun.phase).toBe('spring_exploration');
});

it('skips a tampered v2 backup',()=>{
  const storage=new MemoryStorage();
  const state=v2State();
  const envelope={schemaVersion:2,integrity:integrityForTest(state),state};
  envelope.state.gold=999999;
  storage.setItem(saveStorageKeys.backups[0],JSON.stringify(envelope));
  expect(loadResilientSave(storage).source).toBe('fresh');
});
```

Add a write/rotation case proving the new primary has schemaVersion 3 while only valid prior generations rotate.

- [ ] **Step 2: Run RED.** `npx vitest run src/save-resilience.test.ts` → FAIL because `migrated-v2` is not accepted.

- [ ] **Step 3: Make the one-line production change.**

```ts
const acceptableStatuses=new Set(['valid','legacy','migrated-v1','migrated-v2','future-version']);
```

No other `save-resilience.ts` behavior changes.

- [ ] **Step 4: Run GREEN/typecheck.**

Run: `npx vitest run src/save-schema.test.ts src/save-resilience.test.ts && npx tsc -b`

Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
git add -- src/save-resilience.ts src/save-resilience.test.ts
git commit -m "fix(v3): preserve backup recovery across v2 migration"
```

---

### Task 8: Foundation Gate, Draft PR CI, and Integration Handoff

**Files:**
- No planned production changes. If verification finds a bug, add one focused regression test beside the owning module, fix only that defect, rerun the entire gate, and commit separately.

**Interfaces:**
- Produces a verified `work/v3-foundation` head and then a GREEN `integration/v3` Foundation checkpoint.

- [ ] **Step 1: Run all Foundation-focused tests.**

```bash
npx vitest run \
  src/campaign-state.test.ts \
  src/world-history.test.ts \
  src/character-bonds.test.ts \
  src/legacy-state.test.ts \
  src/v3-persistent-state.test.ts \
  src/game-v3-foundation.test.ts \
  src/save-schema.test.ts \
  src/save-resilience.test.ts
```

Expected: all PASS.

- [ ] **Step 2: Run save/new-run compatibility matrix.**

```bash
npx vitest run \
  src/game/save.test.ts \
  src/game/world-save.test.ts \
  src/game/world-save-legacy-matrix.test.ts \
  src/game/world-save-null.test.ts \
  src/game/new-run-meta.test.ts \
  src/game/world-new-run-monthly-reset.test.ts \
  src/bond-scenes.test.ts
```

Expected: all PASS. `src/game/save.ts` stays version 3; `src/game/world-save.ts` stays version 7; existing World NEW_RUN semantics stay GREEN; top-level V3 NEW_RUN is still inert.

- [ ] **Step 3: Run full regression.**

Run: `npm test`

Expected: every pre-existing V2 suite plus all new Foundation suites PASS. The exact test count will be greater than the previous 1079-test baseline; do not hard-code a new count until the run reports it.

- [ ] **Step 4: Run strict TypeScript and production build.**

```bash
npx tsc -b
npm run build
```

Expected: both exit 0; Vite production build succeeds.

- [ ] **Step 5: Inspect diff before push.**

Run:

```bash
git status --short
git diff --stat integration/v3...HEAD
git diff --name-only integration/v3...HEAD
```

Expected production changes only in the seven new foundation modules plus `src/game.ts`, `src/save-schema.ts`, `src/save-resilience.ts`; test changes only in the files named by this plan. No UI/CSS/App/Root/vercel changes.

- [ ] **Step 6: Push `work/v3-foundation` and open/refresh a Draft PR targeting `integration/v3`.** Because `.github/workflows/ci.yml` runs on `pull_request`, this PR is the authoritative remote CI proof even though push CI is not configured for `integration/v3`.

- [ ] **Step 7: Verify exact PR head CI.** Expected GitHub Actions `test-build` job: `npm install`, `npm run test`, `npm run build` all GREEN on the exact work-branch SHA.

- [ ] **Step 8: Room 06 integrates only after local + PR gates are GREEN.** Use a force-free merge/fast-forward policy consistent with current integration practice; do not touch `integration/v2`, `main`, or production.

- [ ] **Step 9: Re-run post-integration gates on exact `integration/v3` SHA.**

```bash
npm test
npx tsc -b
npm run build
```

Expected: all GREEN.

- [ ] **Step 10: Record handoff evidence.** Report exact remote `integration/v3` SHA, full test count, TypeScript/build result, V2→V3 valid migration, tampered/missing-integrity v2 rejection, backup recovery, load/save/load idempotency, V2 endingCollection seed preservation, and top-level NEW_RUN no-op. Only then may Rooms 01–05 branch Wave 2 work from that SHA.

## Foundation Completion Contract

Foundation is complete only when all ten statements are true:

1. Fresh and legacy-hydrated `GameState` always contain canonical `campaignRun`, `worldHistory`, `characterBonds`, and `legacy`.
2. Default V3 slices do not change current gameplay results.
3. Malformed nested V3 values sanitize deterministically and idempotently.
4. V2 top-level `endingCollection` is seeded into new Legacy when V3 Legacy is absent.
5. App-facing saves write `schemaVersion:3`.
6. Valid schema 2 returns `migrated-v2`; tampered or missing-integrity schema 2 returns `integrity-failed`.
7. Resilient backup recovery accepts valid migrated-v2 data but never preserves corrupted v2 generations.
8. Existing `BondScene`, `src/game/save.ts` version 3, `src/game/world-save.ts` version 7, and lower World NEW_RUN behavior remain unchanged.
9. Top-level `NEW_RUN` remains a no-op; actual NG+ transition remains Wave 6 scope.
10. Full tests, strict TypeScript, production build, and Draft PR CI are GREEN on the exact integrated Foundation code.

## Self-Review

- **Spec coverage:** Implements only Master Spec Wave 1/Foundation: persistent contracts, nested hydration, safe Save Schema V3, resilient migration, V2 ending-history seed, and a non-active NEW_RUN boundary. Spring/Path Convergence is explicitly outside scope.
- **Placeholder scan:** No TBD/TODO/“similar to”/unspecified validation steps. Future content characters intentionally have empty registered relationship-event arrays; later approved content waves extend the same registry rather than accepting arbitrary strings.
- **Type consistency:** Campaign/route/character/major-choice/outcome registries have one source of truth. World Facts live in `world-history.ts`; Character memories validate against `characterBondIdRegistry`; Legacy consumes those exact types.
- **Save safety:** Schema-v2 integrity is checked against raw V2 state before hydration adds any V3 defaults. Only after that check can status become `migrated-v2` and resilient recovery accept it.
- **Compatibility safety:** The active app serializer (`save-schema.ts`) is distinct from existing compatibility serializers (`src/game/save.ts`, `src/game/world-save.ts`); only the active envelope moves 2→3. Existing serializer versions remain unchanged and are regression-tested.
- **Behavioral isolation:** `prepareNewRunState` is pure and unused; top-level reducer NEW_RUN stays a no-op. No V3 gameplay adapter, UI, reward, or campaign effect is activated in Foundation.
- **Branch/CI safety:** Implementation occurs on `work/v3-foundation`; Draft PR CI targets `integration/v3`; only Room 06 promotes a GREEN head. V2/main/prod remain protected.
