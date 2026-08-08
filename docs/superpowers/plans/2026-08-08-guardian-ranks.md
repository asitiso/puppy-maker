# Guardian Rank Progression Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a five-stage guardian rank that summarizes long-term progress and automatically grants one-time rank-up rewards.

**Architecture:** Keep rank math in `src/guardian-rank.ts`, persist only rewarded rank IDs in the extended `src/game.ts` wrapper, and derive the current rank from existing progress. Reuse the layered home identity and bond panel; do not create rank artwork in CSS.

**Tech Stack:** React, TypeScript, Vitest, Vite.

## Global Constraints
- Rank thresholds: 0/8/16/28/42.
- Points: memory 1, skill 2, discovery 1, mastery levels above Lv1 1 each.
- Rank rewards: junior 1 gem, guardian 2, veteran 3, starlight 5.
- Rewards must be automatic and exact-once.
- No new currency, reset loop, or CSS character artwork.

---

### Task 1: Pure rank rules
**Files:** Create `src/guardian-rank.ts`, `src/guardian-rank.test.ts`.
- [ ] Define RED tests for points, thresholds and next rank.
- [ ] Implement pure rules.
- [ ] Verify GREEN.

### Task 2: Reward persistence
**Files:** Modify `src/game.ts`, create `src/guardian-rank-progression.test.ts`.
- [ ] Test hydration, automatic missing reward reconciliation, exact-once behavior and month persistence.
- [ ] Implement rewarded rank state and post-action reconciliation.
- [ ] Verify full suite/build.

### Task 3: Home integration
**Files:** Modify `src/LayeredHome.tsx`.
- [ ] Replace hardcoded home level identity with rank label/points.
- [ ] Add rank progress to bond panel.
- [ ] Verify CI/build and Vercel preview.
