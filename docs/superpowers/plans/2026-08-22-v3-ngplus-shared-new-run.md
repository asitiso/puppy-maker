# V3 NG+ Shared NEW_RUN Runtime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `game.ts` `NEW_RUN` the authoritative exactly-once NG+ transition from a committed Winter ending into a clean Spring replay while preserving Legacy echoes and Tactical preferences only.

**Architecture:** Reuse the already-GREEN 03 `prepareNewPossibilityV3State` transition for eligibility/runNumber/Legacy/current-vs-inherited state and the 04 `resetTacticalForNgPlus` contract for Tactical reset semantics. Build the new run from `initialState`, then overlay transition-owned V3 persistence and Tactical AUTO/speed preferences. Do not add a save schema version or duplicate Winter archive logic.

**Tech Stack:** TypeScript, Vitest, React/Vite project build (`tsc -b && vite build`), GitHub Actions CI.

**Spec:** `docs/superpowers/specs/2026-08-22-v3-ngplus-shared-new-run-design.md`

## Global Constraints

- Authoritative baseline remains `integration/v3@ff6a8fe55b1b2df5d8cf1434bb9b607af4bda264` until the final NG+ gate.
- `integration/v3` must not move during Macro development.
- No force push, no `main`, no production deployment.
- Winter `commitWinterEnding` remains the only completed-run archive authority.
- Fifth Path campaign content and Hollow remain out of scope.
- No schema bump unless schema-v3 demonstrably cannot hydrate the produced state.

---

### Task 1: Reconfirm the existing Macro B RED contract

**Files:**
- Test: `src/v3-ngplus-replay-systems-lane.test.ts`
- Test: `src/v3-ngplus-replay-multicycle.test.ts`
- Read: `src/ngplus-replay.ts`
- Read: `src/tactical-ngplus-reset.ts`

**Interfaces:**
- Consumes: `prepareNewPossibilityV3State(current: V3PersistentState)` and `resetTacticalForNgPlus(state: TacticalNgPlusResetState)`.
- Produces: fixed RED evidence proving only shared `NEW_RUN` wiring is missing.

- [ ] **Step 1: Verify the composed Macro B branch still contains exactly the intended RED assertions.**

The first-run contract must continue asserting:

```ts
const next=reducer(completed,{type:'NEW_RUN'});
expect(next.campaignRun).toMatchObject({
  runNumber:2,
  phase:'spring_exploration',
  activeCampaign:null,
  activeRoute:'normal',
  seasonMilestones:[],
  majorChoices:{},
  majorOutcomes:{},
  failForwardOutcomes:[],
  claimedCampaignRewards:[],
  claimedSeasonalObjectives:[],
});
expect(next.legacy.completedRuns).toBe(1);
expect(next.legacy.runSummaries).toHaveLength(1);
```

The reset contract must continue asserting clean `gold`, `gems`, `stats`, `mastery`, Season/weekly ledgers, Tactical progression, and preserved AUTO/speed.

- [ ] **Step 2: Confirm current RED evidence rather than weakening tests.**

Use the latest CI on `verify/v3-ngplus-replay-systems`. Expected before implementation: only shared-runtime tests fail because `NEW_RUN` currently returns the input state.

- [ ] **Step 3: Freeze 03/04 contracts.**

Do not modify `src/ngplus-replay.ts`, `src/tactical-ngplus-reset.ts`, or their assertions unless the shared implementation exposes a genuine contract defect.

---

### Task 2: Implement the authoritative shared NEW_RUN boundary

**Files:**
- Modify: `src/game.ts`

**Interfaces:**
- Consumes: `prepareNewPossibilityV3State(pickV3PersistentState(state))`.
- Consumes: `resetTacticalForNgPlus(state)`.
- Produces: `reducer(state,{type:'NEW_RUN'})` with exactly-once committed-ending transition semantics.

- [ ] **Step 1: Add the two approved contract imports.**

```ts
import { prepareNewPossibilityV3State } from './ngplus-replay';
import { resetTacticalForNgPlus } from './tactical-ngplus-reset';
```

- [ ] **Step 2: Replace the `NEW_RUN` no-op with eligibility gating.**

```ts
if (action.type === 'NEW_RUN') {
  const transition = prepareNewPossibilityV3State(pickV3PersistentState(state));
  if (!transition.started) return state;

  const tactical = resetTacticalForNgPlus(state);
  return {
    ...initialState,
    ...transition.state,
    tacticalBattleRecords:{...tactical.tacticalBattleRecords},
    claimedTacticalFirstClears:[...tactical.claimedTacticalFirstClears],
    selectedTacticalCompanions:[...tactical.selectedTacticalCompanions],
    tacticalCompanionBonds:{...tactical.tacticalCompanionBonds},
    tacticalAutoBattle:tactical.tacticalAutoBattle,
    tacticalBattleSpeed:tactical.tacticalBattleSpeed,
  } as GameState;
}
if (action.type === 'EVENT_CHOICE') return state;
```

This construction intentionally resets all run-local/base/live-ops/endgame state to `initialState`, then restores only transition-owned V3 state and approved Tactical preferences. Do not copy `state.gold`, `state.stats`, Season history/current ledgers, old Tactical records, event runtime markers, or old top-level ending runtime fields.

- [ ] **Step 3: Keep Winter archive authority unchanged.**

Do not modify `legacy.completedRuns` or `legacy.runSummaries` in `game.ts`; the transition must use the already-archived Legacy state from Winter.

- [ ] **Step 4: Commit the minimal shared production change.**

Commit message:

```text
fix(v3): wire authoritative NG+ NEW_RUN reset
```

The production delta for this task must be `src/game.ts` only.

---

### Task 3: Verify shared wiring against the composed Macro B contracts

**Files:**
- Verify: `src/game.ts`
- Test: `src/v3-ngplus-replay-systems-lane.test.ts`
- Test: `src/v3-ngplus-replay-multicycle.test.ts`
- Test: `src/ngplus-replay.test.ts`
- Test: `src/tactical-ngplus-reset.test.ts`

**Interfaces:**
- Consumes: Task 2 `NEW_RUN` behavior.
- Produces: exact GREEN Macro B head suitable for final NG+ composition.

- [ ] **Step 1: Run the focused shared/Macro B tests.**

Run the equivalent of:

```bash
npx vitest run src/v3-ngplus-replay-systems-lane.test.ts src/v3-ngplus-replay-multicycle.test.ts src/ngplus-replay.test.ts src/ngplus-replay-stale-unlock.test.ts src/tactical-ngplus-reset.test.ts
```

Expected: all GREEN; first `NEW_RUN` increments once, repeat is no-op, three cycles remain stable.

- [ ] **Step 2: Run the full suite.**

```bash
npm run test
```

Expected: all test files/tests GREEN, including Tactical stability and existing save/malformed suites.

- [ ] **Step 3: Run TypeScript + production build.**

```bash
npm run build
```

Expected: `tsc -b` and `vite build` GREEN.

- [ ] **Step 4: Verify no unintended file drift.**

Compare the shared production commit and confirm no `App`, `Root`, save schema, `main`, or deployment file changed.

---

### Task 4: Complete Macro B handoff

**Files:**
- Branch: `verify/v3-ngplus-replay-systems`
- Tracking: issue #143

**Interfaces:**
- Consumes: exact GREEN 03 state transition, 04 Tactical reset, and Task 2 shared runtime wiring.
- Produces: one exact GREEN Macro B head for #144.

- [ ] **Step 1: Compose only the shared runtime delta into Macro B verify.**

Keep the existing exact 03 and 04 content unchanged. Do not rebuild room candidates.

- [ ] **Step 2: Rerun focused Macro B + full test + build on the PR merge ref.**

Expected: Macro B authoritative transition, three-cycle stability, save/reload, Tactical reset, and stale unlock sanitation all GREEN.

- [ ] **Step 3: Record exact head SHA and CI evidence on #143.**

Include test counts, build result, exact `game.ts` shared commit, and confirmation that `integration/v3` stayed frozen.

---

### Task 5: Build the final NG+ Macro A+B composite

**Files:**
- Branch: `verify/v3-ngplus-composite`
- Tracking: issue #144

**Interfaces:**
- Consumes: Macro A exact GREEN `08e4203fee078870ad677358e40129f31df7a5a7` and the exact GREEN Macro B head from Task 4.
- Produces: final tested NG+ tree eligible for the single integration promotion.

- [ ] **Step 1: Fresh-verify Macro A and Macro B CI/head status.**

Reject any moved or non-GREEN head.

- [ ] **Step 2: Audit diffs/overlap before composition.**

Only resolve real cross-macro/shared conflicts. Do not reconstruct 01–05 candidates individually.

- [ ] **Step 3: Compose exact Macro A then exact Macro B heads on `verify/v3-ngplus-composite`.**

Keep `integration/v3` frozen.

- [ ] **Step 4: Add final cross-macro replay E2E only if existing Macro suites do not already cover the complete path.**

The final path must prove:

```text
completed Winter ending
-> NEW_RUN exactly once
-> clean Spring
-> inherited World/relationship echoes separate from current state
-> ordinary Spring affinity/play
-> Path Convergence with >=2 normal campaigns
-> optional additive fifth_path_candidate hook only when canonically eligible
-> save/reload
-> >=3 NG+ cycles without archive duplication or raw-power inflation
```

- [ ] **Step 5: Run final full gate.**

Require full tests, malformed/save idempotency, Tactical stability/AUTO stress, Season reset ledgers, mobile 360/390/430/accessibility, `tsc -b`, and production build GREEN.

---

### Task 6: Promote the verified NG+ tree exactly once

**Files:**
- Branch: `integration/v3`
- Tracking: #54 and #144

**Interfaces:**
- Consumes: exact tested final composite tree.
- Produces: new authoritative V3 NG+ checkpoint.

- [ ] **Step 1: Fresh-freeze-check `integration/v3` still equals `ff6a8fe55b1b2df5d8cf1434bb9b607af4bda264`.**

If it moved unexpectedly, stop promotion and re-audit.

- [ ] **Step 2: Create a provenance promotion commit with parents old integration + verified NG+ head and the exact tested tree.**

- [ ] **Step 3: Advance `integration/v3` once with `force:false`.**

- [ ] **Step 4: Verify promoted integration has zero file differences from the tested head.**

- [ ] **Step 5: Update #54/#144 with exact SHA/tree/CI evidence and mark NG+ COMPLETE.**

Keep Fifth Path and all later Waves CLOSED until explicitly opened.
