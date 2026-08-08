# Guardian Expedition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persistent 3-region, 9-stage Guardian Expedition expansion with battle scoring, boss trials, expedition relics, crafting, story/discoveries, guardian evolution, dedicated UI, and a 100-slot Growth Archive while preserving the existing monthly raising loop and legacy saves.

**Architecture:** Keep expedition domain rules in focused pure modules and let `src/game.ts` own only persistence/reducer integration. Expedition battle UI reuses the existing attack/dodge/charge interaction language, while permanent results are committed only on finish. The existing explicit Root/Home callback bridge is extended for navigation; no DOM-query bridge or new state framework is introduced.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, existing localStorage save key `puppy-maker-save`, existing image assets only.

## Global Constraints

- Preserve hub → schedule → training → dialogue → result → next month.
- Existing save key remains `puppy-maker-save`.
- No new external libraries, global state framework, event bus, or state machine.
- Decorative game art must use image assets. CSS is layout/text/progress/interaction only.
- New region/boss/evolution artwork is out of this implementation pass.
- Main/PR merge is out of scope.
- Expedition actions must not mutate unrelated monthly/yearly systems except explicitly specified rewards.
- TDD for every subsystem; every task ends with full `npm run test` and `npm run build` before moving on.

---

### Task 1: Expedition World Model and Unlock Progression

**Files:**
- Create: `src/expedition-regions.ts`
- Create: `src/expedition-regions.test.ts`

**Interfaces:**
- Produces `ExpeditionRegionId`, `ExpeditionStageId`, `ExpeditionStageRecord`, `expeditionRegionDefinitions`, `expeditionStageDefinitions`, `emptyExpeditionRecords()`, `expeditionGrade(score,target)`, `isExpeditionStageCleared(record)`, `isExpeditionStageUnlocked(stageId, records)`, `nextExpeditionStage(records)`.

- [ ] Write failing tests for exactly 3 regions/9 stages, sequential unlock order, B-or-better clear, grade thresholds S=120%, A=100%, B=80%, and best-record semantics.
- [ ] Run `npm run test -- src/expedition-regions.test.ts` and confirm RED because the module is absent.
- [ ] Implement the data model and pure unlock/grade helpers. Region 2 requires forest boss clear; region 3 requires city boss clear.
- [ ] Run the focused test and confirm GREEN.
- [ ] Run full tests/build and commit `feat: add expedition world progression`.

### Task 2: Expedition Combat and Boss Trials

**Files:**
- Create: `src/expedition-combat.ts`
- Create: `src/expedition-combat.test.ts`
- Create: `src/expedition-bosses.ts`
- Create: `src/expedition-bosses.test.ts`

**Interfaces:**
- Consumes current stats, condition, mastery levels, advanced talent IDs, equipped relic modifier summary.
- Produces `ExpeditionActionKind = 'attack'|'dodge'|'charge'`, `ExpeditionBattleState`, `startExpeditionBattle(stageId)`, `applyExpeditionAction(...)`, `finishExpeditionBattle(...)`, `bossReward(stageId)`.

- [ ] Write RED tests proving attack scales with strength/hunt mastery, charge with magic/magic mastery, dodge with calmness/rest mastery, tired/fatigue reduces output, and relic multipliers are additive/bounded.
- [ ] Add boss tests for higher target/pressure, prerequisite enforcement, and reward table forest 500G+2 gems, city 700G+3, lakes 1000G+5.
- [ ] Implement deterministic battle calculations without `Math.random()` inside domain functions. Action quality is an explicit `accuracy: number` input clamped to 0..1.
- [ ] Ensure stage pressure applies result stress/fatigue deltas without altering unrelated permanent stats.
- [ ] Run focused/full tests/build and commit `feat: add expedition combat and boss trials`.

### Task 3: Persistent Expedition GameState, Hydration, and Reducer

**Files:**
- Create: `src/expedition-progression.test.ts`
- Modify: `src/game.ts`

**Interfaces:**
- Extend `GameState` with `expeditionRecords`, `expeditionMaterials`, `ownedExpeditionRelics`, `equippedExpeditionRelics`, `rewardedExpeditionStages`, `rewardedExpeditionRegions`, `expeditionDiscoveries`, `expeditionStoryEntries`, `craftingMilestones`.
- Extend `Screen` with `expedition` and `expedition_battle` if screen routing is held in the core type; otherwise expose equivalent explicit UI mode without breaking existing screen values.
- Add actions `START_EXPEDITION_STAGE`, `EXPEDITION_ACTION`, `FINISH_EXPEDITION_STAGE`, `EQUIP_EXPEDITION_RELIC`, `UNEQUIP_EXPEDITION_RELIC`, `CRAFT_EXPEDITION_RECIPE`.

- [ ] Write RED tests for legacy hydration defaults, enum sanitization, nonnegative materials, unique owned arrays, equipped relics limited to three owned unique IDs, and RESET/NEXT_MONTH preservation rules.
- [ ] Add reducer tests that stage outcomes persist only on FINISH and worse replays never replace best score/grade.
- [ ] Implement hydration helpers and reducer branches while preserving every pre-existing extended field.
- [ ] Verify expedition actions do not mutate monthlyCounters, yearlyAmbitions, attendance, mail, annualRecords, or legacy fields.
- [ ] Run full tests/build and commit `feat: persist expedition progression safely`.

### Task 4: Expedition Relics, Materials, Crafting, and Economy

**Files:**
- Create: `src/expedition-relics.ts`
- Create: `src/expedition-relics.test.ts`
- Create: `src/expedition-crafting.ts`
- Create: `src/expedition-crafting.test.ts`
- Extend: `src/expedition-progression.test.ts`
- Modify: `src/game.ts`

**Interfaces:**
- `ExpeditionRelicId`: `moonfang_charm`, `mana_prism`, `wind_feather`, `guardian_thread`, `explorer_compass`, `bond_locket`.
- `ExpeditionMaterialId`: `star_bark`, `arcane_shard`, `wind_pearl`.
- Produce `relicModifiers(equipped)`, `craftingRecipes`, `canCraft(recipeId, materials)`, `applyCrafting(...)`.

- [ ] RED tests for unique equip, 3-slot cap, unequip, attack +6%, charge +6%, dodge +8%, all score +3%, explorer compass +1 material, and bond locket +2 affection on first clear only.
- [ ] RED tests for stage material rewards 1/B-A, 2/S, compass +1, deterministic recipes, and no negative resources.
- [ ] Implement relic/crafting pure rules then reducer integration.
- [ ] Implement one-time normal first-clear 150G; boss rewards from Task 2; replay gives materials only.
- [ ] Implement region completion relics forest moonfang, city mana prism, lakes wind feather; full 9-stage clear gives 5 gems + explorer compass exactly once.
- [ ] Run full tests/build and commit `feat: add expedition relics crafting and rewards`.

### Task 5: Expedition Story, Discoveries, and Completion Milestones

**Files:**
- Create: `src/expedition-story.ts`
- Create: `src/expedition-story.test.ts`
- Create: `src/expedition-discoveries.ts`
- Create: `src/expedition-discoveries.test.ts`
- Modify: `src/game.ts`

**Interfaces:**
- Nine story entries map one-to-one to stage IDs.
- Nine discovery IDs map one-to-one to stage IDs.
- Produce `storyEntryForStage`, `discoveryForStage`, `eligibleExpeditionDiscovery(stageId, grade, owned)`.

- [ ] RED tests: first B clear unlocks story; discovery requires first A-or-better; B then A replay unlocks discovery; duplicate clears never duplicate either list.
- [ ] Add boss chapter summaries and region completion milestone helpers.
- [ ] Integrate into FINISH result so first-clear/story/discovery/reward metadata is returned for UI without requiring extra persisted transient objects.
- [ ] Run full tests/build and commit `feat: add expedition stories and discoveries`.

### Task 6: Guardian Evolution

**Files:**
- Create: `src/guardian-evolution.ts`
- Create: `src/guardian-evolution.test.ts`

**Interfaces:**
- Produce `GuardianEvolutionId = 'apprentice'|'guardian'|'star_guardian'|'legendary_guardian'`, `guardianEvolution(input)`, `guardianEvolutionDefinitions`.
- Inputs: guardian rank, boss clears, all-stage S clear, archive current/total, guardian legacy tier.

- [ ] RED tests for apprentice default, guardian at guardian rank, star guardian only when all 3 bosses + archive>=75, legendary only when all 9 S + archive=100 + top legacy.
- [ ] Implement pure derivation with no new XP/save field.
- [ ] Run full tests/build and commit `feat: derive guardian expedition evolution`.

### Task 7: Dedicated Expedition UI and Explicit Navigation

**Files:**
- Create: `src/ExpeditionScreen.tsx`
- Create: `src/ExpeditionBattleScreen.tsx`
- Create: `src/expedition-ui.css`
- Modify: `src/Root.tsx`
- Modify: `src/App.tsx`
- Modify: `src/LayeredHome.tsx`
- Modify: `src/home-panels.ts` if `expedition` needs a menu ID

**Interfaces:**
- Home exposes explicit Expedition navigation through the existing callback bridge; no querySelector/MutationObserver/fake-click bridge.
- ExpeditionScreen receives `state`, `onStartStage`, `onEquip`, `onUnequip`, `onCraft`, `onBack`.
- ExpeditionBattleScreen receives current battle state/actions through App/reducer callbacks.

- [ ] Add pure/UI-facing tests where practical for region summaries and stage lock labels before component wiring.
- [ ] Home summary displays unlocked region, cleared `n/9`, boss badges `n/3`, recommended next stage.
- [ ] Expedition screen displays region selector, three stage cards, clear/grade/best score, locks, relics, materials, and crafting controls.
- [ ] Battle screen reuses existing training-ready Runa art/effects and attack/dodge/charge action language. No CSS boss/region illustration substitutes.
- [ ] Result panel shows score, grade, first clear, material, discovery, relic/badge, story unlock.
- [ ] Run full tests/build and commit `feat: make guardian expedition playable`.

### Task 8: Existing Story Archive + 100-Slot Growth Archive Integration

**Files:**
- Modify: `src/CollectionArchiveOverlay.tsx`
- Modify: `src/collection-archive.ts`
- Modify: `src/collection-archive.test.ts`
- Modify: `src/collection-archive-rank.ts`
- Modify: `src/collection-archive-rank.test.ts`
- Modify: `src/collection-archive-recommendation.ts`
- Modify: `src/collection-archive-recommendation.test.ts`
- Modify: `src/collection-archive-route.ts`
- Modify: `src/collection-archive-route.test.ts`
- Modify: `src/LayeredHome.tsx`

**Interfaces:**
- Existing 50 slots stay semantically unchanged.
- Add exactly 50 expedition slots: stage records 9, boss badges 3, relics 6, story 9, discoveries 9, evolution 4, crafting milestones 4, region complete 3, S-grade milestones 3.
- Add archive ranks 75 `원정 기록관`, 100 `수호 연대기의 완성자`.

- [ ] RED tests asserting total exactly 100, prior 50 counts unchanged, all new category totals exact, and rank thresholds 75/100.
- [ ] RED recommendation test where expedition has lowest completion ratio and returns action `expedition`; route test maps it to explicit expedition navigation.
- [ ] Extend story archive to show expedition story entries without creating a new permanent story nav tab.
- [ ] Update archive UI labels/progress and Guardian Evolution display.
- [ ] Run full tests/build and commit `feat: expand growth archive with expedition records`.

### Task 9: Full Regression, PR/Vercel Verification, and Delivery Check

**Files:**
- Extend existing regression tests only if a discovered bug needs a lock.
- No merge files/actions.

**Interfaces:**
- Final branch stays `feat/v2-core-growth`; PR #2 stays Draft/Open/unmerged.

- [ ] Run full `npm run test`; expected all suites pass.
- [ ] Run `npm run build`; expected TypeScript + Vite build success.
- [ ] Verify old monthly flow hub → schedule → training → dialogue → result → next month → hub remains covered and green.
- [ ] Verify a full expedition flow: locked stage → clear stage 1 → unlock stage 2 → boss clear → next region unlock → material/relic/story/discovery persistence.
- [ ] Verify hydration of a pre-expedition save yields safe expedition defaults without losing old fields.
- [ ] Check GitHub Actions for exact HEAD success.
- [ ] Check Vercel deployment for exact HEAD state `READY` and branch alias.
- [ ] Confirm PR #2 remains Draft/Open/unmerged.
- [ ] Document any visual verification limitation caused by preview authentication instead of claiming it was tested.

## Self-Review

- Spec coverage: all 16 design sections are mapped to Tasks 1–9; dedicated art pass is intentionally excluded per spec non-goal.
- Placeholder scan: no TBD/TODO/implementation-later placeholders.
- Type consistency: all persistent IDs originate in domain modules and are consumed by `game.ts`; archive totals sum to 100 exactly.
- Risk check: expedition battle transient state is kept out of permanent save except safe routing/result metadata; existing monthly/yearly systems are protected by reducer regression tests.
