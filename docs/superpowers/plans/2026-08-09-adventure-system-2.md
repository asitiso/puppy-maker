# Adventure System 2.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade all ten adventures into distinct, replayable mobile minigames with shared mastery, progression, rewards, persistence and a five-phase Guardian trial.

**Architecture:** Preserve the five deterministic engines and layer stage rules, difficulty, mastery and Guardian phase orchestration above them. Keep permanent state/rewards in world-state/reducer and presentation in AdventureRunner so game logic remains testable without React.

**Tech Stack:** React, TypeScript, Vitest, Vite, CSS, existing Puppy Maker world-state/save/reducer architecture.

## Global Constraints
- Work only on `feat/vertical-slice`; never merge PR #1 or main.
- Preserve the schedule → training → dialogue → result → next month → Layered Home loop.
- TDD: failing behavior test before production behavior change.
- No new economy; reuse existing gold/material/collection structures.
- One-hand portrait mobile play; primary controls >=48px.
- In-progress minigame state is not persisted and cancellation does not consume an adventure.
- Verify full test suite and production build before claiming success.

---

## File map
- Modify `src/game/adventure/runtime.ts`: shared session mechanics, streak/fever, phase-safe helpers.
- Modify `src/game/adventure/runtime.test.ts`: deterministic engine/mastery tests.
- Create `src/game/adventure/rules.ts`: ten stage identities, month difficulty and stat-assist configuration.
- Create `src/game/adventure/rules.test.ts`: stage/difficulty/assist contract tests.
- Create `src/game/adventure/guardian.ts`: five-phase Guardian orchestration and aggregate scoring.
- Create `src/game/adventure/guardian.test.ts`: phase progression/failure tolerance tests.
- Modify `src/game/adventure/catalog.ts`: stage metadata needed by rules/runner.
- Modify `src/game/adventure/scoring.ts` and tests: fever/mastery/first-clear bounded bonuses.
- Modify `src/game/world-state.ts`: permanent adventure records only.
- Modify reducer/save/migration files discovered from current imports: completion, first-clear, mastery and migration behavior.
- Modify `src/components/AdventureRunner.tsx`: stage-specific play, fever HUD, Guardian phases, result breakdown.
- Modify `src/adventure.css`: mobile-safe stage/fever/result presentation.
- Modify collection/campaign summary surfaces only where existing adventure records are already displayed.

### Task 1: Shared mastery runtime
**Interfaces:** Produce `feverActive(session)`, `streakMultiplier(session)`, bounded recovery and deterministic judgement helpers while preserving current engine functions.
- [ ] Add failing Vitest cases proving clean streak activates fever, MISS ends fever/combo, PERFECT streak increases score, and recovery cannot create negative mistakes.
- [ ] Run `npm test -- src/game/adventure/runtime.test.ts` and confirm RED for missing behavior.
- [ ] Implement minimal deterministic runtime helpers and session fields.
- [ ] Re-run focused tests and confirm GREEN.

### Task 2: Ten stage rule contracts
**Interfaces:** Produce `AdventureRule`, `ruleForStage(id)`, `difficultyForMonth(month)`, `assistFor(stage,state)`; no React dependency.
- [ ] Write `rules.test.ts` asserting all ten catalog stages have unique identity configuration, difficulty is monotonic/capped, and each Runa stat maps only to bounded assistance.
- [ ] Run focused tests and confirm RED.
- [ ] Implement `rules.ts` with explicit configuration for forest path, moon garden, crystal creek, village market, whispering grove, sunset field, old shrine, cloud bridge, starlight hill and guardian sanctum.
- [ ] Confirm focused GREEN.

### Task 3: Stage-specific engine modifiers
**Interfaces:** Runtime consumes rule modifiers without duplicating five engines.
- [ ] Add failing tests for shrinking timing window, target hazard penalty, longer sequence, balance drift tolerance and choice clue penalty.
- [ ] Confirm RED.
- [ ] Add optional modifier arguments to engine operations with backwards-compatible defaults.
- [ ] Confirm all runtime/rules tests GREEN.

### Task 4: Guardian Sanctum phase controller
**Interfaces:** Produce `GuardianRun`, `createGuardianRun()`, `completeGuardianPhase(run, result)` and five ordered engine phases.
- [ ] Write failing tests proving exactly five phases, all five shared engine families appear, a weak phase does not restart the run, and final score aggregates phases.
- [ ] Confirm RED.
- [ ] Implement `guardian.ts` as orchestration only—no sixth engine.
- [ ] Confirm GREEN.

### Task 5: Permanent adventure mastery records
**Interfaces:** World state records per-stage `bestScore`, `bestGrade`, `mastered`, `firstCleared`; completion is idempotent for one-time rewards.
- [ ] Locate current world-state/reducer/save tests and add failing migration/completion cases.
- [ ] Confirm RED.
- [ ] Extend permanent state with safe defaults and migration; do not persist active sessions.
- [ ] Implement best-record updates and one-time first-clear/mastery flags.
- [ ] Confirm focused GREEN.

### Task 6: Reward integration without a second economy
**Interfaces:** Existing completion reward path accepts score/mastery context and returns existing currency/material rewards plus one-time milestones.
- [ ] Add failing tests: C still rewards base completion, S > A reward, first-clear bonus only once, MASTER milestone only once, cancel gives nothing.
- [ ] Confirm RED.
- [ ] Extend existing reward calculation/reducer minimally using existing resources.
- [ ] Confirm GREEN.

### Task 7: Collection/campaign/ending integration
**Interfaces:** Existing collection and campaign summary read mastery records; explorer ending receives bounded mastery contribution.
- [ ] Add failing tests for mastery collection count, campaign summary, and capped ending weight.
- [ ] Confirm RED.
- [ ] Wire records into existing selectors without adding a parallel progression system.
- [ ] Confirm GREEN.

### Task 8: AdventureRunner stage identities
**Interfaces:** Runner reads `AdventureRule`; engine state stays in runtime. Guardian uses phase controller.
- [ ] Add/extend component-level pure helper tests where current project testing permits; otherwise test extracted view-model helpers first and confirm RED.
- [ ] Implement stage-specific instruction, clue/pattern/hazard presentation and difficulty indicators for all ten stages.
- [ ] Add fever meter, streak feedback, Runa assist message and result breakdown.
- [ ] Implement Guardian five-phase transition without page reload/reward between phases.
- [ ] Run relevant tests and confirm GREEN.

### Task 9: Mobile interaction hardening
**Interfaces:** CSS only changes presentation; game rules unchanged.
- [ ] Add testable class/view-state contracts where possible before changing markup.
- [ ] Ensure all primary touch targets >=48px, short-height layout remains usable, safe-area padding is present, and no required drag gesture exists.
- [ ] Add reduced-motion handling for judgement/fever animations.
- [ ] Verify relevant tests remain GREEN.

### Task 10: Twelve-month adventure regression
**Interfaces:** Campaign test uses public reducer/actions, not internal mutation.
- [ ] Add failing regression that completes representative adventures across months, unlocks late stages, completes Guardian, advances months and returns through the established core loop without corrupting state.
- [ ] Confirm RED for missing new expectations.
- [ ] Fix only defects exposed by the regression.
- [ ] Confirm campaign test GREEN.

### Task 11: Full verification and release checkpoint
- [ ] Run `npm test` and require zero failures.
- [ ] Run `npm run build` and require TypeScript/Vite success.
- [ ] Inspect git diff for accidental core-data deletion or unrelated refactors.
- [ ] Commit the integrated implementation as one large coherent Adventure System 2.0 release commit, consistent with the user's preference for large batches.
- [ ] Push/update `feat/vertical-slice` only.
- [ ] Observe GitHub Actions for the exact pushed HEAD; fix failures before reporting success.
- [ ] Check PR #1 remains unmerged.
- [ ] Verify Preview only if an available connected tool can actually observe deployment/browser state; otherwise explicitly report it as unverified.

## Self-review
Spec coverage: all ten stage identities, five engines, mastery/fever, Runa assistance, rewards, Guardian, mobile, persistence and regression are mapped above. No independent economy or unrelated refactor is introduced. Interfaces consistently keep runtime deterministic and permanent rewards authoritative in world state.