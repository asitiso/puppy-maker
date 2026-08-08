# World Progression Mega Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add persistent regional renown, seasonal expedition progression, monthly world events, and world contracts that extend the existing raising/expedition loop.

**Architecture:** Pure rule modules own calculations and sanitization; `game.ts` owns persisted state and reducer integration; `GuardianExpeditionOverlay.tsx` renders compact feedback from state and the latest expedition result. All rewards are additive and deduped by stable keys.

**Tech Stack:** TypeScript, React, Vitest, existing Vite app and GitHub Actions CI.

## Global Constraints
- Preserve existing game flow and existing reward systems.
- Do not merge PR #2 or any base branch without explicit user instruction.
- Decorative art must reuse image assets; no CSS-created substitute artwork.
- Every behavior change follows RED → GREEN → refactor.

---

### Task 1: Regional Renown Rules
**Files:**
- Create: `src/regional-renown.test.ts`
- Create: `src/regional-renown.ts`

**Interfaces:**
- Produces `RegionalRenownState`, `emptyRegionalRenown()`, `renownGainForExpedition()`, `regionalRenownLevel()`, `regionalRenownReward()`.

- [ ] Write tests for grade gain, boss bonus, thresholds, and rewards.
- [ ] Run CI and verify missing-module RED.
- [ ] Implement minimal pure rules.
- [ ] Verify tests GREEN.
- [ ] Commit.

### Task 2: Expedition Season Rules
**Files:**
- Create: `src/expedition-season.test.ts`
- Create: `src/expedition-season.ts`

**Interfaces:**
- Produces `expeditionSeasonKey()`, `expeditionSeasonPoints()`, `expeditionSeasonTiers`, and stable claim keys.

- [ ] Write failing tests for season mapping, points, and tier claims.
- [ ] Verify RED.
- [ ] Implement pure rules.
- [ ] Verify GREEN.
- [ ] Commit.

### Task 3: World Event and Contract Rules
**Files:**
- Create: `src/world-event.test.ts`
- Create: `src/world-event.ts`
- Create: `src/world-contracts.test.ts`
- Create: `src/world-contracts.ts`

**Interfaces:**
- `worldEvent(year, month)` returns deterministic featured region/event.
- `monthlyWorldContracts(year, month)` returns three deterministic contracts.
- `advanceWorldContracts()` applies one expedition result and returns newly completed rewards.

- [ ] Write RED tests for deterministic rotation and contract completion.
- [ ] Verify RED.
- [ ] Implement minimal pure rules.
- [ ] Verify GREEN.
- [ ] Commit.

### Task 4: Persistent State + Expedition Integration
**Files:**
- Modify: `src/game.ts`
- Create: `src/world-progression.test.ts`

**Interfaces:**
- Add `regionalRenown`, `rewardedRenownLevels`, `expeditionSeasonScores`, `claimedExpeditionSeasonTiers`, `worldContractProgress`, `rewardedWorldContracts` to `GameState`.
- `FINISH_EXPEDITION_STAGE` applies renown, season points, event bonus, contract progress, and one-time rewards.
- `NEXT_MONTH` resets only monthly contract progress.

- [ ] Write reducer tests first, including legacy hydration and dedupe.
- [ ] Verify RED.
- [ ] Implement state hydration and reducer integration.
- [ ] Verify full suite GREEN.
- [ ] Commit.

### Task 5: Expedition World Progress UI
**Files:**
- Modify: `src/GuardianExpeditionOverlay.tsx`
- Modify: `src/expedition-ui.css`

**Interfaces:**
- Render current world event, season track, regional renown, and contract cards.
- Result view displays additive world-progress feedback.

- [ ] Add pure display-model tests if transformation logic is needed.
- [ ] Wire UI from existing state without changing reward behavior.
- [ ] Verify production build.
- [ ] Commit.

### Task 6: Final Verification + PR/Vercel
- [ ] Run full GitHub Actions test/build on final head.
- [ ] Confirm exact passing test count and production build output.
- [ ] Update draft PR #2 scope and verification section.
- [ ] Check Vercel deployment for final head; report exact state without guessing.
