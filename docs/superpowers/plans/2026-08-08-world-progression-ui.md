# World Progression UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make regional renown, expedition seasons, monthly world events, world contracts, and expedition-result world rewards visible and readable in the existing mobile game UI.

**Architecture:** Add a pure `world-ui.ts` presentation model with unit tests, then render it through an independent home overlay and small additions to the existing Guardian Expedition overlay. No new navigation state or decorative CSS artwork is introduced.

**Tech Stack:** React, TypeScript, Vitest, existing CSS/image assets, GitHub Actions CI.

## Global Constraints

- Preserve the existing hub → schedule → training → dialogue → result → next month → hub flow.
- Do not merge PR #2.
- Reuse existing image assets for decorative frames/effects.
- Text, numbers, progress, and layout may use React/CSS.
- Normal season-tier rewards remain automatic; no extra claim callback is added.
- Every behavior change follows RED → GREEN verification.

---

### Task 1: Pure world UI presentation model

**Files:**
- Create: `src/world-ui.test.ts`
- Create: `src/world-ui.ts`

**Interfaces:**
- Consumes: `GameState`, `worldEvent`, `worldContractDefinitions`, `expeditionSeasonTiers`, `regionalRenownLevel`.
- Produces: `worldUiSummary(state)`, `worldResultSummary(state)`.

- [ ] **Step 1: Write failing tests** for default seasonal summary, a partially advanced season, maxed regional renown, contract status, and result feedback.
- [ ] **Step 2: Run CI and verify RED** because `./world-ui` does not exist.
- [ ] **Step 3: Implement `world-ui.ts`** with clamped percentages and Korean presentation labels derived from existing definitions.
- [ ] **Step 4: Run CI and verify tests/build GREEN.**
- [ ] **Step 5: Commit.**

### Task 2: Home world progress overlay

**Files:**
- Create: `src/WorldProgressOverlay.tsx`
- Create: `src/world-progress.css`
- Modify: `src/Root.tsx`

**Interfaces:**
- Consumes: `state: GameState` and `worldUiSummary(state)`.
- Produces: compact home trigger and scrollable informational overlay.

- [ ] **Step 1: Add a source-level integration test** in `src/world-ui.test.ts` asserting the summary exposes every field required by the React overlay.
- [ ] **Step 2: Verify RED** for the new summary contract before changing implementation.
- [ ] **Step 3: Implement overlay** using `/ui/info_card_frame.png` and existing panel imagery where available; CSS is layout/typography only.
- [ ] **Step 4: Render from `Root.tsx` only on the hub screen.**
- [ ] **Step 5: Run CI and verify tests/build GREEN.**
- [ ] **Step 6: Commit.**

### Task 3: Guardian Expedition world context

**Files:**
- Modify: `src/GuardianExpeditionOverlay.tsx`
- Modify: `src/expedition-ui.css`
- Test: `src/world-ui.test.ts`

**Interfaces:**
- Consumes: `worldUiSummary(state)` and `worldResultSummary(state)`.
- Produces: event strip, region renown labels, featured-region emphasis, and result world-reward block.

- [ ] **Step 1: Add failing tests** for featured-region and result labels including season-tier and completed-contract feedback.
- [ ] **Step 2: Verify RED.**
- [ ] **Step 3: Add map event strip and region-renown labels.**
- [ ] **Step 4: Add result world-progress block only when `lastWorldProgress` exists.**
- [ ] **Step 5: Run CI and verify tests/build GREEN.**
- [ ] **Step 6: Commit.**

### Task 4: Release verification and PR refresh

**Files:**
- Modify: PR #2 description only.

**Interfaces:**
- Consumes: final commit SHA and CI/Vercel status.
- Produces: accurate draft PR scope/verification summary; no merge.

- [ ] **Step 1: Run/fetch final GitHub CI and confirm test + build success.**
- [ ] **Step 2: Check Vercel deployment for the exact final commit SHA and confirm READY if available.**
- [ ] **Step 3: Update Draft PR #2 body with world progression engine/UI scope and latest verification.**
- [ ] **Step 4: Confirm PR remains open, draft, and unmerged.**
