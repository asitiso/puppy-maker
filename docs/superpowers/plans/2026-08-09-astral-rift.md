# Astral Rift Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a repeatable Celestial Ascension endgame challenge with 18 rift/intensity clears, Rift Echo currency, nine permanent relics, deterministic weekly directives, honors, persistent records, and Sanctuary UI.

**Architecture:** Keep existing raising/Sanctuary/Astral engines unchanged. Add small pure Astral Rift modules and integrate them through the current outer reducer layer, preserving old state on every action. UI consumes one presentation summary and dispatches explicit actions.

**Tech Stack:** TypeScript, React, Vitest, Vite, existing reducer/localStorage save system.

## Global Constraints
- Preserve existing monthly raising, expedition, Sanctuary, Astral Trial, and Celestial Ascension flows.
- No online leaderboard.
- No new decorative CSS illustration; reuse existing panel artwork.
- Invalid/duplicate reducer operations must return the same state object.
- Legacy saves must hydrate all new fields safely.
- Follow RED -> GREEN -> full regression/build for every behavior batch.

---

### Task 1: Astral Rift domain

**Files:**
- Create: `src/astral-rift.test.ts`
- Create: `src/astral-rift.ts`

**Interfaces:**
- Produces: `AstralRiftId`, `AstralRiftIntensity`, `AstralRiftGrade`, `astralRiftDefinitions`, `astralRiftPower(input)`, `astralRiftChallenge(riftId,intensity)`, `canEnterAstralRift(...)`, `resolveAstralRift(...)`, `updateAstralRiftRecord(...)`.

- [ ] Write tests for six definitions, Ascension thresholds, intensity sequencing, power formula, S/A/B/C grading, Echo rewards, and best-record upgrades.
- [ ] Run CI and confirm only the new domain tests fail for missing implementation.
- [ ] Implement deterministic domain logic.
- [ ] Run CI and confirm domain tests plus production build pass.
- [ ] Commit.

### Task 2: Rift Relics

**Files:**
- Create: `src/astral-rift-relics.test.ts`
- Create: `src/astral-rift-relics.ts`

**Interfaces:**
- Produces: `AstralRiftRelicId`, `astralRiftRelics`, `resolveAstralRiftRelicPurchase({relicId,echoes,purchased})`.

- [ ] Write tests for 9 relics, 15/30/50 costs, branch prerequisites, insufficient Echoes, and duplicate no-op.
- [ ] Verify RED in CI.
- [ ] Implement purchase resolver.
- [ ] Verify GREEN + build.
- [ ] Commit.

### Task 3: Weekly Rift directives

**Files:**
- Create: `src/astral-rift-weekly.test.ts`
- Create: `src/astral-rift-weekly.ts`

**Interfaces:**
- Produces: `AstralRiftDirectiveId`, `astralRiftWeeklyKey(year,month,week)`, `astralRiftWeeklyDirectives(...)`, `advanceAstralRiftWeekly(...)`.

- [ ] Test deterministic 3-directive generation, featured-rift rotation, capped progress, reward dedupe, and A-or-better matching.
- [ ] Verify RED.
- [ ] Implement deterministic progression.
- [ ] Verify GREEN + build.
- [ ] Commit.

### Task 4: Rift honors

**Files:**
- Create: `src/astral-rift-honors.test.ts`
- Create: `src/astral-rift-honors.ts`

**Interfaces:**
- Produces: `AstralRiftHonorId`, `astralRiftHonorProgress(records)`, `newlyEarnedAstralRiftHonors(records,claimed)`.

- [ ] Test first clear, six unique rifts, six unique S rifts, all 18 combinations, and claimed filtering.
- [ ] Verify RED.
- [ ] Implement honor progress/rewards.
- [ ] Verify GREEN + build.
- [ ] Commit.

### Task 5: Persistent state and reducer integration

**Files:**
- Create: `src/astral-rift-progression.test.ts`
- Modify: current outer `src/game.ts` or create `src/game-astral-rift-base.ts` plus thin `src/game.ts` if needed.

**Interfaces:**
- GameState adds `astralRiftRecords`, `astralRiftEchoes`, `purchasedAstralRiftRelics`, `astralRiftWeeklyKey`, `astralRiftWeeklyProgress`, `rewardedAstralRiftDirectives`, `claimedAstralRiftHonors`.
- Actions add `CLEAR_ASTRAL_RIFT` and `PURCHASE_ASTRAL_RIFT_RELIC`.

- [ ] Test hydration sanitization, successful clear, failed C clear no reward, best-record persistence, first-clear reward once, weekly progression, honor auto-pay, relic purchase, invalid/duplicate same-object no-op, and preservation across unrelated actions/month/year transitions.
- [ ] Verify RED with all previous tests still passing.
- [ ] Implement a thin persistence/reducer wrapper without rewriting inner engines.
- [ ] Verify GREEN + build.
- [ ] Commit.

### Task 6: UI summary

**Files:**
- Create: `src/astral-rift-ui.test.ts`
- Create: `src/astral-rift-ui.ts`

**Interfaces:**
- Produces: `astralRiftUiSummary(state)` including power, Echoes, rifts/intensities, weekly directives, relics, honors.

- [ ] Test locked/unlocked state, record display, available relic purchase, directive progress, honor progress.
- [ ] Verify RED.
- [ ] Implement pure presentation model.
- [ ] Verify GREEN + build.
- [ ] Commit.

### Task 7: Sanctuary Astral Rift UI

**Files:**
- Modify: `src/SanctuaryOverlay.tsx`
- Modify: relevant Sanctuary CSS file.
- Modify: `src/App.tsx` and `src/Root.tsx` only for explicit action callbacks if the overlay does not already receive reducer dispatchers.

**Interfaces:**
- Consumes `astralRiftUiSummary`.
- Dispatches `CLEAR_ASTRAL_RIFT` and `PURCHASE_ASTRAL_RIFT_RELIC`.

- [ ] Add a failing UI/presentation contract test only where behavior can be tested without brittle DOM snapshots.
- [ ] Add a Sanctuary section for Rift power, six rifts × three intensities, Echo balance, directives, relics, and honors.
- [ ] Reuse `/ui/popup_panel_frame.png` or existing Sanctuary panel assets; CSS only handles layout/readability.
- [ ] Verify full tests + production build.
- [ ] Commit.

### Task 8: Final verification and PR/deployment metadata

**Files:**
- Modify: PR #2 body only after GREEN.

- [ ] Fetch fresh latest-head GitHub CI and confirm exact test/build results.
- [ ] Fetch exact latest SHA Vercel status; claim READY only if the SHA matches.
- [ ] Update Draft PR #2 scope/verification while keeping it draft/open/unmerged.
- [ ] Do not merge.
