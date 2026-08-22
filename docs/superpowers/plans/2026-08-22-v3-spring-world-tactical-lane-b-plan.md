# V3 Spring World + Tactical Lane B Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Compose the independently GREEN Spring World and Tactical candidates into one verified World Objective → Tactical battle → terminal handoff → World/fail-forward vertical slice.

**Architecture:** Add a pure Lane B adapter between existing `CampaignWorldObjectiveDefinition` and `CampaignEncounterDefinition`, then reuse the existing Tactical scenario/battle/result/handoff functions and existing Guardian Festival World resolver. No new engine or shared state wiring is introduced.

**Tech Stack:** TypeScript, Vitest, existing Tactical 3v3 engine, GitHub Actions (`npm run test`, `npm run build` where build runs `tsc -b && vite build`).

**Spec:** `docs/superpowers/specs/2026-08-22-v3-spring-world-tactical-lane-b-design.md`

## Global Constraints
- baseline: `integration/v3@46faf9031a86ff09d92cc17ee043e9180414d510`
- World candidate: `f458abfb1ab6733024b00178e11a28d227801e35`
- Tactical candidate: `516f3e6b268f1ff4913868d11e7195b678e88b10`
- verify branch: `verify/v3-spring-world-tactical`
- no App/Root/shared game/save/main/vercel edits
- no new Tactical engine
- no direct integration/v3 or main/prod merge

---

### Task 1: Lane adapter contract

**Files:**
- Create: `src/spring-world-tactical-lane.test.ts`
- Create after RED: `src/spring-world-tactical-lane.ts`

**Interfaces:**
- Consumes: `CampaignWorldObjectiveDefinition`, `CampaignEncounterDefinition`, `TacticalScenario`, existing Tactical scenario helpers, existing Guardian Festival resolver.
- Produces: `worldObjectiveToTacticalEncounter`, `worldObjectiveToTacticalScenario`, `mapTacticalResultToGuardianFestivalOutcome`.

- [ ] **Step 1: Write the failing test**

Test all four Spring World objective kinds and assert the adapter uses each objective's first existing `stageId`, preserves campaign identity, emits the specified Tactical objective shape, and uses only campaign-matching existing modifier vocabulary.

- [ ] **Step 2: Run test to verify it fails**

Run via PR CI: `npx vitest run src/spring-world-tactical-lane.test.ts` equivalent through repository `npm run test`.
Expected: FAIL because `./spring-world-tactical-lane` does not exist.

- [ ] **Step 3: Write minimal implementation**

Implement only the four fixed mappings from the approved design. Delegate scenario compilation to `campaignEncounterToTacticalScenario`; do not duplicate Tactical validation or battle construction.

- [ ] **Step 4: Run test to verify it passes**

Expected: Lane adapter assertions pass and existing candidate tests remain GREEN.

- [ ] **Step 5: Commit**

Commit test and minimal adapter separately to preserve RED→GREEN evidence.

---

### Task 2: Connected terminal outcome E2E

**Files:**
- Modify: `src/spring-world-tactical-lane.test.ts`
- Modify only if RED demands it: `src/spring-world-tactical-lane.ts`

**Interfaces:**
- Consumes: `createTacticalScenarioBattle`, `resolveTacticalScenarioResult`, `createTacticalTerminalHandoffState`, `handoffTacticalTerminalResult`, `resolveGuardianFestivalWorldOutcome`.
- Produces: evidence that World state changes only after a non-null once-only Tactical handoff.

- [ ] **Step 1: Write the failing E2E test**

Create a real scenario and existing 3v3 battle session, force a deterministic terminal session by updating only battle-unit HP in test setup, resolve the scenario result, hand it off, map it to Guardian Festival outcome, and assert canonical current World Fact/fail-forward evidence while inherited facts remain unchanged.

Also replay the same terminal result through the updated handoff state and assert the second handoff is null and no second World application occurs.

- [ ] **Step 2: Run test to verify it fails for the missing lane result mapping/flow**

Expected: FAIL only on missing lane composition behavior, not on candidate imports.

- [ ] **Step 3: Implement the minimal lane result mapping**

Map:
- success + victory → `victory`
- success + non-victory → `costly_victory`
- failure → `defeat`

Return the mapped value only; let `resolveGuardianFestivalWorldOutcome` remain authoritative for World mutation/reconciliation.

- [ ] **Step 4: Re-run lane tests**

Expected: E2E success/fail-forward/once-only assertions GREEN.

- [ ] **Step 5: Commit**

Commit E2E RED then minimal GREEN separately.

---

### Task 3: Bond Intervention boundary

**Files:**
- Modify: `src/spring-world-tactical-lane.test.ts`
- Modify only if needed: `src/spring-world-tactical-lane.ts`

**Interfaces:**
- Consumes: `invokeTacticalBondIntervention` and existing Mira/Kael/Rex/Selene hook contract.
- Produces: proof Lane B can invoke the hook without importing or mutating CharacterBondState.

- [ ] **Step 1: Add test using a real hook callback**

Capture the request, return a valid response, and assert only `scenarioId`, `campaign`, `characterId`, and `timing` are passed. Assert source World state object is unchanged.

- [ ] **Step 2: Run tests**

Expected: GREEN using the existing Tactical hook; no new production code unless a lane wrapper is necessary.

- [ ] **Step 3: Commit**

Commit only the evidence needed for the lane contract.

---

### Task 4: Regression and release gate

**Files:**
- No production changes expected.
- Update issue/PR metadata only after verification.

**Interfaces:**
- Consumes: the completed verify branch.
- Produces: Lane B candidate SHA and CI evidence.

- [ ] **Step 1: Verify Tactical stability**

Require `src/tactical-stability.test.ts` GREEN, including the named 10/50/100 AUTO checkpoint case.

- [ ] **Step 2: Verify full suite**

Run repository `npm run test`; require zero failures.

- [ ] **Step 3: Verify TypeScript and production build**

Run repository `npm run build`; require `tsc -b` and Vite production build success.

- [ ] **Step 4: Record candidate**

Update Lane B issue #75 and the lane Draft PR with World/Tactical input SHAs, final verify SHA, targeted E2E evidence, stress evidence, full test count, TypeScript/build result, and guardrails.

- [ ] **Step 5: Stop before integration**

Do not merge `verify/v3-spring-world-tactical` into `integration/v3`, main, or production.
