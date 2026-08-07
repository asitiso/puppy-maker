# Puppy Maker V2 Core Growth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first V2 growth loop—condition, mastery, result quality, personality, memories, and a monthly growth report—without breaking the current schedule/training/dialogue/result flow or legacy saves.

**Architecture:** Extend the existing reducer-based game state in `src/game.ts` with a few focused fields and pure helper functions. Keep the current `Root.tsx` DOM bridge during the growth-state work, then replace it in a separate regression-protected task after the V2 loop is verified. UI changes remain minimal and reuse the current layered-home and result surfaces.

**Tech Stack:** React, TypeScript, Vite, Vitest, browser localStorage, existing PNG/SVG UI assets.

## Global Constraints

- Do not merge PR #1 or `main` without explicit user instruction.
- Preserve existing game flow: `hub -> schedule -> training -> dialogue -> result -> next month -> hub`.
- Preserve existing save key: `puppy-maker-save`.
- Existing saves must hydrate safely with V2 defaults.
- Decorative art uses supplied image assets; CSS is for layout, sizing, responsive behavior, transforms, and simple animation rather than painting replacement artwork.
- Keep changes reversible and separated by concern.
- Do not report deployment success until Vercel explicitly reports READY.
- Do not remove the current DOM-based home bridge until a regression test covers the replacement.

---

## File Structure

- Create: `.gitignore` — dependency/build/editor ignore rules.
- Modify: `src/game.ts` — V2 state types, pure growth helpers, reducer transitions, save hydration.
- Modify: `src/game.test.ts` — TDD coverage for hydration, condition, mastery, personality, memories, reports, and month transition.
- Modify: `src/App.tsx` — use hydration function and surface result-report data.
- Modify: `src/LayeredHome.tsx` — accept dynamic home data and show condition/recommendation without adding another dense panel.
- Modify: `src/Root.tsx` — first pass props into LayeredHome; later replace MutationObserver bridge with explicit screen-state callbacks.
- Modify: `src/layered-home.css` — only spacing/readability adjustments for new dynamic text if required.
- Create or modify tests for the home bridge if a suitable test harness already exists; otherwise keep the bridge refactor as the final isolated task after browser verification.

---

### Task 1: Repository hygiene

**Files:**
- Create: `.gitignore`
- Remove from tracking: `node_modules/**`

**Interfaces:**
- Consumes: existing package manifests and branch state.
- Produces: a branch where future diffs contain source/assets only, not installed dependencies.

- [ ] **Step 1: Add `.gitignore`**

Use:

```gitignore
node_modules/
dist/
.vite/
coverage/
*.log
.DS_Store
Thumbs.db
.env
.env.*
!.env.example
```

- [ ] **Step 2: Remove tracked `node_modules` without deleting package manifests or lockfiles**

Use a tree-level commit or equivalent Git index operation so all `node_modules/**` paths are removed from the branch while `package.json` and any lockfile remain.

- [ ] **Step 3: Verify repository diff**

Expected: `node_modules/**` no longer appears as tracked content; `.gitignore` is present.

- [ ] **Step 4: Commit**

Commit message:

```text
chore: remove tracked dependencies and harden gitignore
```

---

### Task 2: Define V2 growth behavior with failing tests

**Files:**
- Modify: `src/game.test.ts`
- Modify later in Task 3: `src/game.ts`

**Interfaces:**
- Consumes: current `initialState`, `reducer`, `trainingGrade`, `applyDialogueChoice`.
- Produces test expectations for `hydrateGameState`, `resultQuality`, `masteryLevel`, `deriveCondition`, idempotent memories, personality clamping, and growth reports.

- [ ] **Step 1: Add hydration tests**

Add tests equivalent to:

```ts
it('hydrates legacy saves with v2 defaults', () => {
  const legacy = { ...initialState } as Record<string, unknown>;
  delete legacy.condition;
  delete legacy.mastery;
  delete legacy.personality;
  delete legacy.memories;
  delete legacy.lastGrowthReport;
  const hydrated = hydrateGameState(legacy);
  expect(hydrated.condition).toBe('normal');
  expect(hydrated.mastery.hunt.xp).toBe(0);
  expect(hydrated.memories).toEqual([]);
});

it('falls back safely for malformed saves', () => {
  expect(hydrateGameState(null)).toEqual(initialState);
  expect(hydrateGameState('broken')).toEqual(initialState);
});
```

- [ ] **Step 2: Add pure growth helper tests**

Cover exact boundaries:

```ts
expect(resultQuality(0)).toBe('NORMAL');
expect(resultQuality(400)).toBe('GOOD');
expect(resultQuality(650)).toBe('GREAT');
expect(resultQuality(900)).toBe('PERFECT');

expect(masteryLevel(0)).toBe(1);
expect(masteryLevel(3)).toBe(2);
expect(masteryLevel(7)).toBe(3);
expect(masteryLevel(12)).toBe(4);
expect(masteryLevel(18)).toBe(5);
```

- [ ] **Step 3: Add reducer progression tests**

Verify:

```ts
const trained = reducer(initialState, { type: 'FINISH_TRAINING' });
expect(trained.mastery.hunt.xp).toBeGreaterThan(0);
expect(trained.personality.courage).toBeGreaterThan(initialState.personality.courage);
expect(trained.memories).toContain('first_training');
```

Then verify the same trigger does not duplicate the memory.

- [ ] **Step 4: Add dialogue/report tests**

Verify `CHOOSE` adds dialogue personality/memory effects and creates `lastGrowthReport` containing grade/quality, mastery gains, personality deltas, and at most one newly unlocked memory.

- [ ] **Step 5: Run tests and confirm expected failure**

Run:

```bash
npm run test
```

Expected: new tests fail because V2 helpers/state do not exist yet; existing tests still compile once imports are added only after Task 3 begins, or tests are staged with explicit TODO-free expected imports in the same implementation cycle.

- [ ] **Step 6: Commit tests**

Commit message:

```text
test: define v2 growth state behavior
```

---

### Task 3: Implement V2 state, helpers, migration, and reducer behavior

**Files:**
- Modify: `src/game.ts`
- Test: `src/game.test.ts`

**Interfaces:**
- Produces:
  - `type Condition = 'energetic' | 'normal' | 'focused' | 'tired'`
  - `type ResultQuality = 'NORMAL' | 'GOOD' | 'GREAT' | 'PERFECT'`
  - `type Personality = { courage: number; kindness: number; curiosity: number; calmness: number }`
  - `type MasteryEntry = { xp: number }`
  - `type MasteryState = Record<ActivityId, MasteryEntry>`
  - `type MemoryId = 'first_training' | 'first_perfect' | 'first_hug' | 'first_snack' | 'first_s_grade' | 'first_month_complete'`
  - `resultQuality(score: number): ResultQuality`
  - `masteryLevel(xp: number): number`
  - `deriveCondition(stats: Stats): Condition`
  - `hydrateGameState(raw: unknown): GameState`

- [ ] **Step 1: Add types and V2 defaults**

Use initial values:

```ts
condition: 'normal',
mastery: {
  hunt: { xp: 0 }, magic: { xp: 0 }, rest: { xp: 0 }, herb: { xp: 0 },
},
personality: { courage: 20, kindness: 20, curiosity: 20, calmness: 20 },
memories: [],
lastGrowthReport: null,
```

- [ ] **Step 2: Add deterministic helper functions**

Use quality thresholds matching S/A/B/C score boundaries:

```ts
export function resultQuality(score: number): ResultQuality {
  if (score >= 900) return 'PERFECT';
  if (score >= 650) return 'GREAT';
  if (score >= 400) return 'GOOD';
  return 'NORMAL';
}
```

Use mastery thresholds `[0, 3, 7, 12, 18]` and cap display level at 5 for this slice.

Use condition rules:

```ts
if (stats.fatigue >= 70) return 'tired';
if (stats.stress <= 15 && stats.fatigue <= 25) return 'focused';
if (stats.fatigue <= 15) return 'energetic';
return 'normal';
```

- [ ] **Step 3: Add safe hydration**

`hydrateGameState(raw)` must:

1. return a fresh `initialState` clone for non-object/null input;
2. preserve valid legacy year/month/week/gold/gems/schedule/stats/screen/combo/trainingScore/lastChoice;
3. merge `mastery` per activity with defaults;
4. merge personality keys with defaults and clamp to 0–100;
5. filter memories to known IDs and de-duplicate them;
6. default missing/invalid condition and report values.

- [ ] **Step 4: Add mastery/personality/memory application helpers**

Activity personality deltas:

```ts
hunt: { courage: 3 },
magic: { curiosity: 3 },
rest: { calmness: 3 },
herb: { curiosity: 2, calmness: 1 },
```

Dialogue deltas:

```ts
hug: { kindness: 4 },
scold: { courage: 2, calmness: 1 },
snack: { kindness: 2 },
```

Mastery XP per scheduled activity: base `+1`; add `+1` to each scheduled activity when final quality is `GREAT` or `PERFECT`.

- [ ] **Step 5: Update `FINISH_TRAINING`**

Keep current stat effects and S/A/B/C bonus. Then:

- compute `quality` from `trainingScore`;
- grant mastery XP;
- apply activity personality deltas;
- award `first_training`;
- award `first_perfect` when quality is PERFECT;
- award `first_s_grade` when existing grade is S;
- derive post-training condition;
- move to `dialogue`.

- [ ] **Step 6: Update dialogue resolution**

Preserve current stat/gold behavior. Then:

- apply dialogue personality delta;
- award `first_hug` or `first_snack` as applicable;
- build `lastGrowthReport` from the before/after deltas;
- move to `result`.

- [ ] **Step 7: Update `NEXT_MONTH`**

Preserve month/year/gold behavior and V2 progression. Add `first_month_complete` once, reset combo/trainingScore, derive next condition, return to `hub`.

- [ ] **Step 8: Run tests**

Run:

```bash
npm run test
```

Expected: all existing and V2 tests pass.

- [ ] **Step 9: Commit**

Commit message:

```text
feat: add v2 growth state systems
```

---

### Task 4: Use save hydration in the app

**Files:**
- Modify: `src/App.tsx`
- Test: `src/game.test.ts` for hydration remains sufficient for pure behavior.

**Interfaces:**
- Consumes: `hydrateGameState` from `src/game.ts`.
- Produces: legacy-safe app startup from localStorage.

- [ ] **Step 1: Replace direct parsed-save use**

Change reducer initializer from raw `JSON.parse(...) || init` to:

```ts
init => {
  try {
    const raw = JSON.parse(localStorage.getItem('puppy-maker-save') || 'null');
    return hydrateGameState(raw);
  } catch {
    return hydrateGameState(null);
  }
}
```

- [ ] **Step 2: Run tests and build**

```bash
npm run test
npm run build
```

Expected: both pass locally/CI environment before UI work continues.

- [ ] **Step 3: Commit**

Commit message:

```text
fix: hydrate legacy saves into v2 state
```

---

### Task 5: Surface V2 feedback in the result screen

**Files:**
- Modify: `src/App.tsx`
- Modify: existing stylesheet used by result screen if required.

**Interfaces:**
- Consumes: `state.lastGrowthReport`, `resultQuality`, `masteryLevel`.
- Produces: a compact monthly result view that answers what improved and what was unlocked.

- [ ] **Step 1: Keep the existing grade hero**

Do not replace the current S/A/B/C visual. Add the player-facing quality label next to/under it.

- [ ] **Step 2: Replace the static result copy with report rows**

Show, when available:

```text
이번 달 성장
가장 성장한 능력: <stat> +<delta>
훈련 숙련도: <activity> Lv.<level>
성향 변화: <top tendency> +<delta>
새로운 기억: <memory title>
```

Render only rows with meaningful data; at most one memory row.

- [ ] **Step 3: Keep existing reward and next-month button**

Do not add a second result step or extra confirmation screen.

- [ ] **Step 4: Run tests/build**

```bash
npm run test
npm run build
```

- [ ] **Step 5: Commit**

Commit message:

```text
feat: show v2 growth feedback in monthly results
```

---

### Task 6: Surface condition and recommendation on LayeredHome

**Files:**
- Modify: `src/LayeredHome.tsx`
- Modify: `src/Root.tsx`
- Modify: `src/layered-home.css` only if spacing is required.

**Interfaces:**
- Consumes: current `GameState` or a minimal home-view model supplied from `App`/`Root`.
- Produces: dynamic condition label and one concise recommendation without adding a new permanent panel.

- [ ] **Step 1: Define a minimal home view model**

Prefer explicit props such as:

```ts
type HomeViewModel = {
  year: number;
  month: number;
  week: number;
  gold: number;
  gems: number;
  fatigue: number;
  condition: Condition;
  recentMemory?: MemoryId;
};
```

- [ ] **Step 2: Replace hard-coded home values where the state is already available**

Replace hard-coded date/currency/stamina values with the view model. Do not redesign the HUD.

- [ ] **Step 3: Add condition copy into existing dialogue/goal space**

Recommended labels:

```ts
energetic: '활기참',
normal: '평범함',
focused: '집중됨',
tired: '피곤함',
```

Recommended action logic:

```ts
tired -> '오늘은 휴식을 넣어보는 게 좋아요.'
focused -> '집중력이 좋아요. 마법 수업을 해볼까요?'
energetic -> '몸이 가벼워요. 사냥 훈련에 잘 맞는 날이에요.'
normal -> '오늘은 원하는 훈련을 골라도 좋아요.'
```

- [ ] **Step 4: Run build and verify mobile layout manually**

Check 390px-wide layout for clipping/overlap.

- [ ] **Step 5: Commit**

Commit message:

```text
feat: surface v2 condition and recommendations at home
```

---

### Task 7: Replace the DOM-based home bridge only after V2 flow is stable

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/Root.tsx`
- Modify: `src/LayeredHome.tsx`
- Test: add a focused screen-transition regression test if the current test environment can render React; otherwise preserve this task until browser verification can be automated.

**Interfaces:**
- Produces: explicit `screen`/navigation callbacks instead of `document.querySelector('.hub-screen')` and `MutationObserver`.

- [ ] **Step 1: Lift only the navigation visibility contract**

Expose from `App` either:

```ts
onScreenChange?: (screen: Screen) => void
```

or an equivalent controlled-screen callback without lifting the entire reducer unnecessarily.

- [ ] **Step 2: Replace `Root` DOM observation**

`Root` should set layered-home visibility from explicit screen updates, never DOM inspection.

- [ ] **Step 3: Replace schedule button DOM click**

Pass an explicit navigation function so `LayeredHome` can request `schedule` directly.

- [ ] **Step 4: Verify full regression flow**

```text
layered home
-> schedule
-> training
-> dialogue
-> result
-> next month
-> layered home
-> schedule again
```

- [ ] **Step 5: Commit**

Commit message:

```text
refactor: replace dom-based home bridge with explicit screen state
```

---

### Task 8: Final verification

**Files:**
- No source changes unless verification reveals a defect.

**Interfaces:**
- Produces: evidence-backed completion status.

- [ ] **Step 1: Run full test suite**

```bash
npm run test
```

Expected: PASS.

- [ ] **Step 2: Run production build**

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 3: Verify preview flow on a mobile viewport**

Check:

- dialogue not obscured by bottom navigation;
- Runa not overlapping dialogue badly;
- bottom navigation not cropped;
- HUD respects safe area;
- promo text not clipped;
- popup panels open/close;
- V2 result rows fit;
- condition/recommendation fits;
- next-month returns to layered home;
- schedule can be entered again.

- [ ] **Step 4: Verify deployment status**

Only report deployment success after Vercel reports READY for the exact commit/branch.

- [ ] **Step 5: Do not merge**

Leave PR/main untouched unless the user explicitly requests merging.
