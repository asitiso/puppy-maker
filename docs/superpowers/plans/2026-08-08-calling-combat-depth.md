# Calling Combat Depth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn all existing Guardian Calling signatures and Legend traits into real expedition/exploration effects and award Calling mastery from specialist expedition play.

**Architecture:** Keep battle calculation pure in `expedition-combat.ts`, keep reward/dedupe logic in a focused `calling-depth-effects.ts`, and let `game.ts` only orchestrate persistent state transitions. `GuardianExpeditionOverlay.tsx` passes deterministic action counts and renders concise result feedback. Existing monthly loop and storage stay intact.

**Tech Stack:** React 19, TypeScript, Vitest, Vite, existing reducer/state modules.

## Global Constraints
- Work only on `feat/v2-core-growth`.
- Do not merge PR #2 or main/master.
- No new currency, region, stage, or full-screen navigation hierarchy.
- Decorative/character visuals remain image assets; do not create CSS illustration substitutes.
- Legacy saves must hydrate safely.
- TDD before implementation and full CI/build verification before completion.

---

### Task 1: Signature-aware expedition combat

**Files:**
- Modify: `src/expedition-combat.ts`
- Test: `src/calling-depth-combat.test.ts`
- Modify: `src/GuardianExpeditionOverlay.tsx`

**Interfaces:**
- Extend `ExpeditionCombatInput` with `signatures: readonly CallingSignatureId[]` and `boss: boolean`.
- Extend `ExpeditionBattleState` with `actionKinds: Record<ExpeditionActionKind, number>`.
- Existing callers without signatures preserve existing scores.

- [ ] Write failing tests proving first attack/charge/dodge and boss signature bonuses.
- [ ] Run CI and verify only the new tests fail.
- [ ] Implement bounded signature multipliers in `applyExpeditionAction`.
- [ ] Pass active signatures and boss flag from `GuardianExpeditionOverlay`.
- [ ] Run full tests/build and commit.

### Task 2: Persistent Legend reward dedupe

**Files:**
- Create: `src/calling-depth-effects.ts`
- Modify: `src/raising-depth-state.ts`
- Test: `src/calling-depth-effects.test.ts`
- Test: `src/raising-depth-progression.test.ts`

**Interfaces:**
- Persist `legendRewardKeys: string[]`.
- Export `legendRewardKey(year, month, effectId)`.
- Export pure helpers for Vanguard/Arcanist/Caretaker/Pathfinder Legend effects.

- [ ] Write hydration and one-shot reward failing tests.
- [ ] Run CI to confirm RED.
- [ ] Add safe hydration/pick/empty defaults.
- [ ] Implement pure one-shot Legend helpers.
- [ ] Run tests/build and commit.

### Task 3: Expedition reward signatures and specialist mastery

**Files:**
- Modify: `src/game.ts`
- Test: `src/calling-depth-progression.test.ts`
- Modify: `src/App.tsx`
- Modify: `src/Root.tsx`
- Modify: `src/GuardianExpeditionOverlay.tsx`

**Interfaces:**
- Extend `FINISH_EXPEDITION_STAGE` action with `actionKinds`.
- Award +1 active Calling mastery at most once per accepted stage clear when specialist criteria are met.
- Apply `trail_reading`, `star_compass`, `heart_anchor`, Vanguard Legend, Arcanist Legend.
- Extend `ExpeditionFinishSummary` presentation metadata only through a small UI-side derived summary; do not mutate expedition core reward contracts unnecessarily.

- [ ] Write RED tests for specialist mastery and reward effects.
- [ ] Implement reducer orchestration.
- [ ] Pass battle action counts from overlay through App/Root callback.
- [ ] Run tests/build and commit.

### Task 4: Pathfinder discovery and Caretaker bond Legend

**Files:**
- Modify: `src/game.ts`
- Test: `src/calling-depth-progression.test.ts`

**Interfaces:**
- `pathfinder_eye` evaluates outing outcome using `explorationXp + 3` without changing stored XP gain.
- `pathfinder_legend` grants +100G once per month on the first newly discovered outing item.
- `caretaker_legend` reduces stress by 4 when a new bond scene is unlocked, once per scene transition.

- [ ] Add failing tests for accelerated discovery and Legend one-shot behavior.
- [ ] Implement minimal reducer integration.
- [ ] Run tests/build and commit.

### Task 5: Identity and expedition feedback UI

**Files:**
- Modify: `src/RaisingIdentityOverlay.tsx`
- Modify: `src/GuardianExpeditionOverlay.tsx`
- Modify: `src/raising-identity.css`
- Modify: `src/expedition-ui.css`

**Interfaces:**
- Show active signatures and Legend status in Raising Identity.
- Show a compact Calling feedback line in expedition result when relevant.

- [ ] Add source-level UI contract tests only if an existing pattern exists; otherwise rely on TypeScript build plus existing component contracts.
- [ ] Implement concise UI using existing image assets and text.
- [ ] Run full tests/build.
- [ ] Verify latest GitHub Actions CI success and latest Vercel deployment READY.
- [ ] Update draft PR body without merging.
