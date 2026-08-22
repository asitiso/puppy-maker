# V3 Autumn Great Expedition World + Tactical Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver four campaign-specific Great Expedition World/Tactical paths with typed outcome evidence and typed Major Choice consequence mappings, then compose Lane B to GREEN without implementing Major Choice state or Winter.

**Architecture:** Extend the existing campaign-world and central WorldFact registries minimally, add Autumn route and Tactical climax adapters patterned after Summer, then compose both room candidates on the Autumn Lane B verify branch. Existing Expedition stages, TacticalScenario adapter, terminal handoff, and 3v3 engine remain authoritative.

**Tech Stack:** TypeScript, Vitest, React/Vite repository build, GitHub Actions CI.

**Spec:** `docs/superpowers/specs/2026-08-22-v3-autumn-great-expedition-world-tactical-design.md`

## Global Constraints
- Baseline is `integration/v3@4933642fec103504ac7cf97192513058b37d20c3`.
- No direct `integration/v3` merge from feature/lane branches.
- No main/prod changes.
- No shared `App.tsx`, `Root.tsx`, game/save persistence edits in Lane B.
- No Winter/Long Night implementation.
- No Major Choice commit/runtime ownership; Lane C owns exactly-once choice state.
- No free-form World history strings.
- Reuse existing Expedition stages and current 3v3 engine only.

---

### Task 1: Autumn World objective and typed fact contracts

**Files:**
- Modify: `src/campaign-world.ts`
- Modify: `src/world-history.ts`
- Create: `src/autumn-campaign-world.ts`
- Create: `src/autumn-campaign-world.test.ts`

**Interfaces:**
- Consumes: `buildGreatExpeditionWorldPrerequisite(input)` and existing Expedition region/stage IDs.
- Produces: `AutumnGreatExpeditionWorldRoute`, `autumnGreatExpeditionWorldRoutes`, `getAutumnGreatExpeditionWorldRoute(campaign, prerequisite?)` and the missing stable Autumn `WorldFactId` values.

- [ ] **Step 1: Write failing World tests**

Create tests asserting exactly four Autumn routes, existing stage reuse, Guardian Festival prerequisite gating, malformed campaign rejection, and presence/sanitation of the five new stable facts.

- [ ] **Step 2: Run the targeted tests and record RED**

Run: `npm run test -- src/autumn-campaign-world.test.ts`
Expected: FAIL because Autumn route module/objectives/facts are not implemented.

- [ ] **Step 3: Implement minimal World contracts**

Extend `CampaignWorldSeason` with `'autumn'`, add four Great Expedition objective IDs/definitions, add only the five spec WorldFact IDs, and implement a validated Autumn route lookup patterned after `summer-campaign-world.ts`.

- [ ] **Step 4: Re-run targeted World tests**

Run: `npm run test -- src/autumn-campaign-world.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit World candidate slice**

Commit message: `feat: add Autumn Great Expedition world routes`

### Task 2: Typed Major Choice consequence mapping

**Files:**
- Create: `src/autumn-world-consequences.ts`
- Create: `src/autumn-world-consequences.test.ts`

**Interfaces:**
- Consumes: `MainCampaignId`, `MajorChoiceOptionId`, `WorldFactId`.
- Produces: `getAutumnMajorChoiceWorldFacts(campaign, choice): readonly WorldFactId[] | null`.

- [ ] **Step 1: Write failing mapping tests**

Cover all twelve campaign choice options and reject cross-campaign options. Assert no free-form strings and exact expected typed facts.

- [ ] **Step 2: Run targeted consequence tests and record RED**

Run: `npm run test -- src/autumn-world-consequences.test.ts`
Expected: FAIL because mapping module is absent.

- [ ] **Step 3: Implement minimal pure mapping**

Map Caretaker to the three new caretaker facts; Pathfinder to `ancient_route_opened|sealed|limited`; Vanguard to `eiden_central_command|regional_alliance|coalition_command`; Arcanist to `forbidden_relic_used|forbidden_relic_destroyed|forbidden_relic_controlled`.

- [ ] **Step 4: Re-run targeted consequence tests**

Run: `npm run test -- src/autumn-world-consequences.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit World consequence slice**

Commit message: `feat: add typed Autumn world consequences`

### Task 3: Four Autumn Tactical climax definitions

**Files:**
- Create: `src/autumn-tactical-climax.ts`
- Create: `src/autumn-tactical-climax.test.ts`

**Interfaces:**
- Consumes: `CampaignEncounterDefinition`, `campaignEncounterToTacticalScenario`.
- Produces: `autumnGreatExpeditionTacticalClimaxes`, `getAutumnGreatExpeditionTacticalClimax(campaign)`.

- [ ] **Step 1: Write failing Tactical tests**

Assert four campaign scenarios, correct campaign/stage identity, only existing objective/modifier vocabulary, `failForward: true`, malformed lookup null, and battle creation yields the normal 3v3 shape.

- [ ] **Step 2: Run targeted Tactical tests and record RED**

Run: `npm run test -- src/autumn-tactical-climax.test.ts`
Expected: FAIL because module is absent.

- [ ] **Step 3: Implement minimal Tactical definitions**

Caretaker uses rescue/protect-or-survive pressure; Pathfinder escape + scout + turn-limit; Vanguard elite + chained-battle; Arcanist relic-resonance + status-amplify + rule-shift. Reuse only existing stages from the matching Autumn World objective.

- [ ] **Step 4: Re-run targeted Tactical tests**

Run: `npm run test -- src/autumn-tactical-climax.test.ts`
Expected: PASS.

- [ ] **Step 5: Run Tactical stability gates**

Run targeted Tactical scenario/stability suites and verify AUTO 10/50/100 remains bounded.

- [ ] **Step 6: Commit Tactical candidate slice**

Commit message: `feat: add Autumn Great Expedition tactical climaxes`

### Task 4: Independent room verification and Draft PRs

**Files:**
- No production changes unless verification exposes an owned regression.

**Interfaces:**
- Produces exact GREEN 02 World head and exact GREEN 04 Tactical head for Lane composition.

- [ ] **Step 1: Run 02 targeted + full + build**

Run World targeted tests, full `npm run test`, then `npm run build` (`tsc -b && vite build`).

- [ ] **Step 2: Create/update 02 Draft PR**

Base: `integration/v3`. Record RED/GREEN evidence and exact head.

- [ ] **Step 3: Run 04 targeted/stress + full + build**

Run Tactical climax/scenario/stability tests, full `npm run test`, then `npm run build`.

- [ ] **Step 4: Create/update 04 Draft PR**

Base: `integration/v3`. Record stress/full/build evidence and exact head.

### Task 5: Lane B composition and Great Expedition E2E

**Files:**
- Create: `src/autumn-world-tactical-lane.ts`
- Create: `src/autumn-world-tactical-lane.test.ts`

**Interfaces:**
- Consumes exact GREEN World/Tactical candidate heads, existing terminal handoff helpers, and typed Autumn consequence mapping.
- Produces lane adapter/evidence contract and exact GREEN `verify/v3-autumn-world-tactical` head.

- [ ] **Step 1: Compose exact room heads on verify branch**

Do not reconstruct room commits manually; use the exact independently GREEN heads.

- [ ] **Step 2: Write failing Lane E2E tests**

For Caretaker, Pathfinder, Vanguard, Arcanist, assert route -> Tactical scenario -> 3v3 -> terminal -> once-only handoff -> bounded Great Expedition evidence. Assert second handoff is null, campaign/stage mismatches reject, current/inherited history remains distinct, and all twelve choice mappings return typed facts only.

- [ ] **Step 3: Run Lane E2E and record RED**

Run: `npm run test -- src/autumn-world-tactical-lane.test.ts`
Expected: FAIL until the lane adapter exists.

- [ ] **Step 4: Implement minimal lane adapter**

Validate route/climax identity, convert terminal result into bounded Great Expedition evidence, and call the pure typed consequence mapping without committing Major Choice state.

- [ ] **Step 5: Run Lane E2E targeted**

Run: `npm run test -- src/autumn-world-tactical-lane.test.ts`
Expected: PASS.

- [ ] **Step 6: Run full lane verification**

Run full tests, Tactical stability/AUTO 10/50/100, `tsc -b`, and production build.

- [ ] **Step 7: Open/update Draft Lane PR and hand off to #110/#112**

Record exact verify head, test counts, stress evidence, build evidence, and freeze Lane B unless final composite exposes a concrete regression.
