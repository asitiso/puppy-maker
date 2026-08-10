# Sanctuary Legacy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn Celestial Convergence into a persistent, low-friction Sanctuary Legacy loop with ranks, selectable paths, batch milestones and a single steward recommendation.

**Architecture:** Add three pure Legacy domain modules and one reducer wrapper above the current Convergence/endgame layer. Persist only the selected path and claimed milestone ids; derive score/rank/completion/recommendation. Extend the existing Sanctuary overlay rather than creating navigation.

**Tech Stack:** React 19, TypeScript, Vitest, Vite, existing reducer/state modules.

## Global Constraints
- Work only on `feat/v2-core-growth`; do not merge PR #2 or main.
- No new spendable currency, daily Legacy quests, rerolls, inventory, destructive prestige/reset, or top-level navigation.
- Preserve existing Convergence, Ascension, Sanctuary, Calling and Rift save fields.
- Unknown persisted ids hydrate safely and duplicates collapse.
- TDD for domain and reducer behavior; full tests/build/CI before completion claim.

---

### Task 1: Legacy score, ranks and paths
**Files:** Create `src/sanctuary-legacy.ts`; Test `src/sanctuary-legacy.test.ts`.
**Produces:** `legacyScore`, `legacyRank`, `legacyPathEffects`, `SanctuaryLegacyPathId`.
- [ ] RED: score clamps 0..100 and weighted inputs reach expected boundaries.
- [ ] RED: rank thresholds are Hearth 0, Beacon 20, Chronicle 40, Mythic 65, Eternal 85.
- [ ] RED: Mentor/Wayfarer/Keeper effects remain modest and mutually exclusive.
- [ ] Implement pure functions; run focused tests GREEN.

### Task 2: Twelve milestones and batch rewards
**Files:** Create `src/sanctuary-legacy-milestones.ts`; Test `src/sanctuary-legacy-milestones.test.ts`.
**Produces:** milestone definitions, `completedLegacyMilestones`, `claimableLegacyMilestones`, `legacyRewardTotal`.
- [ ] RED: threshold, Convergence breadth/intensity, boon, Celestial rank, Ascension, Calling and Rift conditions.
- [ ] RED: claimed ids dedupe and batch totals include only completed unclaimed milestones.
- [ ] Implement 12 deterministic milestones with gold/gem rewards only; run GREEN.

### Task 3: Steward recommendation
**Files:** Create `src/sanctuary-legacy-steward.ts`; Test `src/sanctuary-legacy-steward.test.ts`.
**Produces:** `sanctuaryLegacyRecommendation(input)` returning one target/label/reason/progress or null.
- [ ] RED: claimable reward wins priority.
- [ ] RED: otherwise choose reachable Convergence improvement, then cheapest boon, then near Sanctuary/Ascension threshold, then Calling/Rift breadth.
- [ ] Implement effort-to-impact selector with no automatic spending; run GREEN.

### Task 4: Reducer and persistence integration
**Files:** Create `src/game-sanctuary-legacy-base.ts`, `src/game-sanctuary-legacy-base.test.ts`; modify the current top-level `src/game.ts` delegation only as required.
**Consumes:** current Convergence/endgame reducer state/actions plus Tasks 1-3.
- [ ] RED: old saves hydrate `sanctuaryLegacyPath:null` and empty claimed ids; malformed ids sanitize.
- [ ] RED: `SELECT_SANCTUARY_LEGACY_PATH` switches freely without resource cost.
- [ ] RED: `CLAIM_SANCTUARY_LEGACY_REWARDS` batches all crossed rewards and is idempotent.
- [ ] RED: Mentor boosts only positive training gains; Wayfarer adds journey on accepted expedition/Convergence clear; Keeper improves month recovery/journey.
- [ ] Implement wrapper, preserve RESET and existing action identity semantics; run focused + regression tests.

### Task 5: Sanctuary UI integration
**Files:** Modify current Sanctuary/Convergence overlay component and its stylesheet; modify App/Root callback wiring only if current reducer dispatch is not already available.
- [ ] Add compact Legacy rank/score display.
- [ ] Add three path choices with concise effect copy and free-switch messaging.
- [ ] Add one Steward recommendation card.
- [ ] Add milestone progress summary and one batch-claim button; do not render 12 repetitive claim buttons.
- [ ] Keep Convergence and earlier Sanctuary content intact; no new home navigation destination.
- [ ] Run TypeScript build and relevant UI/source contract tests.

### Task 6: Verification and PR documentation
- [ ] Run all Vitest tests and record exact test/file totals.
- [ ] Run `npm run build` (`tsc -b && vite build`) and record result.
- [ ] Verify GitHub Actions on exact latest head is success; inspect failed job logs and fix without asking for routine approval if not.
- [ ] Review PR diff for accidental main merge, destructive save renames, new currency or unrelated scope.
- [ ] Update Draft PR #2 body with Sanctuary Legacy scope and exact verification evidence; keep draft/unmerged.
