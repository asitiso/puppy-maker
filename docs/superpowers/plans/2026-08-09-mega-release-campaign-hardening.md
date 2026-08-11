# Puppy Maker Mega Release Execution Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Turn the current vertical slice into a stable 12-month Runa raising-game campaign where adventure mastery, world progression, rewards, collection, endings, and the Layered Home reinforce one another.

**Architecture:** Preserve the existing reducer and screen flow. Extend the world/adventure meta layer rather than replacing core game state, keep dynamic information code-rendered, and treat adventure records as persistent meta progression while monthly allowances remain run progression.

**Tech Stack:** React, TypeScript, Vite, Vitest, GitHub Actions.

## Global Constraints

- Never merge PR #1 or main without explicit user instruction.
- Preserve schedule → training → dialogue → result → next month → Layered Home.
- Preserve existing saves through hydration/migration.
- Mobile portrait UX and safe areas are release requirements.
- Verify tests/build before reporting success.

---

## Release waves

- [x] Adventure mini-game engines and Guardian multi-phase challenge.
- [x] Persistent best score/S/mastery records and v7 save migration.
- [x] First-clear/S/MASTER bounded milestone rewards.
- [x] Adventure mastery surfaced in World Hub collection and campaign report.
- [x] Adventure mastery contributes bounded ending legacy bonuses.
- [ ] Add mastery-driven achievements and meaningful collection rewards without grind inflation.
- [ ] Add Guardian clear/master meta milestone and endgame feedback.
- [ ] Feed important mastery/collection milestones back into Layered Home without adding dashboard clutter.
- [ ] Harden all 10 adventure stages for small portrait screens, safe areas, reduced motion, and touch targets.
- [ ] Add full 12-month regression covering schedule/training/dialogue/result/month transition/home return plus world actions.
- [ ] Verify legacy v1-v6 save fixtures hydrate into v7 without loss of core state.
- [ ] Verify NEW_RUN resets run-only state while preserving intended meta progression.
- [ ] Run complete Vitest suite and TypeScript/Vite production build in CI.
- [ ] Inspect Preview only after CI is green; do not treat deploy rate-limit as application success.

## Completion gate

Release is complete only when the current `feat/vertical-slice` HEAD has green test/build CI and the core 12-month loop has regression coverage. Preview status is reported independently. No merge is part of this plan.
