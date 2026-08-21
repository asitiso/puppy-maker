# Puppy Maker V3 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the V3 persistent-state and save foundation—typed campaign contracts, World History, Character Bonds, Legacy, safe V2→V3 migration, and an inert NEW_RUN boundary—without changing any current V2 gameplay behavior.

**Architecture:** Add four focused nested persistent slices (`campaignRun`, `worldHistory`, `characterBonds`, `legacy`) behind a small `v3-persistent-state.ts` composition layer. `src/game.ts` only mounts, hydrates, and preserves these slices; gameplay adapters and NG+ transition behavior are explicitly excluded from Foundation. The active app save envelope in `src/save-schema.ts` moves from schema 2 to 3 while preserving the existing integrity algorithm and backup rotation, including integrity validation of incoming schema-v2 envelopes before migration.

**Tech Stack:** React 19, TypeScript strict mode, Vite, Vitest, Node 22 CI, existing localStorage/resilient-save infrastructure only.

**Spec:** `docs/superpowers/specs/2026-08-22-puppy-maker-v3-master-design.md`

## Global Constraints

- Authoritative V2 code baseline is `integration/v2@edd0ca99537ed92c7993969166b80c269f3aced8`; approved documentation lives on `design/v3-master-spec`.
- At execution start, Room 06 creates `integration/v3` from the approved documentation head; `integration/v2`, `main`, and production remain untouched.
- Room 06 is the sole integration authority for `integration/v3`; Rooms 01–05 do not start V3 implementation until the Foundation Gate is GREEN.
- Preserve `hub -> schedule -> training -> dialogue -> result -> next month -> hub` exactly.
- No campaign affinity scoring, Path Convergence, campaign story effects, Tactical modifiers, Seasonal objectives, True/Hollow unlocking, ending composition, or active NG+ reset behavior in this plan.
- The existing `BondScene` system is not repurposed. V3 NPC bonds live only under `characterBonds`.
- Existing domain engines remain authoritative. No campaign branching logic is inserted into Raising, World, Season, Tactical, Sanctuary, Astral, Celestial, or Rift reducers.
- No new dependencies, state framework, event bus, UI, CSS, `App.tsx`, `Root.tsx`, `LayeredHome.tsx`, `main.tsx`, or `vercel.json` changes.
- The app-facing resilient save key remains `puppy-maker-save`; three-generation backup rotation remains unchanged.
- `src/game/save.ts` and `src/game/world-save.ts` are separate compatibility serializers. Do not bump their existing version numbers in Foundation; they inherit V3 fields through `hydrateGameState` and are covered by regression tests.
- All persisted numeric values reject NaN/Infinity and invalid negatives. All registered ID collections remove unknown IDs and duplicates during hydration.
- Hydration must be idempotent: `hydrate -> serialize -> hydrate` produces the same canonical state.
- TDD is mandatory: RED test first, minimal implementation, targeted GREEN, then full regression/build before each task commit.

## File Structure Locked by This Plan

### New files

- `src/campaign-model.ts` — stable V3 IDs and small shared type guards only; no gameplay rules.
- `src/campaign-state.ts` — `CampaignRunState`, defaults, and hydration/sanitization.
- `src/world-history.ts` — typed current/inherited World Facts and hydration.
- `src/character-bonds.ts` — eight NPC bond containers and canonical Promise/Conflict/Memory sanitation.
- `src/legacy-state.ts` — compact cross-run Legacy and RunSummary hydration.
- `src/v3-persistent-state.ts` — composition helpers for the four slices and a future NEW_RUN boundary helper that remains unused by the reducer in Foundation.
- Focused tests with matching `.test.ts` names plus `src/game-v3-foundation.test.ts`.

### Modified files

- `src/game.ts` — mount/preserve/hydrate the four V3 slices only.
- `src/save-schema.ts` — schema 3 envelope and safe schema-v2 migration.
- `src/save-schema.test.ts` — migration, integrity, malformed-data, and idempotency coverage.
- `src/save-resilience.ts` — accept `migrated-v2` as a valid recovery candidate.
- `src/save-resilience.test.ts` — V2 backup migration/recovery coverage.
- `src/game/save.test.ts` — compatibility serializer round-trip coverage for V3 slices; version stays 3.
- `src/game/world-save.test.ts` — world compatibility serializer carries V3 slices; world version stays 7.

---

### Task 1: Stable V3 IDs and CampaignRunState

**Files:**
- Create: `src/campaign-model.ts`
- Create: `src/campaign-state.ts`
- Create: `src/campaign-state.test.ts`

**Interfaces:**
- Produces `CampaignId = 'caretaker'|'pathfinder'|'vanguard'|'arcanist'|'true_path'`.
- Produces `MainCampaignId = Exclude<CampaignId,'true_path'>`.
- Produces `CampaignPhase = 'spring_exploration'|'path_selection'|'summer'|'autumn'|'winter'|'ending'`.
- Produces `CampaignRoute = 'normal'|'hollow'`.
- Produces `CharacterId = 'mira'|'kael'|'rex'|'selene'|'noa'|'eiden'|'lyra'|'veyr'`.
- Produces `MajorEventId = 'guardian_festival'|'great_expedition'|'long_night'` and `MajorOutcomeResult = 'exceptional_victory'|'victory'|'costly_victory'|'defeat'`.
- Produces `MajorChoiceId = 'caretaker_autumn'|'pathfinder_autumn'|'vanguard_autumn'|'arcanist_autumn'` with matching `MajorChoiceOptionId` registries:
  - Caretaker: `save_one`, `spread_risk`, `team_solution`
  - Pathfinder: `open_route`, `seal_route`, `limited_access`
  - Vanguard: `centralize`, `preserve_independence`, `coalition_command`
  - Arcanist: `use_relic`, `destroy_relic`, `controlled_use`
- Produces `CampaignMilestoneId = 'path_convergence'|'summer_resolved'|'autumn_resolved'|'winter_resolved'|'ending_committed'`.
- Produces `DangerBehaviorId = 'sacrificed_ally_for_victory'|'used_forbidden_relic'|'exploited_bond'|'ignored_civilians'|'accepted_veyr_power'`.
- Produces `CampaignRunState`, `emptyCampaignRunState()`, `hydrateCampaignRunState(raw)`.

Canonical shape:

```ts
export type CampaignRunState = {
  runNumber:number;
  phase:CampaignPhase;
  activeCampaign:CampaignId|null;
  activeRoute:CampaignRoute;
  campaignAffinities:Record<MainCampaignId,number>;
  dangerState:{ score:number; behaviors:DangerBehaviorId[] };
  seasonMilestones:CampaignMilestoneId[];
  majorChoices:Partial<Record<MajorChoiceId,MajorChoiceOptionId>>;
  majorOutcomes:Partial<Record<MajorEventId,MajorOutcomeResult>>;
  failForwardOutcomes:MajorEventId[];
  claimedCampaignRewards:CampaignMilestoneId[];
};
```

Default is run 1, `spring_exploration`, no active campaign, `normal`, all affinities 0, danger 0/empty, all collections empty.

- [ ] **Step 1: Write RED tests for defaults and malformed hydration.** Include assertions that NaN/Infinity/negative affinity and danger values become 0, runNumber is at least 1, stale phase/campaign/route/behavior/milestone/event/result IDs are discarded/defaulted, duplicate arrays dedupe, and an option valid for one Major Choice cannot be stored under another.

```ts
it('hydrates malformed campaign state into canonical safe defaults', () => {
  const state = hydrateCampaignRunState({
    runNumber:-4,
    phase:'spring_99',
    activeCampaign:'stale_path',
    activeRoute:'forced',
    campaignAffinities:{ caretaker:12.8,pathfinder:Infinity,vanguard:-2,arcanist:NaN },
    dangerState:{ score:Infinity,behaviors:['used_forbidden_relic','used_forbidden_relic','stale'] },
    seasonMilestones:['path_convergence','path_convergence','stale'],
    majorChoices:{ pathfinder_autumn:'centralize' },
    majorOutcomes:{ guardian_festival:'defeat',unknown_event:'victory' },
    failForwardOutcomes:['guardian_festival','guardian_festival','unknown_event'],
  });
  expect(state.runNumber).toBe(1);
  expect(state.phase).toBe('spring_exploration');
  expect(state.activeCampaign).toBeNull();
  expect(state.activeRoute).toBe('normal');
  expect(state.campaignAffinities).toEqual({caretaker:12,pathfinder:0,vanguard:0,arcanist:0});
  expect(state.dangerState).toEqual({score:0,behaviors:['used_forbidden_relic']});
  expect(state.majorChoices).toEqual({});
  expect(state.majorOutcomes).toEqual({guardian_festival:'defeat'});
  expect(state.failForwardOutcomes).toEqual(['guardian_festival']);
});
```

- [ ] **Step 2: Run the focused test and confirm RED.**

Run: `npx vitest run src/campaign-state.test.ts`

Expected: FAIL because `campaign-model.ts` / `campaign-state.ts` do not exist.

- [ ] **Step 3: Implement the minimal registries, type guards, defaults, and hydrator.** Use small `isRecord`, finite nonnegative integer, registered-string, and dedupe helpers. Do not add affinity scoring or danger thresholds.

- [ ] **Step 4: Run focused tests.**

Run: `npx vitest run src/campaign-state.test.ts`

Expected: PASS.

- [ ] **Step 5: Run typecheck and commit.**

Run: `npx tsc -b`

Expected: exit 0.

Commit only `src/campaign-model.ts`, `src/campaign-state.ts`, `src/campaign-state.test.ts` with `feat(v3): add campaign state contracts`.

---

### Task 2: Typed World History

**Files:**
- Create: `src/world-history.ts`
- Create: `src/world-history.test.ts`

**Interfaces:**
- Produces `WorldFactId` with exactly the currently approved Foundation facts:
  `festival_saved`, `festival_heavy_losses`, `ancient_route_opened`, `ancient_route_sealed`, `ancient_route_limited`, `eiden_central_command`, `regional_alliance`, `forbidden_relic_used`, `forbidden_relic_destroyed`, `rift_stabilized`, `rift_unstable`.
- Produces `WorldHistoryState = { currentFacts:WorldFactId[]; inheritedFacts:WorldFactId[] }`.
- Produces `emptyWorldHistoryState()` and `hydrateWorldHistoryState(raw)`.

- [ ] **Step 1: Write RED tests** proving current and inherited facts stay separate, registration order is deterministic, duplicates disappear, unknown IDs are removed, malformed objects return safe empty state, and re-hydrating an already hydrated state is identical.

```ts
it('keeps current and inherited facts canonical and separate', () => {
  expect(hydrateWorldHistoryState({
    currentFacts:['rift_unstable','rift_unstable','stale'],
    inheritedFacts:['regional_alliance','festival_saved','stale'],
  })).toEqual({
    currentFacts:['rift_unstable'],
    inheritedFacts:['festival_saved','regional_alliance'],
  });
});
```

- [ ] **Step 2: Run `npx vitest run src/world-history.test.ts`; expect RED because the module is absent.**
- [ ] **Step 3: Implement registry-filtered hydration only.** Do not calculate world effects or NG+ echoes.
- [ ] **Step 4: Run `npx vitest run src/world-history.test.ts`; expect PASS.**
- [ ] **Step 5: Run `npx tsc -b`; expect exit 0, then commit `feat(v3): add typed world history`.**

---

### Task 3: Character Bond Persistent Containers

**Files:**
- Create: `src/character-bonds.ts`
- Create: `src/character-bonds.test.ts`

**Interfaces:**
- Consumes `CharacterId` from `src/campaign-model.ts`.
- Produces `CharacterBondState = { trust:number; conflicts:string[]; promises:string[]; memories:string[] }` and `CharacterBondsState = Record<CharacterId,CharacterBondState>`.
- Produces `characterBondIdRegistry`, `emptyCharacterBondsState()`, `hydrateCharacterBondsState(raw)`.
- Foundation registry includes only approved concrete IDs already established by the design:
  - Mira conflict `mira_self_sacrifice`; promise `mira_share_the_burden`; memories `mira_festival_rescue`, `mira_long_night`.
  - Rex conflict `rex_obsession_with_victory`; promise `rex_fair_rivalry`; memories `rex_first_defeat`, `rex_tournament_final`.
  - Kael, Selene, Noa, Eiden, Lyra, Veyr begin with empty Promise/Conflict/Memory registries until their content waves define canonical IDs.

- [ ] **Step 1: Write RED tests** proving all eight characters always exist, malformed/missing character entries default safely, trust rejects negative/NaN/Infinity, valid IDs dedupe, IDs belonging to another character are rejected, unknown character keys disappear, and no `BondSceneId` is copied into this system.

```ts
it('sanitizes character-specific bond records without touching existing BondScene data', () => {
  const state = hydrateCharacterBondsState({
    mira:{trust:42.9,conflicts:['mira_self_sacrifice','mira_self_sacrifice','rex_obsession_with_victory'],promises:['mira_share_the_burden'],memories:['mira_festival_rescue','stale']},
    rex:{trust:Infinity,conflicts:['rex_obsession_with_victory'],promises:['rex_fair_rivalry'],memories:['rex_first_defeat']},
    stale_character:{trust:99},
  });
  expect(state.mira.trust).toBe(42);
  expect(state.mira.conflicts).toEqual(['mira_self_sacrifice']);
  expect(state.mira.memories).toEqual(['mira_festival_rescue']);
  expect(state.rex.trust).toBe(0);
  expect(Object.keys(state)).toHaveLength(8);
});
```

- [ ] **Step 2: Run `npx vitest run src/character-bonds.test.ts`; expect RED.**
- [ ] **Step 3: Implement the fixed eight-character container and per-character registry sanitation.** Keep relationship rank derived and absent from persisted state.
- [ ] **Step 4: Run focused test; expect PASS.**
- [ ] **Step 5: Run `npx vitest run src/bond-scenes.test.ts src/character-bonds.test.ts` to prove the old BondScene system is unchanged; expect PASS.**
- [ ] **Step 6: Run `npx tsc -b`; expect exit 0, then commit `feat(v3): add character bond containers`.**

---

### Task 4: Compact Legacy and Run Summaries

**Files:**
- Create: `src/legacy-state.ts`
- Create: `src/legacy-state.test.ts`

**Interfaces:**
- Consumes `CampaignId`, `CampaignRoute`, `CharacterId` and `WorldFactId`.
- Produces `TrueClueId = 'caretaker_life_anomaly'|'pathfinder_world_route'|'vanguard_hidden_conflict_record'|'arcanist_rift_cycle'`.
- Produces `NgPlusUnlockId = 'past_life_dialogue'|'relationship_reunion'|'world_echo'|'fifth_path_candidate'`.
- Produces `CharacterMemoryRef = { characterId:CharacterId; memoryId:string }` validated against `characterBondIdRegistry`.
- Produces:

```ts
export type RunSummary = {
  runNumber:number;
  campaign:CampaignId;
  route:CampaignRoute;
  ending:string|null;
  career:string|null;
  majorWorldOutcomes:WorldFactId[];
  keyBondMemories:CharacterMemoryRef[];
  trueClues:TrueClueId[];
};

export type LegacyState = {
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

Ending/career strings are trimmed, empty values removed, and deduped; they are not redefined in Foundation because current V2 already owns existing ending/career identifiers. Run summaries are canonicalized by positive run number, invalid campaign/route rejected, duplicate run numbers keep the first valid entry, and final output is sorted by `runNumber` ascending.

- [ ] **Step 1: Write RED tests** for safe empty defaults; stale campaign/route/World Fact/True Clue/Character/Memory IDs; duplicate collections; malformed run summaries; NaN/Infinity/negative `completedRuns`; duplicate run numbers; and deterministic sort.
- [ ] **Step 2: Run `npx vitest run src/legacy-state.test.ts`; expect RED.**
- [ ] **Step 3: Implement the compact Legacy hydrator with no full historical state copies and no NG+ effect calculation.**
- [ ] **Step 4: Run focused test; expect PASS.**
- [ ] **Step 5: Run `npx tsc -b`; expect exit 0, then commit `feat(v3): add legacy state contracts`.**

---

### Task 5: Compose V3 Persistent State and Mount It in GameState

**Files:**
- Create: `src/v3-persistent-state.ts`
- Create: `src/v3-persistent-state.test.ts`
- Create: `src/game-v3-foundation.test.ts`
- Modify: `src/game.ts`
- Modify: `src/game/save.test.ts`
- Modify: `src/game/world-save.test.ts`

**Interfaces:**
- Produces:

```ts
export type V3PersistentState = {
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

`prepareNewRunState` is a **contract skeleton only** in Foundation: it returns safe current-run defaults while preserving `legacy` and setting `worldHistory.inheritedFacts` from already persisted `legacy.legacyWorldFacts`; it does not create RunSummary, increment Legacy, calculate echoes, or run automatically. This helper gives Wave 6 a tested boundary without changing current reducer behavior.

- [ ] **Step 1: Write RED composition tests** for empty state, nested malformed hydration, and `prepareNewRunState` preserving Legacy while clearing current campaign/Bond/World state.
- [ ] **Step 2: Run `npx vitest run src/v3-persistent-state.test.ts`; expect RED.**
- [ ] **Step 3: Implement composition helpers using only the four domain hydrators.**
- [ ] **Step 4: Write RED `src/game-v3-foundation.test.ts` tests** proving:
  1. `initialState` contains canonical empty `campaignRun`, `worldHistory`, `characterBonds`, and `legacy`.
  2. `hydrateGameState` preserves valid V3 nested data and sanitizes malformed nested data.
  3. A normal existing reducer action such as `SET_TACTICAL_PREFERENCES` preserves all four V3 slices.
  4. `RESET` returns clean V3 defaults.
  5. **Top-level `reducer(state,{type:'NEW_RUN'})` remains the exact same state reference in Foundation.** This prevents accidental early NG+ activation while lower `src/game/world-state.ts` compatibility behavior remains untouched.

```ts
it('keeps top-level NEW_RUN inert during Foundation', () => {
  const state = {...initialState,campaignRun:{...initialState.campaignRun,runNumber:3}};
  expect(reducer(state,{type:'NEW_RUN'})).toBe(state);
});
```

- [ ] **Step 5: Run `npx vitest run src/game-v3-foundation.test.ts`; expect RED because `GameState` does not yet expose V3 slices.**
- [ ] **Step 6: Modify `src/game.ts` minimally.** Extend `GameState` with `V3PersistentState`; spread `emptyV3PersistentState()` into `initialState`; call `hydrateV3PersistentState(source)` in `hydrateGameState`; and spread `pickV3PersistentState(state)` into the final Base-reducer merge so V3 data cannot be dropped. Do not add new action handlers or change existing `NEW_RUN`/`EVENT_CHOICE` no-op behavior.
- [ ] **Step 7: Run targeted foundation + Tactical preservation tests.**

Run: `npx vitest run src/v3-persistent-state.test.ts src/game-v3-foundation.test.ts`

Expected: PASS.

- [ ] **Step 8: Add compatibility serializer assertions without changing their versions.** In `src/game/save.test.ts`, round-trip a state containing a non-default `campaignRun.runNumber` and `worldHistory.currentFacts`; still assert `CURRENT_SAVE_VERSION === 3`. In `src/game/world-save.test.ts`, round-trip the same nested fields through the world serializer; still assert `WORLD_SAVE_VERSION === 7`.
- [ ] **Step 9: Run compatibility tests.**

Run: `npx vitest run src/game/save.test.ts src/game/world-save.test.ts src/game/world-save-legacy-matrix.test.ts src/game/world-save-null.test.ts src/game/new-run-meta.test.ts src/game/world-new-run-monthly-reset.test.ts`

Expected: PASS. Existing lower world `NEW_RUN` meta behavior remains unchanged while the top-level V3 NEW_RUN boundary remains inert.

- [ ] **Step 10: Run `npx tsc -b`; expect exit 0, then commit `feat(v3): mount persistent foundation state`.**

---

### Task 6: Upgrade the Active Save Envelope from Schema 2 to 3 Safely

**Files:**
- Modify: `src/save-schema.ts`
- Modify: `src/save-schema.test.ts`

**Interfaces:**
- `CURRENT_SAVE_SCHEMA_VERSION = 3 as const`.
- `SaveInspectionStatus` adds `migrated-v2`.
- Schema 3 current envelopes require integrity exactly as schema 2 did.
- **Schema 2 envelopes also require a valid integrity hash before migration.** Missing or mismatched v2 integrity returns `integrity-failed` and fresh hydrated state, never `migrated-v2`.
- Schema 1 remains the pre-integrity migration path and returns `migrated-v1`.
- Unversioned legacy, malformed-envelope, future-version, invalid-json semantics remain unchanged.

- [ ] **Step 1: Add a test-only hash helper to `src/save-schema.test.ts` matching the existing FNV-style integrity algorithm**, then write RED tests for current version 3, valid v2 migration, tampered v2 rejection, missing-v2-integrity rejection, V2 state receiving safe V3 defaults, and load→save→load idempotency.

```ts
function integrityForTest(state:unknown):string {
  const serialized=JSON.stringify(state);
  let hash=0x811c9dc5;
  for(let index=0;index<serialized.length;index+=1){
    hash^=serialized.charCodeAt(index);
    hash=Math.imul(hash,0x01000193)>>>0;
  }
  return hash.toString(16).padStart(8,'0');
}

it('validates schema v2 integrity before migrating to v3', () => {
  const state={...initialState,gold:444};
  const valid=JSON.stringify({schemaVersion:2,integrity:integrityForTest(state),state});
  expect(inspectSavedGame(valid).status).toBe('migrated-v2');
  const tampered=JSON.parse(valid);
  tampered.state.gold=999999;
  expect(inspectSavedGame(JSON.stringify(tampered)).status).toBe('integrity-failed');
});
```

- [ ] **Step 2: Run `npx vitest run src/save-schema.test.ts`; expect RED because current version is 2 and `migrated-v2` does not exist.**
- [ ] **Step 3: Implement schema 3 with explicit version-2 integrity validation before hydration.** Keep `integrityForState` algorithm byte-for-byte compatible; do not change hash format or storage key.
- [ ] **Step 4: Run `npx vitest run src/save-schema.test.ts`; expect PASS.**
- [ ] **Step 5: Run `npx vitest run src/game-v3-foundation.test.ts src/save-schema.test.ts`; expect PASS.**
- [ ] **Step 6: Run `npx tsc -b`; expect exit 0, then commit `feat(v3): migrate resilient saves to schema 3`.**

---

### Task 7: Preserve Resilient Backup Recovery Across V2→V3 Migration

**Files:**
- Modify: `src/save-resilience.ts`
- Modify: `src/save-resilience.test.ts`

**Interfaces:**
- `acceptableStatuses` includes `migrated-v2` in addition to existing `valid`, `legacy`, `migrated-v1`, and `future-version`.
- A valid schema-v2 primary or backup may load and then be rewritten as schema 3.
- A tampered schema-v2 primary/backup is never promoted into backup history.

- [ ] **Step 1: In the test file, add the same local v2 integrity helper and RED cases:** valid v2 primary loads with V3 defaults; corrupt primary falls through to valid v2 backup; tampered v2 backup is skipped; after `writeResilientSave`, new primary parses as schema 3 and previous valid generation remains in backup history.
- [ ] **Step 2: Run `npx vitest run src/save-resilience.test.ts`; expect RED because `migrated-v2` is not currently accepted.**
- [ ] **Step 3: Add only `migrated-v2` to the accepted status set.** Do not alter storage keys, generation count, ordering, or recovery semantics.
- [ ] **Step 4: Run `npx vitest run src/save-schema.test.ts src/save-resilience.test.ts`; expect PASS.**
- [ ] **Step 5: Run `npx tsc -b`; expect exit 0, then commit `fix(v3): preserve backup recovery across v2 migration`.**

---

### Task 8: Foundation Gate — Full Regression, Build, and Branch Handoff

**Files:**
- No planned production-code changes. If verification exposes a defect, add a focused regression test beside the owning module and fix only that defect before rerunning the entire gate.

**Interfaces:**
- Produces a GREEN `integration/v3` Foundation checkpoint that Rooms 01–05 can branch from in Wave 2.

- [ ] **Step 1: Run all new Foundation-focused tests together.**

Run:

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

Run:

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

Expected: all PASS. `src/game/save.ts` remains version 3, `src/game/world-save.ts` remains version 7, existing World NEW_RUN semantics remain GREEN, and top-level V3 NEW_RUN is still inert.

- [ ] **Step 3: Run the complete test suite.**

Run: `npm test`

Expected: all existing and new suites PASS; no regression in the previous 1079-test V2 baseline plus newly added Foundation tests.

- [ ] **Step 4: Run strict TypeScript separately.**

Run: `npx tsc -b`

Expected: exit 0.

- [ ] **Step 5: Run production build.**

Run: `npm run build`

Expected: TypeScript + Vite build completes successfully.

- [ ] **Step 6: Verify the critical behavioral contracts with targeted regression suites.** Confirm the normal monthly core-loop tests, Tactical stability/save tests, Season save/reset tests, World save tests, and Raising save/hydration tests remain GREEN. If exact suite names have changed since the approved baseline, select existing tests by domain rather than weakening the gate.

- [ ] **Step 7: Inspect the branch diff.** Expected Foundation production changes are limited to the new state modules/tests plus `src/game.ts`, `src/save-schema.ts`, `src/save-resilience.ts`, and the two compatibility save tests. There must be no UI/CSS/App/Root/vercel changes and no V2/main/prod changes.

- [ ] **Step 8: Commit any verification-only regression test/fix as its own focused commit, then push `integration/v3`.** Do not merge to `main` or deploy production.

- [ ] **Step 9: Record the exact remote `integration/v3` SHA and report Foundation Gate evidence:** focused counts, full test count, TypeScript GREEN, build GREEN, V2→V3 valid migration GREEN, tampered-v2 rejection GREEN, backup recovery GREEN, load/save/load idempotency GREEN, and NEW_RUN still inert at the top-level reducer.

## Foundation Completion Contract

Foundation is complete only when all of the following are true:

1. Every fresh or legacy-hydrated `GameState` contains canonical `campaignRun`, `worldHistory`, `characterBonds`, and `legacy` slices.
2. No V3 slice changes current gameplay outcomes when left at defaults.
3. All malformed V3 nested values sanitize deterministically and idempotently.
4. The active save envelope writes schema 3.
5. Valid schema 2 loads as `migrated-v2`; tampered or missing-integrity schema 2 is rejected as `integrity-failed`.
6. Resilient backups accept valid migrated-v2 data but never preserve corrupted v2 generations.
7. Existing secondary `src/game/save.ts` version 3 and `src/game/world-save.ts` version 7 remain unchanged and round-trip the new fields through `hydrateGameState`.
8. Existing `BondScene` behavior is unchanged and separate from `characterBonds`.
9. Top-level `NEW_RUN` remains a no-op; active NG+ transition is reserved for Wave 6.
10. Full tests, strict TypeScript, and production build are GREEN on the exact `integration/v3` SHA.

## Self-Review

- **Spec coverage:** This plan implements only Master Spec Wave 1/Foundation: persistent contracts, nested hydration, Save Schema V3, resilient migration, and a non-active NEW_RUN boundary. Spring affinity/Path Convergence begins in the next plan.
- **Placeholder scan:** No TBD, TODO, “similar to”, or unspecified validation steps remain. Content registries intentionally contain only IDs explicitly required by the approved design; later waves extend those registries through their own tests.
- **Type consistency:** `CampaignId`, `CampaignRoute`, `CharacterId`, World Facts, True Clues, Major Choice IDs/options, and outcome types originate from one stable model or owning domain module and are consumed by later slices. Character Memory refs validate against the Character Bond registry.
- **Save safety:** The plan explicitly closes the schema-v2 integrity-migration hazard before `migrated-v2` becomes acceptable to resilient recovery. V1 remains the only pre-integrity migration path.
- **Behavioral isolation:** No gameplay adapters, UI, campaign effects, reward application, ending logic, or actual NG+ reducer transition are introduced. The Foundation Gate therefore has a strong invariant: default V3 state is behaviorally inert.
