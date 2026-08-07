# Random Events and Skill Unlocks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add lightweight random post-training events and mastery-based automatic skill unlocks to the existing monthly loop without adding a new permanent menu or changing the current schedule → training → dialogue → result → next month flow.

**Architecture:** Extend `GameState` with deterministic unlock/event state, keep event selection in pure game-engine functions, and surface the outcome through the existing dialogue/result UI. Events are weighted by current condition, personality, and scheduled activities; skills are derived from mastery levels so there is no separate mutable skill-tree state to maintain.

**Tech Stack:** React, TypeScript, Vitest, Vite, localStorage state hydration.

## Global Constraints

- Continue work on `feat/v2-core-growth`; do not merge PR #2, PR #1, or main.
- Preserve the existing schedule → training → dialogue → result → next month flow.
- Do not add a permanent skill-tree menu, new currency, or large new navigation surface.
- Random events must be bounded and replay-safe; malformed legacy saves must hydrate safely.
- Skill unlocks come from mastery thresholds and should provide small, readable bonuses to existing training actions.
- Use TDD: add failing tests, verify RED in CI, then implement the minimum code to pass.

---

### Task 1: Define event and skill behavior in tests

**Files:**
- Modify: `src/game.test.ts`

**Interfaces:**
- Consumes: existing `GameState`, `masteryLevel`, `reducer`.
- Produces expected contracts for `SkillId`, `RandomEventId`, `unlockedSkills(state)`, `pickRandomEvent(state, roll)`, event metadata on `GameState`, and training bonuses.

- [ ] **Step 1: Add failing tests for skill thresholds**

Add tests asserting:
- hunt Lv.2 unlocks `quick_strike`.
- magic Lv.2 unlocks `mana_focus`.
- rest Lv.2 unlocks `steady_breath`.
- herb Lv.2 unlocks `trail_instinct`.
- no Lv.2 mastery means no skill unlocked.

- [ ] **Step 2: Add failing tests for deterministic event selection**

Use an explicit `roll` argument instead of `Math.random()` in engine tests. Assert that eligible event pools depend on condition/personality/schedule and that the same state + roll yields the same event.

Expected initial six event ids:

```ts
'rare_herb' | 'new_move' | 'magic_flow' | 'second_wind' | 'quiet_focus' | 'fox_curiosity'
```

- [ ] **Step 3: Add failing tests for event application and one-month reporting**

Assert:
- an event is recorded at `FINISH_TRAINING` when selected;
- event rewards alter only intended values;
- `lastGrowthReport` can surface one event and one newly unlocked skill;
- `NEXT_MONTH` clears transient event display state but preserves mastery and unlocked skills through derivation.

- [ ] **Step 4: Add failing tests for skill bonuses on existing TRAIN actions**

Assert small bonuses only:
- `quick_strike`: attack gain +5%.
- `mana_focus`: charge gain +5%.
- `steady_breath`: tired-condition penalty is softened from 0.90 to 0.95.
- `trail_instinct`: post-training herb activity grants +1 intelligence once per herb schedule slot.

- [ ] **Step 5: Commit RED tests**

Commit message:

```text
test: define random events and mastery skill unlocks
```

---

### Task 2: Implement pure skill and event engine

**Files:**
- Modify: `src/game.ts`
- Test: `src/game.test.ts`

**Interfaces:**
- Produces:

```ts
export type SkillId = 'quick_strike' | 'mana_focus' | 'steady_breath' | 'trail_instinct';
export type RandomEventId = 'rare_herb' | 'new_move' | 'magic_flow' | 'second_wind' | 'quiet_focus' | 'fox_curiosity';
export function unlockedSkills(state: GameState): SkillId[];
export function pickRandomEvent(state: GameState, roll: number): RandomEventId | null;
```

- [ ] **Step 1: Implement mastery-derived skill unlocks**

Use `masteryLevel(entry.xp) >= 2` for the four first-tier skills. Do not persist duplicate skill state in saves.

- [ ] **Step 2: Implement six weighted event definitions**

Use a small table with eligibility and effects. Event examples:
- `rare_herb`: requires herb in schedule; +100G and +1 curiosity.
- `new_move`: requires hunt in schedule and courage >= 25; +1 hunt mastery XP.
- `magic_flow`: requires magic in schedule and focused/energetic condition; +80 training score before report calculation.
- `second_wind`: eligible when fatigue >= 35; fatigue -8.
- `quiet_focus`: eligible when calmness >= 25; stress -6.
- `fox_curiosity`: requires curiosity >= 25; +1 herb or magic mastery XP, preferring an activity present in schedule.

Selection is deterministic from an injected `roll` in `[0, 1)`. Production `FINISH_TRAINING` may call with `Math.random()`.

- [ ] **Step 3: Apply skill bonuses to existing actions**

Keep bonuses multiplicative and capped to the stated values. Do not add new training buttons.

- [ ] **Step 4: Add transient event/unlock report fields with safe hydration**

Extend `GrowthReport` with optional:

```ts
randomEvent: RandomEventId | null;
unlockedSkill: SkillId | null;
```

Hydration must reject unknown ids and fall back to `null`.

- [ ] **Step 5: Run full tests and build**

Run in CI:

```text
npm run test
npm run build
```

Expected: all tests pass and build exits 0.

- [ ] **Step 6: Commit implementation**

Commit message:

```text
feat: add random events and mastery skill unlocks
```

---

### Task 3: Surface discoveries in existing UI

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/LayeredHome.tsx` only if a small home hint is useful; no new panel.

**Interfaces:**
- Consumes: `lastGrowthReport.randomEvent`, `lastGrowthReport.unlockedSkill`, `unlockedSkills(state)`.

- [ ] **Step 1: Add Korean labels for six events and four skills**

Use concise copy suitable for existing result cards.

- [ ] **Step 2: Reuse the result card's fourth slot**

Priority for the fourth slot:
1. newly unlocked skill;
2. random event;
3. new memory;
4. current condition.

Do not add another result screen.

- [ ] **Step 3: Add one short dialogue line when an event happened**

Reuse the existing dialogue/result flow. Do not introduce another click to continue.

- [ ] **Step 4: Run CI test and production build**

Expected: both pass.

- [ ] **Step 5: Commit UI integration**

Commit message:

```text
feat: surface training discoveries in existing results
```

---

### Task 4: Regression and deployment verification

**Files:**
- Modify: `src/game.test.ts` only if a missing regression is discovered.

**Interfaces:**
- Verifies full existing monthly loop and save hydration.

- [ ] **Step 1: Verify monthly return regression**

Ensure tests cover:

```text
hub → schedule → training → dialogue → result → NEXT_MONTH → hub → schedule
```

and mastery/event data does not block navigation.

- [ ] **Step 2: Verify GitHub Actions**

Confirm the latest commit's CI has `npm run test` and `npm run build` both successful.

- [ ] **Step 3: Verify Vercel deployment**

Confirm the latest `feat/v2-core-growth` deployment is `READY` and matches the latest commit SHA.

- [ ] **Step 4: Review diff for scope creep**

Confirm there is no new permanent menu, currency, unrelated refactor, or merge.
