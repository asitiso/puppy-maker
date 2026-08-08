# Monthly Challenges & Growth Streak Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing Mission shortcut into a real monthly objective system with automatic exact-once rewards and a consecutive completed-month growth streak.

**Architecture:** Put pure mission definitions and completion logic in `src/monthly-missions.ts`. Extend the current exploration wrapper in `src/game.ts` with counters/reward state while preserving `game-core.ts`. Reuse the existing LayeredHome mission popup for progress display; no new screen or artwork.

**Tech Stack:** React, TypeScript, Vitest, Vite.

## Global Constraints
- Monthly goals are training 1 time, outing 2 times, gift 1 time.
- Rewards: training 120G, outing 1 gem, gift 100G.
- Rewards auto-grant exactly once per month.
- Full completion before NEXT_MONTH increments growthStreak; incomplete month resets it to 0.
- Every third consecutive completed month grants 3 bonus gems.
- No daily login dependency, new currency, battle pass, new screen, or CSS artwork.
- Preserve existing save compatibility and no-op reducer identity.

---

### Task 1: Pure monthly mission rules
**Files:**
- Create: `src/monthly-missions.ts`
- Create: `src/monthly-missions.test.ts`

**Interfaces:**
- Produces `MonthlyMissionId`, `MonthlyCounters`, `monthlyMissionDefinitions`, `emptyMonthlyCounters()`, `completedMonthlyMissions(counters)`.

- [ ] Write threshold and completion tests.
- [ ] Verify RED in CI.
- [ ] Implement pure definitions/helpers.
- [ ] Verify GREEN in CI.

### Task 2: Persistent counters and exact-once rewards
**Files:**
- Modify: `src/game.ts`
- Create: `src/monthly-progression.test.ts`

**Interfaces:**
- Add `monthlyCounters`, `rewardedMonthlyMissions`, `growthStreak` to extended `GameState`.
- Existing TRAINING/OUTING/GIFT actions update counters only when the action actually succeeds.

- [ ] Write hydration, exact-once reward, empty gift no-op, outing threshold, month reset, streak increment/reset, and 3-streak bonus tests.
- [ ] Verify RED.
- [ ] Implement minimal wrapper logic.
- [ ] Verify all tests/build GREEN.

### Task 3: Mission popup integration
**Files:**
- Modify: `src/LayeredHome.tsx`

- [ ] Convert `mission` from static panel to dynamic monthly challenge panel.
- [ ] Show streak, progress, targets, rewards and reward-completed state.
- [ ] Run full tests/build.

### Task 4: Final verification
- [ ] Confirm PR #2 remains Draft/Open/unmerged.
- [ ] Confirm latest CI test/build is successful.
- [ ] Confirm latest Vercel branch deployment is READY.
