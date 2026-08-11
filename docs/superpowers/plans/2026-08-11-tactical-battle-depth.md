# Tactical Battle Depth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing portrait 3v3 tactical battle screen into a deterministic, playable combat loop integrated with Puppy Maker growth and persistent encounter rewards.

**Architecture:** Keep `tactical-battle.ts` as session primitives. Add focused action, engine, AI, growth-adapter, encounter, and presentation modules. Persist only completed encounter records/reward claims through a thin outer game reducer wrapper; battle turns remain component/session state.

**Tech Stack:** TypeScript, React, Vitest, existing Vite build, existing GitHub Actions CI.

## Global Constraints
- Exactly 3 allies vs 3 enemies.
- Deterministic combat and AI; seed only breaks equal choices.
- Preserve existing growth/save/endgame systems.
- No PvP, gacha units, in-progress battle persistence, or new decorative character art.
- Do not merge PR #2 or main without explicit user instruction.

---

### Task 1: Tactical action definitions
**Files:** Create `src/tactical-actions.ts`, `src/tactical-actions.test.ts`.
**Produces:** `TacticalActionId`, `TacticalActionDefinition`, `tacticalActions`, `availableTacticalActions(unit)`, `validTacticalTargets(session,actorId,actionId)`.
- [ ] Write failing tests for AP/MP costs, melee back-row protection, support ally targeting, and special MP requirement.
- [ ] Verify RED.
- [ ] Implement four action families and deterministic target rules.
- [ ] Verify focused tests GREEN.
- [ ] Commit.

### Task 2: Turn/action engine
**Files:** Create `src/tactical-engine.ts`, `src/tactical-engine.test.ts`; use `src/tactical-battle.ts` types.
**Produces:** `resolveTacticalAction(session,input)`, `advanceTacticalRound(session)`, combat log entries.
- [ ] Write failing tests for damage, shield absorption, AP/MP changes, invalid-action no-op, round increment, AP refresh, regen/status expiry.
- [ ] Verify RED.
- [ ] Implement minimal deterministic resolver/status model.
- [ ] Verify GREEN + existing tactical tests.
- [ ] Commit.

### Task 3: Deterministic AI and AUTO
**Files:** Create `src/tactical-ai.ts`, `src/tactical-ai.test.ts`.
**Produces:** `chooseTacticalAiAction(session,actorId,seed)` and `resolveAutoTurn`.
- [ ] Test finishing low-HP targets, support threshold, full-MP special, stable equal-choice seed behavior.
- [ ] Verify RED.
- [ ] Implement rule-based AI using Task 1 target rules and Task 2 resolver.
- [ ] Verify GREEN.
- [ ] Commit.

### Task 4: Growth-to-unit adapter
**Files:** Create `src/tactical-growth.ts`, `src/tactical-growth.test.ts`.
**Produces:** `buildRunaTacticalUnit(state)`, `buildDefaultTacticalAllies(state)`.
- [ ] Test bounded contribution from strength/intelligence/affection, Calling role/special mapping, mastery bonus caps, and deterministic companion templates.
- [ ] Verify RED.
- [ ] Implement adapter without mutating GameState.
- [ ] Verify GREEN.
- [ ] Commit.

### Task 5: Encounter definitions and grading
**Files:** Create `src/tactical-encounters.ts`, `src/tactical-encounters.test.ts`.
**Produces:** `TacticalEncounterId`, encounter definitions, `gradeTacticalBattle`, `tacticalEncounterReward`, `updateTacticalRecord`.
- [ ] Test deterministic enemy teams, S/A/B/C grading, first-clear vs replay rewards, best-grade/best-round updates.
- [ ] Verify RED.
- [ ] Implement encounter/reward pure domain.
- [ ] Verify GREEN.
- [ ] Commit.

### Task 6: Persistent reducer integration
**Files:** Create `src/tactical-progression.test.ts`; modify outer game wrapper only, preserving the current game engine as a base blob/module if necessary.
**State:** `tacticalBattleRecords`, `claimedTacticalFirstClears`.
**Action:** `COMPLETE_TACTICAL_BATTLE` with encounter/result summary.
- [ ] Test hydration sanitization, first-clear one-time reward, replay reward, best record update, duplicate first-clear no duplicate bonus, RESET defaults.
- [ ] Verify RED while all existing tests remain GREEN.
- [ ] Integrate via thin wrapper; do not rewrite current endgame reducer.
- [ ] Verify full test/build GREEN.
- [ ] Commit.

### Task 7: UI presentation model
**Files:** Modify `src/tactical-ui.ts`; add/update `src/tactical-ui.test.ts`.
**Produces:** active actor, AP/MP, statuses, action availability, selectable targets, recent action log, result summary.
- [ ] Write RED tests for action disabled states, selected target validity, status labels, result display model.
- [ ] Implement pure presentation mapping.
- [ ] Verify GREEN.
- [ ] Commit.

### Task 8: Playable TacticalBattleScreen
**Files:** Modify `src/TacticalBattleScreen.tsx`, `src/tactical-battle.css`.
- [ ] Wire active unit, target selection, four actions, AP/MP bars, statuses, action log, AUTO, speed control, victory/defeat panel, retry/exit callbacks.
- [ ] Keep current portrait layout and existing non-decorative CSS approach; do not invent character illustrations.
- [ ] Run full tests and `npm run build` in CI.
- [ ] Commit.

### Task 9: Final regression and PR/deploy verification
- [ ] Verify latest exact-head GitHub Actions test/build SUCCESS.
- [ ] Verify Vercel exact latest SHA success/READY if present; do not claim if feed lags.
- [ ] Update Draft PR #2 body with tactical battle scope and exact verified counts.
- [ ] Confirm PR remains draft/open/unmerged.
