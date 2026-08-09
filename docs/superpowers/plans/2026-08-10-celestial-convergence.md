# Celestial Convergence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a deterministic post-Astral-Rift Celestial Convergence endgame with 12 challenges, Guardian Sigils, Boons, weekly directives, honors, persistence and integrated UI.

**Architecture:** Keep all challenge/reward rules in focused pure modules. Add persistence and actions only in the top `game.ts` layer so lower Sanctuary/Astral systems remain unchanged. Extend the existing late-game overlay rather than adding another home entry.

**Tech Stack:** TypeScript, React, Vitest, Vite.

## Global Constraints
- Do not merge PR #2 or main.
- Existing game flow and Astral Rift behavior must remain unchanged.
- Every behavior change follows RED -> implementation -> GREEN + build.
- Decorative UI must reuse image assets; do not draw fantasy decoration in CSS.
- Failed challenge attempts and invalid purchases return the exact same state object.

---

### Task 1: Convergence challenge domain
**Files:** Create `src/celestial-convergence.test.ts`, `src/celestial-convergence.ts`.

**Interfaces:**
- Produces `CelestialGuardianId`, `ConvergenceIntensity`, `ConvergenceRecordMap`.
- Produces `convergencePower(input)`, `canEnterConvergence(input)`, `resolveConvergence(...)`, `updateConvergenceRecord(...)`.

- [ ] Write tests for four guardians, 12 challenge keys, entry gates, deterministic power, B/A/S resolution, first-clear bonus and best-record updates.
- [ ] Verify RED because module is absent.
- [ ] Implement definitions and pure functions.
- [ ] Verify tests and production build GREEN.
- [ ] Commit `feat: add celestial convergence challenges`.

### Task 2: Guardian Sigil boon track
**Files:** Create `src/guardian-boons.test.ts`, `src/guardian-boons.ts`.

**Interfaces:**
- Produces `GuardianBoonId`, `guardianBoons`, `resolveGuardianBoonPurchase(input)`.

- [ ] Test eight sequential boon costs, prerequisite order, insufficient Sigils, duplicate purchase and immediate rewards.
- [ ] Verify RED.
- [ ] Implement minimal sequential purchase resolver.
- [ ] Verify GREEN + build.
- [ ] Commit `feat: add guardian boon track`.

### Task 3: Weekly Convergence directives
**Files:** Create `src/convergence-weekly.test.ts`, `src/convergence-weekly.ts`.

**Interfaces:**
- Produces `convergenceWeeklyKey(year,month,week)`, `convergenceWeeklyDirectives(...)`, `advanceConvergenceWeekly(input)`.

- [ ] Test deterministic three-directive rotation, progress caps and deduped +2 Sigil rewards.
- [ ] Verify RED.
- [ ] Implement directive generator/progression.
- [ ] Verify GREEN + build.
- [ ] Commit `feat: add convergence weekly directives`.

### Task 4: Convergence honors
**Files:** Create `src/convergence-honors.test.ts`, `src/convergence-honors.ts`.

**Interfaces:**
- Produces `ConvergenceHonorId`, `convergenceHonors`, `newlyEarnedConvergenceHonors(records,claimed)`.

- [ ] Test first clear, four guardians, intensity-3 quartet, and all-S honors with dedupe.
- [ ] Verify RED.
- [ ] Implement honor progress/reward definitions.
- [ ] Verify GREEN + build.
- [ ] Commit `feat: add convergence honors`.

### Task 5: GameState and reducer integration
**Files:** Create `src/convergence-progression.test.ts`; modify `src/game.ts`.

**Interfaces:**
- New fields `celestialConvergenceRecords`, `guardianSigils`, `purchasedGuardianBoons`, `convergenceWeeklyKey`, `convergenceWeeklyProgress`, `rewardedConvergenceDirectives`, `claimedConvergenceHonors`.
- New actions `CLEAR_CELESTIAL_CONVERGENCE`, `PURCHASE_GUARDIAN_BOON`.

- [ ] Test safe hydration/sanitization, failed challenge same-state, successful clear record+Sigils, weekly rewards, honors, boon purchase and persistence through base actions.
- [ ] Verify RED.
- [ ] Implement sanitizers, state defaults, reducer branches and top-layer preservation.
- [ ] Verify full suite + production build GREEN.
- [ ] Commit `feat: integrate celestial convergence progression`.

### Task 6: Late-game UI integration
**Files:** Create `src/convergence-ui.test.ts`, `src/convergence-ui.ts`; modify the existing Sanctuary/Astral late-game overlay, its CSS, `App.tsx`, and `Root.tsx` only as required by current callback patterns.

**Interfaces:**
- Produces `convergenceUiSummary(state)` with power, Sigils, guardian/intensity states, records, directives, boons and honors.

- [ ] Test summary model first (RED).
- [ ] Implement summary model (GREEN).
- [ ] Add Convergence section using existing panel/frame assets.
- [ ] Wire clear/purchase callbacks through existing App/Root reducer bridge.
- [ ] Run full suite and production build.
- [ ] Verify exact latest GitHub CI and Vercel SHA if deployment appears.
- [ ] Update Draft PR #2 body, keep draft/unmerged.
