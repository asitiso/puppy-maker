# V5 Generations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build multi-year life stages and an explicit bounded lineage transition that preserves narrative heritage without inheriting raw power.

**Architecture:** Add a focused lineage domain module with pure hydration/derivation functions, then integrate it into the top-level reducer as a separate `START_NEXT_GENERATION` path. Keep existing V4 weekly settlement and V3 NG+ untouched; UI consumes pure lineage selectors and presents lineage history without replacing the authoritative Hub primary CTA.

**Tech Stack:** TypeScript, React, Vitest, Vite.

**Spec:** `docs/superpowers/specs/2026-08-25-puppy-maker-v5-generations-design.md`

## Global Constraints
- Baseline tree: `499a67fc4bdbb688ba466a31ff7125c56369fccc`.
- `NEW_RUN` remains NG+ only.
- No raw stat/economy/inventory/mastery/tactical/expedition power inheritance.
- No duplicate week/month settlement logic.
- Ancestors <= 8; current heritage traits <= 2.
- No save wipe; malformed lineage must hydrate safely.
- RED → minimal fix → targeted → full regression/build.

---

### Task 1: Lineage domain + life-stage selectors

**Files:**
- Create: `src/lineage.ts`
- Create: `src/v5-lineage-domain.test.ts`

**Interfaces:**
- Produces: `HeritageTraitId`, `AncestorRecord`, `LineageState`, `emptyLineageState()`, `hydrateLineageState(raw)`, `lifeStageForYear(year)`, `lifeStageLabel(year)`, `heritageTraitDefinitions`.

- [ ] **Step 1: Write failing domain tests** for year 1/2/3+ stage boundaries, malformed generation, canonical trait dedupe/order, ancestor generation dedupe/sort, and latest-8 bound.
- [ ] **Step 2: Run `npx vitest run src/v5-lineage-domain.test.ts`** and confirm RED because `./lineage` does not exist.
- [ ] **Step 3: Implement `src/lineage.ts`** with registry-based canonicalization and pure selectors only.
- [ ] **Step 4: Run targeted test** and require GREEN.
- [ ] **Step 5: Commit** `feat: add V5 lineage domain`.

### Task 2: Deterministic completed-life snapshot + heritage derivation

**Files:**
- Modify: `src/lineage.ts`
- Create: `src/v5-lineage-heritage.test.ts`

**Interfaces:**
- Consumes current guardian rank, personality, route/ending, current+inherited world facts.
- Produces: `dominantPersonalityKey(personality)`, `deriveHeritageTraits(input)`, `buildAncestorRecord(input)`.

- [ ] **Step 1: Write failing tests** proving the same input always returns the same <=2 traits, route-specific True/Hollow echo selection, world witness selection, deterministic personality tie-breaking, and canonical world-fact dedupe.
- [ ] **Step 2: Run targeted test** and confirm RED for missing functions.
- [ ] **Step 3: Implement minimal deterministic derivation** using stable registry order; no random source.
- [ ] **Step 4: Run both V5 domain suites** and require GREEN.
- [ ] **Step 5: Commit** `feat: derive bounded lineage heritage`.

### Task 3: Top-level persistent lineage state + hydration

**Files:**
- Modify: `src/game.ts`
- Create: `src/v5-lineage-persistence.test.ts`

**Interfaces:**
- `GameState` gains `lineage: LineageState`.
- `initialState.lineage = emptyLineageState()`.
- `hydrateGameState` hydrates `source.lineage`.

- [ ] **Step 1: Write failing tests** for old saves without lineage, valid lineage reload, malformed lineage recovery, and current valid weekly state remaining unchanged.
- [ ] **Step 2: Run targeted persistence test** and confirm RED.
- [ ] **Step 3: Integrate lineage hydration into `src/game.ts`** without changing save envelope format.
- [ ] **Step 4: Run persistence + existing V4 persistence suites** and require GREEN.
- [ ] **Step 5: Commit** `feat: persist V5 lineage state`.

### Task 4: Explicit next-generation reducer transition

**Files:**
- Modify: `src/game.ts`
- Modify: `src/lineage.ts`
- Create: `src/v5-generation-transition.test.ts`

**Interfaces:**
- New action: `{ type:'START_NEXT_GENERATION' }`.
- Pure eligibility selector: `canStartNextGeneration(input)`.
- Transition snapshots ancestor, increments generation, resets active life from `initialState`, and restores only new lineage metadata.

- [ ] **Step 1: Write failing transition tests**: Year <3 no-op; no durable completion evidence no-op; eligible transition increments generation; ancestor snapshot stored once; stats/gold/gems/inventory/mastery/tactical/expedition/weekly current progress reset; heritage <=2.
- [ ] **Step 2: Run targeted transition test** and confirm RED.
- [ ] **Step 3: Implement minimal reducer branch** before the generic Base reducer path.
- [ ] **Step 4: Add repeated-dispatch test** proving a stale action cannot duplicate an ancestor after reset.
- [ ] **Step 5: Run transition + persistence suites** and require GREEN.
- [ ] **Step 6: Commit** `feat: add explicit next generation transition`.

### Task 5: NG+ / True / Hollow independence

**Files:**
- Create: `src/v5-lineage-ngplus-compatibility.test.ts`
- Modify: `src/lineage.ts` only if a pure derivation gap is exposed.

**Interfaces:**
- `NEW_RUN` must preserve lineage generation and must not create an ancestor.
- `START_NEXT_GENERATION` must not use NG+ transition state as raw inheritance.

- [ ] **Step 1: Write RED compatibility tests** for `NEW_RUN` generation stability, True heritage `true_echo`, Hollow heritage `hollow_echo`, and raw-power reset.
- [ ] **Step 2: Run targeted test** and confirm RED only for real gaps.
- [ ] **Step 3: Make the smallest pure-domain/reducer correction**; do not alter V3 NG+ rules.
- [ ] **Step 4: Run V3 NG+/True/Hollow and V5 compatibility suites**.
- [ ] **Step 5: Commit** `test: lock V5 NG+ route compatibility` or `fix:` if production code changes.

### Task 6: Multi-year weekly variation hook

**Files:**
- Modify: `src/weekly-life.ts`
- Modify: `src/game.ts`
- Create: `src/v5-multi-year-weekly.test.ts`

**Interfaces:**
- Extend weekly event input with derived life stage and heritage count/ids only as deterministic inputs.
- Preserve resolution-key stability for the same canonical state.

- [ ] **Step 1: Write RED tests** that Year 1 vs Year 2/3 can select different deterministic variants while identical state reloads do not reroll.
- [ ] **Step 2: Run targeted test** and confirm RED.
- [ ] **Step 3: Add the smallest life-stage/heritage variation mapping**; no second event engine.
- [ ] **Step 4: Run V4 soak + weekly persistence + new tests** and require GREEN.
- [ ] **Step 5: Commit** `feat: vary weekly life by life stage`.

### Task 7: Hub identity + Lineage Chronicle UI

**Files:**
- Create: `src/LineageChronicle.tsx`
- Create: `src/lineage-chronicle.css`
- Modify: `src/LayeredHome.tsx`
- Modify: `src/layered-home.css`
- Create: `src/v5-lineage-ui.test.ts`

**Interfaces:**
- Chronicle receives `GameState` and optional `onStartNextGeneration` callback.
- Hub displays `N세대 · X년차`, life-stage label, current heritage labels.
- Chronicle lists latest ancestors and an eligible explicit next-generation action.

- [ ] **Step 1: Write RED source/UI contract tests** for generation/year/stage text, ancestor list, max 8 presentation, button eligibility, and absence from `hubNextAction` primary-route logic.
- [ ] **Step 2: Run targeted UI tests** and confirm RED.
- [ ] **Step 3: Implement compact mobile-first Chronicle and Hub identity metadata** with 44px controls and 360/390/430 layouts.
- [ ] **Step 4: Run LayeredHome, accessibility/mobile, and V5 UI tests**.
- [ ] **Step 5: Commit** `feat: add lineage chronicle experience`.

### Task 8: Three-generation multi-year soak

**Files:**
- Create: `src/v5-generations-soak.test.ts`

**Interfaces:**
- Use the real top-level reducer and save hydration path.

- [ ] **Step 1: Write soak** covering >=3 generations, >=3 years per eligible life, weekly focus completion, monthly/year rollover, save/reload between years/generations, one malformed-lineage injection, and optional NG+ inside one generation.
- [ ] **Step 2: Assert** finite numbers, ancestors <=8, heritage <=2, unique ancestor generations, raw reset after each generation, deterministic reload, independent NG+ runNumber vs lineage generation.
- [ ] **Step 3: Run soak** and fix only discovered contract gaps.
- [ ] **Step 4: Commit** `test: soak V5 multi-generation progression`.

### Task 9: Full verification + release gate

**Files:**
- Update docs/issue/PR evidence only as needed.

- [ ] **Step 1: Run all targeted V5 suites.**
- [ ] **Step 2: Run full Vitest suite.**
- [ ] **Step 3: Run audit and TypeScript/Vite production build.**
- [ ] **Step 4: Open PR `work/v5-generations` → `integration/v3` with exact head/tree and CI evidence.**
- [ ] **Step 5: Verify preview root and runtime logs.**
- [ ] **Step 6: Merge to integration only on exact GREEN head.**
- [ ] **Step 7: Open/verify integration → main release PR, exact CI GREEN.**
- [ ] **Step 8: Verify production deployment exact main commit, root 200, `/api/client-telemetry` 200, and no error/fatal runtime logs.**
- [ ] **Step 9: Close #189 only after production proof.**
