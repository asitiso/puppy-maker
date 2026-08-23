# V3 Fifth Path Systems Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Macro B #158 end-to-end: canonical Fifth eligibility -> explicit `true_path` commit -> Summer/Autumn/Winter systems -> fail-forward outcome/reward/ending persistence -> save/reload -> clean NG+ restart.

**Architecture:** Extend the existing V3 CampaignRun/Legacy/WorldHistory/CharacterBond persistence model instead of creating a parallel campaign save. Put pure Fifth-path rules in focused modules and keep `game.ts` as the authoritative action/wiring boundary. Reuse existing Tactical scenario semantics and the existing dedicated seasonal-objective ledger; all irreversible results are once-only and hydrated through canonical registries.

**Tech Stack:** TypeScript, Vitest, existing V3 state/hydration/reducer layers, GitHub Actions CI.

**Spec:** GitHub issue #158 (`[Macro B] V3 Fifth Path systems — eligibility, state, tactical, persistence`).

## Global Constraints

- Authoritative baseline: `integration/v3@dfa483d067dd2d350ed727c8cc68045475e4a371`.
- Work only on `work/v3-fifth-systems`; no direct `integration/v3`, `main`, or prod merge.
- Fifth Path is additive; ordinary Spring convergence keeps at least two normal campaigns.
- `true_path` selection is explicit only; never implicit from eligibility.
- Current and inherited World history remain structurally separate.
- Major True-path events are fail-forward and authoritative once-only.
- Reuse current Tactical/Season stacks; do not build second engines/chore layers.
- Hollow remains closed.
- TDD for every behavior change: RED -> minimal GREEN -> regression/build.

---

### Task 1: Canonical Fifth Eligibility

**Files:**
- Create: `src/fifth-path-eligibility.ts`
- Test: `src/fifth-path-eligibility.test.ts`

**Interfaces:**
- Consumes: `LegacyState`, sanitized World facts, run summaries, True Clues, relationship echoes.
- Produces: `resolveFifthPathEligibility(legacy)` returning `{eligible, reasons, evidence}` and a sanitation-safe candidate decision.

- [ ] **Step 1: Write the failing test** covering all required evidence, stale candidate removal, malformed evidence, insufficient history, and no raw-score thresholds.
- [ ] **Step 2: Run CI and verify RED** because the module/API does not exist.
- [ ] **Step 3: Implement the minimal pure eligibility resolver** from canonical sanitized evidence only.
- [ ] **Step 4: Run targeted/full CI and verify GREEN.**
- [ ] **Step 5: Commit.**

### Task 2: Explicit Authoritative `true_path` Commit

**Files:**
- Create: `src/fifth-path-state.ts`
- Test: `src/fifth-path-state.test.ts`
- Modify: `src/game.ts`

**Interfaces:**
- Consumes: eligible clean-Spring `CampaignRunState` + `LegacyState`.
- Produces: explicit `COMMIT_TRUE_PATH` action and pure commit result with `activeCampaign:'true_path'`, `phase:'summer'`, `path_convergence` exactly once.

- [ ] **Step 1: Write RED tests** for eligible explicit commit, ineligible rejection, no implicit selection, stale candidate rejection, duplicate/replay blocking.
- [ ] **Step 2: Verify RED.**
- [ ] **Step 3: Implement pure commit helper then wire one reducer action.**
- [ ] **Step 4: Verify targeted/full GREEN.**
- [ ] **Step 5: Commit.**

### Task 3: True-path Season / World / Tactical Arc

**Files:**
- Create: `src/fifth-path-runtime.ts`
- Create: `src/fifth-path-tactical.ts`
- Test: `src/fifth-path-runtime.test.ts`
- Test: `src/fifth-path-tactical.test.ts`
- Modify: `src/campaign-seasonal-claim-keys.ts` only if canonical Fifth claim IDs require registry extension.

**Interfaces:**
- Produces typed objective IDs for Summer/Autumn/Winter, typed World/Tactical scenario DTOs, and deterministic season advancement.
- Reuses the existing `claimedSeasonalObjectives` ledger for reward-once semantics.

- [ ] **Step 1: Write RED tests** for Summer -> Autumn -> Winter sequencing, existing-stage Tactical DTOs, fail-forward result acceptance, and duplicate claim blocking.
- [ ] **Step 2: Verify RED.**
- [ ] **Step 3: Implement minimal typed registries/resolvers.**
- [ ] **Step 4: Verify Tactical stability and Season regression remain GREEN.**
- [ ] **Step 5: Commit.**

### Task 4: Outcome / Reward / Lyra Bond / Ending Persistence

**Files:**
- Create: `src/fifth-path-ending.ts`
- Test: `src/fifth-path-ending.test.ts`
- Modify: `src/character-bonds.ts` to register only authoritative Lyra IDs required by the runtime.
- Modify: `src/world-history.ts` to register only stable True-path world outcome IDs required by summaries.

**Interfaces:**
- Consumes typed final True-path result plus qualitative Campaign/Bond/World/Career dimensions from Macro A.
- Produces exactly-once `long_night`/True outcome, reward claim, Lyra bond/history evidence, modular True ending, run summary, Legacy collection update.

- [ ] **Step 1: Write RED tests** for victory/costly/defeat fail-forward, reward-once, duplicate outcome/ending rejection, and semantic ending validation.
- [ ] **Step 2: Verify RED.**
- [ ] **Step 3: Implement minimal authoritative commit helpers.**
- [ ] **Step 4: Verify full GREEN.**
- [ ] **Step 5: Commit.**

### Task 5: Save / Reload / Malformed Sanitation / NG+ Reset

**Files:**
- Test: `src/v3-fifth-path-persistence.test.ts`
- Modify: focused hydration registries only when the RED test proves a gap.

**Interfaces:**
- Consumes full True-path completed V3 state.
- Produces exact JSON save/load/reload idempotency and a clean next `NEW_RUN` with Legacy/run summary preserved once and all current True-path ledgers/reset state cleared.

- [ ] **Step 1: Write RED tests** for save/reload/re-entry, malformed/stale/NaN/Infinity inputs, duplicate IDs, and post-ending `NEW_RUN`.
- [ ] **Step 2: Verify RED or document if existing hydration already satisfies a case.**
- [ ] **Step 3: Make only proven sanitation/reset fixes.**
- [ ] **Step 4: Verify full GREEN.**
- [ ] **Step 5: Commit.**

### Task 6: Macro B Connected E2E Gate

**Files:**
- Create: `src/v3-fifth-path-systems-e2e.test.ts`

**Interfaces:**
- Exercises the public Macro B flow from eligible NG+ state through next NG+ clean restart.

- [ ] **Step 1: Write connected RED/E2E test**: eligibility -> explicit commit -> Summer -> Autumn -> Winter/Tactical -> fail-forward outcome -> reward/ending persistence -> save/reload -> `NEW_RUN`.
- [ ] **Step 2: Fix only integration gaps revealed by the E2E.**
- [ ] **Step 3: Run Fifth targeted suites, Tactical AUTO/stress, Season/meta regression, full test, `tsc -b`, production build.**
- [ ] **Step 4: Open/update one Draft Macro B PR against `integration/v3` with exact GREEN evidence and comment #158.**
