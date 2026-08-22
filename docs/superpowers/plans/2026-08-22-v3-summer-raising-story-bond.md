# V3 Summer Raising Story + Bond Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the four Campaign-specific Summer story identities and once-only Character Bond consequences, then expose a presentation-ready DTO for room 05.

**Architecture:** Add one pure `summer-campaign-story.ts` domain module backed by Campaign registry data. It consumes the existing `activeCampaign`, authoritative Guardian Festival `MajorOutcomeResult`, and `CharacterBondsState`; it never owns combat/world outcome selection or shared persistence wiring. Stable Summer Bond ids are registered in `character-bonds.ts`.

**Tech Stack:** TypeScript, Vitest, existing V3 campaign/Character Bond domain types.

**Spec:** `docs/superpowers/specs/2026-08-22-v3-summer-raising-story-bond-design.md`

## Global Constraints
- Authoritative base: `integration/v3@9d5f6b711a806fd04af1497fb723d205019cfe92`.
- Work branch: `work/v3-summer-raising`.
- Do not modify shared `src/game.ts`, save schema/resilience, `App.tsx`, or `Root.tsx`.
- Do not merge to `integration/v3`, `main`, or production.
- Do not open Autumn.
- 05 receives presentation-ready values only; no raw campaign affinity or numeric trust.

---

### Task 1: Campaign chapter registry and invalid-campaign guard

**Files:**
- Create: `src/summer-campaign-story.test.ts`
- Create: `src/summer-campaign-story.ts`

**Interfaces:**
- Consumes: `MainCampaignId`, `CharacterId`, `MajorOutcomeResult` from `campaign-model.ts`.
- Produces: `summerCampaignStoryDefinition(campaign)` and `SummerCampaignStoryDefinition`.

- [ ] **Step 1: Write the failing test**

```ts
it('defines distinct Summer identities for all four main campaigns',()=>{
  expect(summerCampaignStoryDefinition('caretaker')).toMatchObject({character:'mira'});
  expect(summerCampaignStoryDefinition('pathfinder')).toMatchObject({character:'kael'});
  expect(summerCampaignStoryDefinition('vanguard')).toMatchObject({character:'rex'});
  expect(summerCampaignStoryDefinition('arcanist')).toMatchObject({character:'selene'});
  expect(new Set(mainCampaignIds.map(id=>summerCampaignStoryDefinition(id)?.chapterId)).size).toBe(4);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/summer-campaign-story.test.ts`
Expected: FAIL because `./summer-campaign-story` does not exist.

- [ ] **Step 3: Write minimal implementation**

Create a readonly registry with stable chapter ids, title/objective keys, representative character, and pre-festival beat keys for the four campaigns. Return `null` for malformed/non-main campaign input.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/summer-campaign-story.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

Commit message: `feat(v3): define Summer campaign story identities`

### Task 2: Guardian Festival outcome interpretation and fail-forward

**Files:**
- Modify: `src/summer-campaign-story.test.ts`
- Modify: `src/summer-campaign-story.ts`

**Interfaces:**
- Produces: `resolveSummerCampaignStory(activeCampaign, outcome)` returning resolved/unresolved story result with stable outcome beat, relationship summary, and next-action key.

- [ ] **Step 1: Write the failing tests**

Cover all four `MajorOutcomeResult` values for at least one Campaign, then table-drive all four campaigns. Assert `costly_victory` and `defeat` are resolved fail-forward states rather than blockers. Invalid outcome remains unresolved.

- [ ] **Step 2: Run targeted test and verify RED**

Run: `npx vitest run src/summer-campaign-story.test.ts`
Expected: FAIL because the resolver is missing.

- [ ] **Step 3: Implement minimal resolver**

Map authoritative outcomes to Campaign-specific beat/memory/consequence definitions. Never calculate or replace the World/Tactical outcome.

- [ ] **Step 4: Run targeted test and verify GREEN**

Run: `npx vitest run src/summer-campaign-story.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

Commit message: `feat(v3): resolve Summer festival story outcomes`

### Task 3: Stable Character Bond ids and once-only consequence

**Files:**
- Modify: `src/character-bonds.ts`
- Modify: `src/summer-campaign-story.test.ts`
- Modify: `src/summer-campaign-story.ts`

**Interfaces:**
- Consumes: `CharacterBondsState`.
- Produces: `applySummerStoryBondConsequence(bonds, result)` returning `{ bonds, applied }`.

- [ ] **Step 1: Write failing tests**

For each representative character, resolve a Summer result and assert the corresponding Memory is added once. Reapply the same result and assert reference/value stability: no trust increment, duplicate Memory, duplicate Promise, or duplicate Conflict.

- [ ] **Step 2: Run targeted test and verify RED**

Run: `npx vitest run src/summer-campaign-story.test.ts`
Expected: FAIL because Summer Bond ids/consequence API are absent.

- [ ] **Step 3: Register ids and implement minimal mutation**

Add only stable Summer ids for Mira/Kael/Rex/Selene to `characterBondIdRegistry`. Apply nonnegative fixed trust deltas and deduped arrays. `defeat` still creates a fail-forward Memory/Conflict; it does not subtract trust.

- [ ] **Step 4: Run targeted + Character Bond tests**

Run: `npx vitest run src/summer-campaign-story.test.ts src/character-bonds.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

Commit message: `feat(v3): apply Summer Character Bond consequences`

### Task 4: 05 presentation-ready selector contract

**Files:**
- Modify: `src/summer-campaign-story.test.ts`
- Modify: `src/summer-campaign-story.ts`

**Interfaces:**
- Produces: `summerCampaignStoryPresentation(activeCampaign, outcome, bonds)` returning only presentation-ready qualitative fields.

- [ ] **Step 1: Write failing contract test**

Assert the DTO contains campaign, chapter/title/objective, character, status, outcome key, beat keys, qualitative relationship change, Memory/Promise/Conflict ids, and next-action key. Assert serialized output does not contain `campaignAffinities`, `affinity`, `trust`, `score`, or a numeric trust field.

- [ ] **Step 2: Run targeted test and verify RED**

Run: `npx vitest run src/summer-campaign-story.test.ts`
Expected: FAIL because the selector is missing.

- [ ] **Step 3: Implement minimal selector**

Derive qualitative relationship text/key from the resolved Campaign/outcome contract rather than exposing numeric trust. Preserve unresolved state for invalid/missing authoritative outcome.

- [ ] **Step 4: Run targeted test and verify GREEN**

Run: `npx vitest run src/summer-campaign-story.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

Commit message: `feat(v3): expose Summer story UI contract`

### Task 5: Malformed/hydration retention and independent candidate gate

**Files:**
- Modify: `src/summer-campaign-story.test.ts`

**Interfaces:**
- Verifies stable Summer ids survive `hydrateCharacterBondsState` and stale ids are removed by the existing registry sanitizer.

- [ ] **Step 1: Add malformed/hydration tests**

Test invalid campaign, invalid outcome, duplicate/stale Bond ids, and hydration retention of valid Summer ids.

- [ ] **Step 2: Run targeted Summer/Raising/Bond tests**

Run: `npx vitest run src/summer-campaign-story.test.ts src/character-bonds.test.ts src/spring-raising.test.ts`
Expected: PASS.

- [ ] **Step 3: Run full verification**

Run: `npm run test`
Expected: all test files/tests PASS.

Run: `npx tsc -b`
Expected: exit 0.

Run: `npm run build`
Expected: `tsc -b && vite build` exits 0.

- [ ] **Step 4: Compare isolation**

Confirm exact baseline diff contains only the two docs plus `src/summer-campaign-story.ts`, `src/summer-campaign-story.test.ts`, and `src/character-bonds.ts`. No forbidden shared files.

- [ ] **Step 5: Push candidate / Draft PR / 05 handoff**

Open/update Draft PR against `integration/v3`. Include exact candidate SHA, RED evidence, targeted/full counts, typecheck/build, file list, and `[05 Handoff]` describing the presentation selector contract. Add the same frozen SHA/contract to Lane A issue #88 or the active 05 Summer PR.
