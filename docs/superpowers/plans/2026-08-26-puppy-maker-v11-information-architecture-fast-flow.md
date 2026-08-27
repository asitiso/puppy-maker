# V11 Information Architecture + Fast Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reorganize puppy-maker's information-dense mobile surfaces so players can understand state, find relevant content, and take the next valid action faster without changing gameplay, rewards, economy, or save semantics.

**Architecture:** Add a small reusable information-surface layer on top of existing V9/V10 mobile primitives. Start by replacing duplicated home information sheets, then apply the same hierarchy and UI-local discovery controls to dense records, achievement/quest, inventory, season/meta, and expedition surfaces. Existing callbacks and authoritative domain state remain the only source of actions and eligibility; `MobilePageShell.stickyAction` remains the contextual action mechanism.

**Tech Stack:** React 19, TypeScript 5.9, Vite 8, Vitest 4, existing puppy-maker CSS/mobile shell primitives.

---

## Guardrails

- No gameplay, reward, economy, campaign, tactical-engine, or save-schema changes.
- No new global router, reducer, or persistent UI preference model.
- UI-local search/filter state must not enter game saves.
- One dominant primary CTA per relevant viewport; no equivalent duplicate CTA.
- Blocked/locked states may explain and route only through existing safe callbacks; never bypass requirements.
- Preserve 360px, 390px, and 430px mobile behavior, safe areas, Korean wrapping, visible focus, reduced motion, and 44px touch targets.
- Every production change begins with an expected failing test and ends with targeted GREEN before the next task.

## Task 1 — Shared information sheet foundation

**Files:**
- Create: `src/InformationSheet.tsx`
- Create: `src/v11-information-sheet.test.tsx`
- Modify: `src/LayeredHome.tsx`
- Create/Modify: `src/mobile-v11-information.css`
- Modify the existing CSS entry/import location only if required by the current stylesheet graph.

**RED:**
1. Add tests that require an accessible `dialog`, labelled title, optional status summary before detail, one primary action, no more than two secondary actions, close behavior, and progressive disclosure with `aria-expanded`.
2. Create/update the V11 source-contract test so Quest and Collection home panels must use the shared information sheet rather than duplicate raw sheet markup.
3. Push the RED commit and confirm CI fails for the expected missing component/contract reason.

**GREEN:**
1. Implement the smallest `InformationSheet` API satisfying those contracts.
2. Replace Quest and Collection duplicate sheet structures in `LayeredHome.tsx` with the shared primitive while preserving their existing callbacks and copy semantics.
3. Add only the CSS needed for hierarchy, status rows, disclosure, touch targets, focus, safe-area spacing, and reduced-motion compatibility.
4. Confirm CI returns GREEN before refactoring.

## Task 2 — Records / Collection information architecture

**Files:**
- Modify the existing record/collection panel components identified in the repository.
- Add focused V11 record/collection tests beside the existing domain tests or in `src/v11-records-information.test.tsx`.
- Reuse `InformationSheet` / shared status primitives; add a small list toolbar only if the actual list density warrants it.

**RED:**
1. Require summary-first ordering and clear active/completed/locked state where those states already exist.
2. Require task-appropriate discovery controls only for genuinely dense lists.
3. Require details to be progressively disclosed rather than forcing long secondary text into the first viewport.
4. Require no save mutation from UI-local filters/search.

**GREEN:**
1. Implement summary-first record/collection layout from existing authoritative state.
2. Add UI-local category/status filtering or search only where the existing dataset benefits.
3. Keep reward/progression computation in existing domain code.
4. Run targeted record/collection tests and then CI.

## Task 3 — Achievements / Quests fast discovery

**Files:**
- Modify existing achievement/quest surfaces and tests discovered in `src/`.
- Add V11-focused tests if existing tests do not express ordering/filter contracts.

**RED:**
1. Require actionable/in-progress information ahead of completed archive content when authoritative state supports it.
2. Require progress/status to be visible without opening long details.
3. Require the existing claim/open callbacks to remain authoritative and non-duplicated.

**GREEN:**
1. Apply shared status hierarchy and progressive disclosure.
2. Add UI-local filters only where the list is dense enough.
3. Preserve all existing claim/progress semantics.
4. Run targeted achievement/quest tests and CI.

## Task 4 — Bag / Items information architecture

**Files:**
- Modify the existing inventory/bag surface and its tests.
- Add V11-focused inventory tests where needed.

**RED:**
1. Require meaningful existing item categories/status groups to be scannable.
2. Require compact item summaries before secondary details.
3. Require existing item actions, if any, to be the only authoritative actions.
4. Require search/filter state to stay UI-local.

**GREEN:**
1. Add category/status grouping and compact cards from existing inventory data.
2. Add search/filter only if list density justifies it.
3. Keep inventory mutation in existing callbacks/domain operations.
4. Run targeted inventory tests and CI.

## Task 5 — Season / Meta information architecture

**Files:**
- Modify: `src/SeasonPassPanel.tsx`
- Modify existing season/meta tests.
- Add V11-focused season panel tests if required.

**RED:**
1. Require current season state, next meaningful milestone, and currently available activity/reward state to appear before historical/completed detail.
2. Require any contextual action dock to use existing callbacks and avoid duplicate equivalent CTAs.
3. Require long historical/meta detail to be collapsible/filterable where appropriate.

**GREEN:**
1. Reorder existing authoritative season/meta information to summary-first hierarchy.
2. Reuse shared disclosure/status patterns.
3. Use contextual sticky action only where it removes an actual round trip.
4. Run targeted season tests and CI.

## Task 6 — Expedition / Region fast flow

**Files:**
- Modify: `src/GuardianExpeditionOverlay.tsx`
- Modify: `src/GuardianExpeditionOverlay.test.tsx`
- Modify related expedition/region tests only as needed.

**RED:**
1. Require current objective/progress/requirements before secondary region detail.
2. Require start/continue/retry/exit CTAs to reflect only already-valid authoritative callbacks/state.
3. Require result-to-next-action flow without reward recomputation or eligibility inference in UI.
4. Require blocked states to explain the requirement rather than bypassing it.

**GREEN:**
1. Reorder the overlay around objective/status first.
2. Reuse existing callbacks for contextual actions.
3. Add result continuation only where domain state already supplies validity.
4. Run targeted expedition tests and CI.

## Task 7 — Mobile / accessibility consistency sweep

**Files:**
- Modify: `src/mobile-v11-information.css`
- Modify existing mobile source-contract / responsive tests.
- Add `src/v11-mobile-information-qa.test.ts` if needed.

**RED:**
1. Require 44px controls, safe-area-aware dock/sheet spacing, no duplicate primary CTAs, no horizontal overflow contracts, Korean wrapping, visible focus, semantic disclosure controls, and reduced-motion handling.
2. Require 360/390/430 responsive source contracts where the project uses source-level QA.

**GREEN:**
1. Normalize title/status/metadata/body hierarchy and card density.
2. Fix any remaining touch, wrapping, focus, safe-area, or overlap regressions.
3. Keep decorative transitions subtle and reduced-motion-safe.
4. Run focused mobile/a11y tests and CI.

## Task 8 — Full gate and promotion

1. Re-run the PR CI on the final source head and read the fresh output: `npm audit --audit-level=high`, full `npm test`, and `npm run build` must be GREEN.
2. Inspect PR comments/review threads and resolve only actual blockers.
3. Merge V11 source into `integration/v3` only after the source gate is GREEN.
4. Create the `integration/v3` → `main` release PR and require its fresh CI to be GREEN.
5. Merge to `main`, verify the exact main SHA and fresh main CI.
6. Inspect Vercel for an exact-main production deployment. Verify READY/production/SHA/root response/runtime logs when available.
7. If Vercel Hobby build quota still blocks production, report it as an external deployment blocker; do not fabricate deployment success or create no-op commits.
