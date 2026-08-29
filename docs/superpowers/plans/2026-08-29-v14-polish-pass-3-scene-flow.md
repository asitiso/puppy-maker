# V14 Polish Pass 3 Scene & Flow Continuity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Outing, Story, result handoff, and scene presentation feel like one stable mobile flow without introducing a new navigation or scene system.

**Architecture:** Keep `App.tsx` as the state owner, `LayeredHome.tsx` as the home/outing/story presentation surface, and the existing `SceneStage`/`SceneDirector` stack as the visual runtime. Fix continuity by clearing transient panel state before handoff, deriving home status from the resolved scene, making the home sheet a fixed header + one body scroller, and strengthening result handoff accessibility/safe-area behavior.

**Tech Stack:** React 19, TypeScript, CSS, Vitest/source-contract tests, GitHub Actions, Vercel.

**Spec:** `docs/superpowers/specs/2026-08-29-v14-polish-pass-3-scene-flow-design.md`

## Global Constraints

- Reuse existing `SceneDirector`, `SceneStage`, `ActionResultSummary`, and mobile CSS tokens.
- No new currency, growth system, menu, animation framework, or router rewrite.
- Preserve 44px touch targets, Korean wrapping, focus-visible, reduced-motion, and safe-area behavior.
- Target 360×640, 390×844, and 430px mobile layouts.
- Only change Outing/Story behavior supported by current source evidence.

---

### Task 1: Lock Scene/Flow Contracts RED

**Files:**
- Create: `src/v14-polish-pass-3-regression.test.ts`
- Read: `src/LayeredHome.tsx`, `src/layered-home.css`, `src/ActionResultSummary.tsx`, `src/mobile-v10-guidance.css`

**Interfaces:**
- Consumes: current home panel and result-summary source contracts.
- Produces: regression assertions for resolved weather, local back semantics, single sheet scroller, outing handoff cleanup, and result live/safe-area semantics.

- [ ] **Step 1: Write failing source-contract tests** asserting that `LayeredHome` uses `homeScene.weather`, closes the panel before `onOuting(id)`, exposes a local back label, and wraps panel content in `lh-panel-body`; assert CSS keeps `.lh-panel` overflow hidden and `.lh-panel-body` as the only vertical scroller; assert result summary has `role="status"` and CSS safe-area reserve.
- [ ] **Step 2: Run CI on the test-only commit** and confirm failure is caused by those missing contracts.
- [ ] **Step 3: Commit** with `test(v14): lock pass 3 scene flow contracts`.

### Task 2: Home/Outing/Story Continuity

**Files:**
- Modify: `src/LayeredHome.tsx`
- Modify: `src/layered-home.css`
- Test: `src/v14-polish-pass-3-regression.test.ts`

**Interfaces:**
- Consumes: `ResolvedScene.weather`, existing `closePanel()`, existing `onOuting(location)` callback.
- Produces: scene-derived weather copy, deterministic panel dismissal before outing handoff, fixed sheet header and one scrollable body.

- [ ] **Step 1: Add a local `weatherLabels` map** for `clear/cloudy/rain/snow/mist` and render the resolved `homeScene.weather` instead of hard-coded clear weather.
- [ ] **Step 2: Add `startOuting(id)`** that calls `closePanel()` before `onOuting(id)` so the home sheet cannot remain stale behind the next activity.
- [ ] **Step 3: Change the close affordance** from an unlabeled × visual to a compact `← 이전 화면` local-back button while retaining `aria-label="홈으로 돌아가기"`.
- [ ] **Step 4: Wrap all panel-specific content in `div.lh-panel-body`**, keep the header outside it, and update CSS so `.lh-panel` is a bounded grid with `overflow:hidden` while `.lh-panel-body` owns `overflow-y:auto`, `overscroll-behavior:contain`, and safe bottom padding.
- [ ] **Step 5: Add narrow/short viewport rules** keeping the header visible and the body scrollable at 390px and 650px-height boundaries.
- [ ] **Step 6: Run the Pass3 regression test and existing V14 mobile/scene tests; commit** with `feat(v14): unify home outing scene continuity`.

### Task 3: Action Result → Next Continuity

**Files:**
- Modify: `src/ActionResultSummary.tsx`
- Modify: `src/mobile-v10-guidance.css`
- Test: `src/v14-polish-pass-3-regression.test.ts`

**Interfaces:**
- Consumes: existing `title`, `message`, `changes`, `totals`, `continuationLabel`, `onContinue` props.
- Produces: live result announcement and a continuation CTA that remains reachable above mobile safe areas.

- [ ] **Step 1: Mark the result summary as `role="status" aria-live="polite" aria-atomic="true"`** without changing its data contract.
- [ ] **Step 2: Give the continuation control a stable action region** and safe-area bottom reserve in `mobile-v10-guidance.css`; preserve 44px minimum target and focus-visible styles.
- [ ] **Step 3: Run targeted Pass3 + result-guidance tests; commit** with `feat(v14): strengthen result continuation handoff`.

### Task 4: Scene Stability Regression

**Files:**
- Modify: `src/v14-polish-pass-3-regression.test.ts`
- Read: `src/scene/SceneStage.tsx`, `src/scene/scene.css`

**Interfaces:**
- Consumes: existing stable actor keying and scene data attributes.
- Produces: regression coverage that prevents remount-based actor jumps or weather/time metadata loss.

- [ ] **Step 1: Assert `SceneStage` preserves actor identity via `key={actor.actorId}` and exposes `data-location`, `data-season`, `data-weather`, and runtime phase.**
- [ ] **Step 2: Assert reduced-motion remains present in scene CSS and no new animation framework/dependency is introduced.**
- [ ] **Step 3: Run targeted scene tests and commit** with `test(v14): guard scene continuity metadata`.

### Task 5: Quality Gate and Promotion

**Files:**
- Verify: all changed files and V14 regression suites.

**Interfaces:**
- Consumes: Tasks 1–4.
- Produces: reviewed GREEN branch promoted through integration, main, and production.

- [ ] **Step 1: Run full GitHub Actions CI** (`npm run test` then `npm run build`) on the feature PR and require zero failures.
- [ ] **Step 2: Inspect PR review threads and Vercel preview status**; resolve only evidence-backed blockers.
- [ ] **Step 3: Merge to `integration/v3`**, open integration→main release PR, and wait for release CI GREEN.
- [ ] **Step 4: Merge release PR to `main`**, verify fresh main push CI GREEN and Vercel production `success`.
- [ ] **Step 5: Compare `integration/v3` and `main` trees** and report exact SHAs, PRs, CI run numbers, and any deliberate non-change such as Story archive remaining read-only.
