# V3 Spring Campaign Seasonal Objectives Implementation Plan

**Goal:** Add campaign-aware Spring/Summer Seasonal Objectives as a thin adapter over existing Season, Weekly Directive, World, Tactical, Bond, Relic, Astral, and Rift outcomes without adding a new daily/weekly chore loop.

**Architecture:** Keep this wave self-contained in new pure Season-owned modules. Existing actions emit a normalized campaign-season signal; the adapter deterministically selects at most one matching objective per action. Objective completion emits a canonical season-scoped claim key and a Legacy hook payload. Persistence remains caller-owned; no shared save/game fields are added in 03. If persistent wiring is required, file a 06 Integration Request.

**Baseline:** `integration/v3@46faf9031a86ff09d92cc17ee043e9180414d510`
**Branch:** `work/v3-spring-season`

## Constraints

- Spring and Summer definitions only. No Autumn/Winter mainline implementation.
- No second daily/weekly chore stack.
- One existing action may advance at most one Seasonal Objective.
- Rewards are season-scoped reward-once and remain claimed across week rollover/reload/re-entry.
- Malformed campaign IDs, objective IDs, claim keys, and unsupported seasons are ignored/rejected safely.
- Legacy/True support is contract-only. No True Campaign eligibility or story implementation.
- Do not modify shared save/game/App/Root files.
- Preserve existing Sanctuary/Astral/Celestial/Rift behavior by consuming their outcomes as signals only.
- RED before production code; verify targeted Season tests, then full test and build (`build` includes TypeScript).
- Push only to `work/v3-spring-season`; Draft PR targets `integration/v3`; do not merge.

---

### Task 1: Define adapter contracts and Spring/Summer sets

**Files:**
- Create: `src/campaign-seasonal-objectives.test.ts`
- Create: `src/campaign-seasonal-objectives.ts`

- [ ] RED: campaign IDs and Spring/Summer objective definitions cover Caretaker, Pathfinder, Vanguard, Arcanist.
- [ ] RED: Autumn/Winter have no objective sets in this wave.
- [ ] RED: Caretaker consumes Bond/rescue/protect/recovery signals.
- [ ] RED: Pathfinder consumes Discovery/uncleared-region/action-limited exploration signals.
- [ ] RED: Vanguard consumes Tactical challenge/streak/strong-opponent signals.
- [ ] RED: Arcanist consumes Relic/Astral/Rift/status-combat signals.
- [ ] Implement minimal typed definitions and signal adapter.

### Task 2: Enforce single-objective action semantics

**Files:**
- Modify: `src/campaign-seasonal-objectives.test.ts`
- Modify: `src/campaign-seasonal-objectives.ts`

- [ ] RED: an action carrying multiple matching facts resolves to exactly one objective using stable definition priority.
- [ ] RED: duplicate dispatch of the same action cannot fan out into another objective.
- [ ] Implement deterministic first-match/single-result resolution; no aggregate multi-objective progress output.

### Task 3: Reward-once and sanitation contracts

**Files:**
- Modify: `src/campaign-seasonal-objectives.test.ts`
- Modify: `src/campaign-seasonal-objectives.ts`

- [ ] RED: canonical claim keys are `year-season:campaign:objective` and use positive canonical years.
- [ ] RED: claimed ledger blocks duplicate reward after reload/re-entry and duplicate action dispatch.
- [ ] RED: week rollover does not reset season-scoped claims.
- [ ] RED: malformed/unknown campaign IDs, objective IDs, noncanonical season keys, and malformed claim keys are rejected by hydration/sanitation helpers.
- [ ] Implement pure claim-key validation/sanitation and reward-once resolver using caller-provided claimed keys.

### Task 4: Legacy/True hook contract only

**Files:**
- Modify: `src/campaign-seasonal-objectives.test.ts`
- Modify: `src/campaign-seasonal-objectives.ts`

- [ ] RED: accepted objective completion emits a compact Legacy hook containing campaign, season key, objective, source domain, and optional True clue tag.
- [ ] RED: duplicate/already-claimed completion emits no second reward/hook.
- [ ] Ensure contract contains no True Campaign eligibility, path selection, state mutation, or story implementation.

### Task 5: Regression and integration boundary

- [ ] Run targeted Seasonal Objective tests.
- [ ] Run existing Season/Weekly/Sanctuary/Astral/Celestial/Rift targeted suites.
- [ ] Run full `npm run test`.
- [ ] Run `npm run build` (TypeScript + Vite production build).
- [ ] If persistent claim storage cannot be achieved without shared save/game changes, post a `[06 Integration Request]` on #58 with the exact minimal wiring contract.
- [ ] Push candidate commits and create Draft PR against `integration/v3`.
- [ ] Do not merge.
