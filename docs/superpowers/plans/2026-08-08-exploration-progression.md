# Exploration Progression Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add repeatable exploration levels, location-specific random events, and permanent hidden discoveries to the existing outing system.

**Architecture:** Keep pure exploration rules in `src/adventure.ts`, persist exploration XP/discoveries through `src/game.ts`, and surface the data/actions in the existing `LayeredHome` outing popup. Do not add a new screen, new currency, or CSS-rendered scene artwork.

**Tech Stack:** React, TypeScript, Vitest, Vite.

## Global Constraints
- Preserve the three existing outing locations.
- Preserve existing outing rewards, inventory, memories, and legacy saves.
- No separate map screen or new currency.
- Exploration level is 1-5 with XP thresholds 0/3/7/12/18.
- Permanent discoveries never duplicate.
- Use TDD and verify every implementation commit with CI.

---

### Task 1: Pure exploration rules
**Files:**
- Modify: `src/adventure.ts`
- Create: `src/exploration.test.ts`

**Interfaces:**
- Produces `ExplorationEventId`, `DiscoveryId`, `explorationLevel(xp)`, `pickExplorationOutcome(location, xp, discoveries, roll)`.

- [ ] Write tests for level thresholds, common/advanced event eligibility, no-event outcome, discovery thresholds, and discovery uniqueness.
- [ ] Run CI and verify only new exploration tests fail.
- [ ] Implement the minimum pure functions and definitions.
- [ ] Run CI and verify all tests/build pass.
- [ ] Commit.

### Task 2: Persistent exploration progression
**Files:**
- Modify: `src/game.ts`
- Create: `src/exploration-progression.test.ts`

**Interfaces:**
- Add `explorationXp: Record<OutingLocationId, number>` and `discoveries: DiscoveryId[]` to `GameState`.
- Extend `GO_OUTING` with optional `eventRoll`.

- [ ] Write tests for legacy hydration defaults, malformed-data sanitization, XP gain per outing, event application, discovery persistence, and RESET behavior.
- [ ] Run CI and verify new tests fail for missing state/progression.
- [ ] Add hydrated state fields and update GO_OUTING to call `pickExplorationOutcome` while preserving existing outing rewards.
- [ ] Run CI and verify all tests/build pass.
- [ ] Commit.

### Task 3: Existing home popup integration
**Files:**
- Modify: `src/App.tsx`
- Modify: `src/Root.tsx`
- Modify: `src/LayeredHome.tsx`

**Interfaces:**
- `onGoOuting(location, eventRoll)` dispatches exploration.
- Outing popup displays level, XP-to-next-level, latest event/discovery feedback, and total discoveries.

- [ ] Extend outing callback signature to accept the random roll.
- [ ] Add labels for exploration events/discoveries.
- [ ] Show `Lv.N`, XP progress and discoveries `x/6` in the existing outing popup.
- [ ] Keep popup open after an outing and show the latest result locally based on before/after state.
- [ ] Run CI and production build.
- [ ] Commit.

### Task 4: Final verification
- [ ] Confirm all Vitest suites pass.
- [ ] Confirm `tsc -b && vite build` succeeds.
- [ ] Confirm PR #2 remains Draft/Open and unmerged.
- [ ] Confirm latest Vercel deployment for the branch is READY.
