# Adventure Minigames Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace instant exploration rewards with ten short, playable, one-hand mobile adventures whose performance and Runa's raising stats affect rewards and long-term progression.

**Architecture:** Ten destination stages are data-driven configurations over five reusable engines: timing, tap-target, sequence, balance, and choice-path. The React runner owns transient play state; persistent WorldState only receives a completed score, so interrupted games never consume the monthly exploration allowance. Scoring, grade, difficulty, stat assist, rewards, memories, and ending influence stay in pure domain modules.

**Tech Stack:** React, TypeScript, Vitest, existing reducer/save architecture, CSS mobile overlays.

## Global Constraints
- Keep `feat/vertical-slice` and PR #1; never merge main/PR without explicit instruction.
- Preserve the existing 12-month raising loop and Layered Home.
- One-hand portrait play, 20–45 second target sessions, no hard game-over.
- Dynamic score/reward text is code-rendered; Runa keeps canonical existing assets.
- Exploration allowance is consumed only after completion.

---

### Task 1: Shared adventure domain
- [x] Define ten stage configurations and five reusable engine types.
- [x] Add score grades, campaign difficulty, Runa stat assists, and reward multipliers.
- [x] Add deterministic pure runtime state for all five engines.
- [x] Add catalog/scoring/runtime regression tests.

### Task 2: Playable mobile runner
- [x] Build intro → play → result flow.
- [x] Implement timing, target tapping, sequence memory, balance, and choice interactions.
- [x] Add portrait/safe compact styling and minimum touch targets.
- [x] Reuse canonical Runa home sprite for adventure intro.

### Task 3: World progression integration
- [x] Route every exploration entry through its minigame.
- [x] Make grade affect gold/material reward multipliers.
- [x] Persist per-destination best scores and S-rank clears.
- [x] Record grade/score in world memories and monthly world score.
- [x] Keep legacy direct EXPLORE behavior compatible for existing simulations/tests.

### Task 4: Save and long-term progression
- [x] Extend v6 world state with adventure records.
- [x] Migrate older saves with safe defaults.
- [x] Preserve adventure records across New Run as meta mastery.
- [x] Fix v6 save regression expectation.

### Task 5: Campaign meaning
- [x] Strengthen exploration contribution to explorer ending tendency.
- [x] Keep Runa stats relevant through engine-specific assists.
- [x] Surface best scores/S-rank collection in World Hub.

### Task 6: Verification
- [ ] Run full Vitest suite on exact PR HEAD.
- [ ] Run production build on exact PR HEAD.
- [ ] Fix any TypeScript/runtime regressions until GREEN.
- [ ] Verify PR remains open/unmerged and inspect Preview when available.
