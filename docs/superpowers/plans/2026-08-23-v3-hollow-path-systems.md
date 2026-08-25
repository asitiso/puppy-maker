# V3 Hollow Path Systems Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete authoritative Hollow Path system from canonical current-run danger evidence through explicit Hollow acceptance, playable runtime, fail-forward ending persistence, save/reload, and clean NG+ reset.

**Architecture:** Canonical unique danger evidence is authoritative; semantic tier is derived from that set and inherited history remains separate. Explicit accept/refuse resolves the final dangerous-choice opportunity, after which route-aware adapters reuse existing Season, World, Expedition, 3v3 Tactical, Bond, ending, save, and NG+ systems.

**Tech Stack:** TypeScript, Vitest, React game reducer/state, existing V3 campaign/world/tactical/save modules.

**Spec:** `docs/superpowers/specs/2026-08-23-v3-hollow-path-systems-design.md`

## Global Constraints

- Baseline is `integration/v3@62e5afe30f3fdbe8232a285b3d97af9a9ba5892d`.
- Work only on `work/v3-hollow-systems`.
- No raw danger score/threshold is exposed to UI contracts.
- Inherited dangerous history never counts as current-run Hollow authority and never auto-selects Hollow.
- Candidate status never mutates route; only explicit acceptance sets `activeRoute='hollow'`.
- Reuse existing Expedition/3v3/Season systems; no replacement engine or second chore stack.
- Dangerous choices must provide real short-term utility through existing adapters.
- Fail-forward applies to all Hollow major outcomes, including defeat.
- Save/reload/re-entry and repeated dispatch are idempotent.
- NG+ clears raw/current Hollow authority and preserves only compact intended Legacy echoes.
- Preserve normal campaigns, Fifth Path, Tactical stability/AUTO, Season/meta, and current/inherited World correctness.
- Keep Draft PR; no direct merge to `integration/v3`, `main`, or prod.

---

### Task 1: Canonical Hollow danger evidence

**Files:**
- Create: `src/hollow-danger.ts`
- Create: `src/hollow-danger.test.ts`
- Modify: `src/campaign-model.ts`
- Modify: `src/campaign-state.ts`

**Interfaces:**
- Produces `HollowDangerEvidenceId`, `HollowDangerTier`, `resolveHollowDangerState`, `commitHollowDangerEvidence`.
- `resolveHollowDangerState` consumes only sanitized current-run evidence and returns `{tier,evidence,finalChoiceAvailable}`.

- [ ] **Step 1: Write failing tests**

Cover canonical evidence registry, stable/fractured/candidate derivation, severe-evidence requirement, duplicate evidence no-op, unknown evidence sanitation, and proof that raw `dangerState.score` cannot manufacture candidate status.

```ts
expect(resolveHollowDangerState({evidence:['instrumental_bond','civilian_tradeoff','rift_dependence']})).toMatchObject({
  tier:'fractured',finalChoiceAvailable:false,
});
expect(resolveHollowDangerState({evidence:['instrumental_bond','civilian_tradeoff','veyr_power']})).toMatchObject({
  tier:'hollow_candidate',finalChoiceAvailable:true,
});
```

- [ ] **Step 2: Run targeted RED**

Run `npm run test -- src/hollow-danger.test.ts` and confirm missing module/contracts fail for the intended reason.

- [ ] **Step 3: Implement minimal authoritative model**

Add canonical IDs:

```ts
export const hollowDangerEvidenceIds=[
  'ally_sacrifice','instrumental_bond','civilian_tradeoff',
  'forbidden_relic','rift_dependence','veyr_power',
] as const;
```

Extend current-run danger state with a sanitized `evidence` list and an optional resolved final-choice key while retaining legacy `score`/`behaviors` hydration compatibility.

- [ ] **Step 4: Run targeted GREEN and campaign-state regression**

Run `npm run test -- src/hollow-danger.test.ts src/campaign-state.test.ts src/v3-persistent-state.test.ts`.

- [ ] **Step 5: Commit**

Commit as `feat: add canonical Hollow danger evidence`.

### Task 2: Explicit final dangerous choice

**Files:**
- Create: `src/hollow-choice.ts`
- Create: `src/hollow-choice.test.ts`
- Modify: `src/game.ts`

**Interfaces:**
- Produces `resolveHollowFinalChoice(state, choice:'accept'|'refuse')`.
- Game reducer actions: `ACCEPT_HOLLOW_PATH` and `REFUSE_HOLLOW_PATH` or one typed semantic action if existing reducer conventions favor it.

- [ ] **Step 1: Write RED tests**

Test candidate without auto-route mutation, explicit refusal preserving the current route, explicit acceptance setting `hollow`, ineligible rejection, duplicate accept/refuse returning `already_resolved`, and reducer preservation of unrelated state.

```ts
const accepted=resolveHollowFinalChoice(candidateState,'accept');
expect(accepted.committed).toBe(true);
expect(accepted.state.campaignRun.activeRoute).toBe('hollow');
```

- [ ] **Step 2: Run targeted RED**

Run `npm run test -- src/hollow-choice.test.ts`.

- [ ] **Step 3: Implement minimal transition**

The transition must check canonical derived danger, then resolved-opportunity state, and mutate route only for `accept`.

- [ ] **Step 4: Run targeted GREEN plus Fifth/NG+ reducer regression**

Run `npm run test -- src/hollow-choice.test.ts src/fifth-path-state.test.ts src/game.test.ts src/v3-ngplus-wave-e2e.test.tsx`.

- [ ] **Step 5: Commit**

Commit as `feat: add explicit Hollow accept refuse transition`.

### Task 3: Dangerous-choice utility adapters

**Files:**
- Create: `src/hollow-danger-actions.ts`
- Create: `src/hollow-danger-actions.test.ts`
- Modify only existing adapter registries required to expose real utility.

**Interfaces:**
- Produces typed dangerous action definitions mapping choice IDs to one canonical evidence ID plus an existing-system utility DTO.

- [ ] **Step 1: Write RED tests**

Cover all required behavior categories and prove each accepted dangerous action has non-empty utility while duplicate evidence cannot re-award the utility.

```ts
expect(resolveHollowDangerAction('accept_veyr_power')).toMatchObject({
  evidenceId:'veyr_power',
  utility:{kind:'tactical_resource'},
});
```

- [ ] **Step 2: Run targeted RED**

Run `npm run test -- src/hollow-danger-actions.test.ts`.

- [ ] **Step 3: Implement minimal adapters**

Use existing Tactical/World/Season reward shapes; do not create a new economy.

- [ ] **Step 4: Run targeted GREEN plus economy/resource invariants**

Run `npm run test -- src/hollow-danger-actions.test.ts src/tactical-resource-integration.test.ts src/game/world-reward-invariants.test.ts src/season-meta-economy.test.ts`.

- [ ] **Step 5: Commit**

Commit as `feat: connect Hollow danger to short term utility`.

### Task 4: Hollow Season and World runtime

**Files:**
- Create: `src/hollow-runtime.ts`
- Create: `src/hollow-runtime.test.ts`
- Modify: `src/campaign-seasonal-claim-keys.ts`
- Modify: `src/world-history.ts`
- Modify: `src/ngplus-world-echo.ts` only for intended compact echoes.

**Interfaces:**
- Produces route-aware Summer/Autumn/Winter objective definitions, `resolveHollowSeasonObjective`, and `commitHollowSeasonObjective`.

- [ ] **Step 1: Write RED tests**

Test Hollow route requirement, season sequencing, exactly-once claim keys, current World facts, rejection on normal/true route, and inherited-fact preservation.

- [ ] **Step 2: Run targeted RED**

Run `npm run test -- src/hollow-runtime.test.ts`.

- [ ] **Step 3: Implement runtime using existing claim ledger**

Register Hollow objective claim keys and typed World facts. Summer advances to Autumn, Autumn advances to Winter, Winter remains ready for terminal outcome commit.

- [ ] **Step 4: Run targeted GREEN plus seasonal/world regression**

Run `npm run test -- src/hollow-runtime.test.ts src/campaign-seasonal-objectives.test.ts src/world-history.test.ts src/v3-summer-wave-e2e.test.ts src/v3-autumn-wave-e2e.test.ts src/v3-winter-wave-e2e.test.ts`.

- [ ] **Step 5: Commit**

Commit as `feat: add Hollow seasonal world runtime`.

### Task 5: Hollow Tactical reuse and fail-forward terminal result

**Files:**
- Create: `src/hollow-tactical.ts`
- Create: `src/hollow-tactical.test.ts`

**Interfaces:**
- Produces typed Hollow scenarios, `createHollowBattle`, and `resolveHollowTacticalTerminalResult` over existing 3v3 stages.

- [ ] **Step 1: Write RED tests**

Test scenario registry reuse of existing stage IDs, valid battle creation, victory/defeat terminal translation, fail-forward true for both, terminal-key idempotency, and numeric sanitation.

- [ ] **Step 2: Run targeted RED**

Run `npm run test -- src/hollow-tactical.test.ts`.

- [ ] **Step 3: Implement minimal adapters over existing Tactical stack**

Do not modify the Tactical engine unless a proven shared invariant gap is exposed.

- [ ] **Step 4: Run targeted GREEN plus Tactical stability**

Run `npm run test -- src/hollow-tactical.test.ts src/tactical-stability.test.ts src/tactical-ngplus-reset.test.ts`.

- [ ] **Step 5: Commit**

Commit as `feat: reuse tactical engine for Hollow`.

### Task 6: Hollow outcome, Bond, reward, and ending

**Files:**
- Create: `src/hollow-ending.ts`
- Create: `src/hollow-ending.test.ts`
- Modify: `src/character-bonds.ts`
- Modify: `src/campaign-winter-season.ts` only if generic completed-run handoff needs route-aware validation.
- Modify: `src/legacy-state.ts` for compact Hollow evidence/echo only if existing RunSummary fields cannot encode it canonically.

**Interfaces:**
- Produces `resolveHollowOutcome`, `commitHollowOutcome`, `resolveHollowEnding`, `commitHollowEnding`.

- [ ] **Step 1: Write RED tests**

Table-test victory/costly victory/defeat, reward once, Veyr/affected Bond memory once, final World fact once, fail-forward defeat, malformed result rejection, semantic modular ending archive, and duplicate ending rejection.

- [ ] **Step 2: Run targeted RED**

Run `npm run test -- src/hollow-ending.test.ts`.

- [ ] **Step 3: Implement minimal outcome and ending persistence**

Duplicate detection must run before readiness checks when the first commit changes phase, preventing the Fifth Path duplicate-order regression from recurring.

- [ ] **Step 4: Run targeted GREEN plus Winter/Fifth ending regression**

Run `npm run test -- src/hollow-ending.test.ts src/fifth-path-ending.test.ts src/campaign-winter-season.test.ts src/winter-ending-story.test.ts`.

- [ ] **Step 5: Commit**

Commit as `feat: persist Hollow outcomes and ending`.

### Task 7: Save/reload sanitation and NG+ reset

**Files:**
- Create: `src/v3-hollow-path-persistence.test.ts`
- Modify: `src/campaign-state.ts`
- Modify: `src/legacy-state.ts`
- Modify: `src/ngplus-replay.ts`
- Modify save/hydration code only where RED proves a gap.

**Interfaces:**
- Completed Hollow run must be accepted by authoritative completed-run handoff while malformed/forged summaries are rejected.

- [ ] **Step 1: Write persistence RED suite**

Test complete Hollow save -> hydrate -> save idempotency; malformed/duplicate evidence/claims/Bond/world IDs sanitation; `NEW_RUN` clearing current danger/route/runtime; compact echo preservation; immediate second `NEW_RUN` no-op; inherited echoes never creating current candidate.

- [ ] **Step 2: Run targeted RED**

Run `npm run test -- src/v3-hollow-path-persistence.test.ts`.

- [ ] **Step 3: Implement only proven hydration/handoff/reset gaps**

Ensure next run starts `activeRoute:'normal'`, empty current danger evidence, unresolved final choice, clean current World/Tactical/Season state, with compact Legacy echoes only.

- [ ] **Step 4: Run targeted GREEN plus save/NG+ malformed regression**

Run `npm run test -- src/v3-hollow-path-persistence.test.ts src/save-resilience.test.ts src/save-schema.test.ts src/v3-ngplus-replay-multicycle.test.ts src/global-release-candidate-malformed-numbers.test.ts`.

- [ ] **Step 5: Commit**

Commit as `feat: reset Hollow authority across new possibilities`.

### Task 8: Connected Hollow Macro B E2E

**Files:**
- Create: `src/v3-hollow-path-systems-e2e.test.ts`

**Interfaces:**
- Consumes all authoritative APIs from Tasks 1–7.

- [ ] **Step 1: Write connected E2E**

Flow:

```text
normal/true route
-> three distinct canonical dangerous choices with one severe evidence
-> candidate unlocked, route unchanged
-> refusal branch preserves route and cannot replay
-> separate run reaches candidate
-> explicit acceptance sets hollow exactly once
-> Hollow Summer -> Autumn -> Winter
-> existing 3v3 scenario -> defeat fail-forward
-> reward/Bond/World outcome once
-> modular Hollow ending once
-> JSON save/reload
-> NEW_RUN
-> clean normal Spring with compact echoes only
-> second NEW_RUN no-op
```

- [ ] **Step 2: Run Macro E2E GREEN**

Run `npm run test -- src/v3-hollow-path-systems-e2e.test.ts`.

- [ ] **Step 3: Commit**

Commit as `test: cover Hollow systems end to end`.

### Task 9: Full gate, Draft PR, and #172 handoff

**Files:**
- Update PR body only; no production code unless verification exposes a real regression.

- [ ] **Step 1: Run Hollow targeted gate**

Run Hollow danger/choice/runtime/tactical/ending/persistence/E2E suites together.

- [ ] **Step 2: Run Tactical and Expedition stress**

Run `src/tactical-stability.test.ts` including AUTO 10/50/100 and Expedition stress suites.

- [ ] **Step 3: Run full tests**

Run `npm run test` and record exact test-file/test counts.

- [ ] **Step 4: Run production build**

Run `npm run build` (`tsc -b && vite build`) and record module count.

- [ ] **Step 5: Verify baseline and branch**

Compare current `integration/v3` with authoritative baseline and verify no direct integration/main/prod mutation.

- [ ] **Step 6: Create/update one Draft PR against `integration/v3`**

Body records exact head, CI run, connected scope, GREEN counts, and no-merge rule.

- [ ] **Step 7: Comment #172 GREEN handoff**

Report exact head/CI evidence and leave integration to #173 Final Gate.
