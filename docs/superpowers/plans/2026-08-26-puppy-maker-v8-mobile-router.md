# V8 Mobile Router Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace V7’s split sheet/overlay navigation with one mobile navigation authority that keeps six-category browsing persistent, provides predictable feature return paths, and guards only unfinished training/Tactical/choice attempts.

**Architecture:** Add a pure `mobile-router.ts` domain and make `Root` the semantic navigation owner. Reuse existing reducers and feature components, but derive their visibility from the router instead of independent launcher state. A V8 chrome layer provides compact status, six-category navigation, route headers, a single scroll contract, and guarded Back/Home controls. Existing gameplay screens remain reducer-driven in `App`; router state mirrors their semantic origin and active-attempt status.

**Tech Stack:** React 19, TypeScript, CSS, Vitest, Vite.

**Spec:** `docs/superpowers/specs/2026-08-26-puppy-maker-v8-mobile-router-design.md`

## Global Constraints
- Work only on `work/v8-mobile-router` until release promotion.
- Preserve save schema and all V3/V4/V5/V6/V7 gameplay semantics.
- `hubNextAction(state)` remains the authoritative home CTA selector.
- Navigation state is ephemeral and must not enter save data.
- Main categories remain exactly `홈 / 생활 / 성장 / 모험 / 인연 / 기록`.
- Six-category navigation is visible for home/category/ordinary feature/completed-result states.
- Six-category navigation is hidden only for unfinished training, Tactical battle, choice event, or equivalent active attempt; those states show guarded `뒤로 + 홈` only.
- Guard copy: `진행 중인 플레이를 종료할까요?` / `지금 나가면 현재 진행 내용이 완료되지 않습니다.` / `계속하기` / `종료하고 이동`.
- Touch targets >=44px, preferred 48px; no critical actionable text below 14px.
- Mobile contracts: 360×640, 390×844, 430px class, safe areas, `100dvh`, reduced motion.
- No force push. No integration/main/production promotion without fresh CI/build evidence.

---

### Task 1: Pure mobile router domain

**Files:**
- Create: `src/mobile-router.ts`
- Create: `src/mobile-router.test.ts`

**Interfaces:**
- Produces `MobileCategoryId`, `MobileFeatureId`, `MobilePlayScreen`, `MobileRoute`, `MobileNavigationState`.
- Produces `initialMobileNavigationState`, `mobileNavigationReducer`, `isGuardedActiveRoute`, `categoryForFeature`.
- Actions: `OPEN_CATEGORY`, `OPEN_FEATURE`, `OPEN_PLAY`, `BACK`, `HOME`, `FINISH_FEATURE`, `FINISH_PLAY`, `REPLACE`.

- [ ] Write RED tests for home→category, category→feature, category switch normalization, active-category no-op, feature back, feature finish, category back, finish play, malformed replacement fallback, and guarded active-attempt detection.
- [ ] Run PR CI and confirm only the new router contract fails because the module does not exist.
- [ ] Implement a pure reducer with no React/game imports and deterministic normalized stacks.
- [ ] Re-run targeted/full CI; router tests must be GREEN before UI integration.

### Task 2: V8 chrome and scroll contract

**Files:**
- Create: `src/MobileRouterChrome.tsx`
- Create: `src/mobile-router-v8.css`
- Create: `src/v8-mobile-router-ui.test.tsx`
- Reuse: `src/MobileHomeStatus.tsx`, `src/MobileNavIcon.tsx`, `src/mobile-ui-tokens.css`

**Interfaces:**
- `MobileRouterChrome` props include `state`, `navigation`, `onCategory`, `onBack`, `onHome`, `guarded`, `pendingExit`, `onRequestExit`, `onCancelExit`, `onConfirmExit`.
- Normal states render compact status + six nav.
- Guarded states render only Back/Home controls and confirmation when requested.

- [ ] Write RED render/source contracts for six nav labels in normal mode, Back/Home-only guarded mode, confirmation copy, and focusable >=44px controls.
- [ ] Implement the chrome with a single confirmation component.
- [ ] Implement `.v8-mobile-shell`, `.v8-route-body`, `.v8-bottom-nav`, `.v8-play-guard` using `100dvh`, `min-height:0`, `overflow-y:auto`, `overscroll-behavior:contain`, and safe-area padding.
- [ ] Add 360/390/430 rules and pressed/focus/reduced-motion states.
- [ ] Verify targeted tests/build.

### Task 3: Full-page category routing

**Files:**
- Create: `src/MobileCategoryPage.tsx`
- Create: `src/v8-mobile-category-page.test.tsx`
- Modify: `src/LayeredHomeV7.tsx` or replace its route-owning responsibilities with V8 home presentation.
- Retire runtime use of: `src/MobileCategorySheet.tsx`.

**Interfaces:**
- Category page receives `category`, `state`, and `onOpenFeature(feature)`.
- Life: Weekly Planner, schedule, mission, attendance, mail.
- Growth: raising, ambition, achievements, inventory, season, sanctuary.
- Adventure: outing, expedition, world.
- Bond: bond, gifts, stories.
- Records: lineage, world chronicle, archive.

- [ ] Write RED contracts asserting categories render as pages rather than `.v7-category-backdrop` sheets and all six bottom categories remain reachable.
- [ ] Implement full-page category content with V7 icon language and 48px entry cards.
- [ ] Ensure only `.v8-route-body` owns page scrolling; nested chronicle/planner components are made static within that body.
- [ ] Verify long content cannot cover bottom navigation structurally.

### Task 4: Route legacy home features back to origin categories

**Files:**
- Modify: `src/LayeredHome.tsx`
- Modify: `src/layered-home.css`
- Create: `src/v8-legacy-feature-routing.test.tsx`

**Interfaces:**
- Add controlled panel props: `controlledPanel?: HomeMenuId|null`, `onControlledPanelClose?:()=>void` while preserving old uncontrolled behavior for tests/compatibility.
- V8 routes map: mission/attendance/mail→life; quest/bag→growth or bond where invoked; outing→adventure; bond/event→bond.

- [ ] Write RED contracts for controlled panel close callback and origin-category routing.
- [ ] Implement controlled panel selection without changing claim/gift/outing reducer callbacks.
- [ ] In V8 mode constrain `.lh-panel-backdrop/.lh-panel` between persistent chrome areas and prevent a hidden close-control trap.
- [ ] Verify claim actions do not auto-home; close/back returns semantic category.

### Task 5: Make Root overlays router-controlled

**Files:**
- Modify: `src/Root.tsx`
- Modify as needed: `src/SeasonLiveOpsOverlay.tsx`, `src/SanctuaryOverlay.tsx`, `src/RaisingIdentityOverlay.tsx`, `src/GuardianExpeditionOverlay.tsx`, `src/WorldProgressOverlay.tsx`, `src/CollectionArchiveOverlay.tsx`, `src/YearlyAmbitionOverlay.tsx`
- Create: `src/v8-root-feature-routing.test.tsx`

**Interfaces:**
- Remove independent `seasonLiveOpen`, `sanctuaryOpen`, `raisingOpen`, `worldProgressOpen`, `archiveOpen`, `ambitionOpen` authority where router can derive open state.
- Route close callbacks dispatch `BACK`/`FINISH_FEATURE` instead of resetting home.
- Feature open is true exactly when current route maps to that feature.

- [ ] Write RED source/render contracts for route-derived overlay visibility and close destinations.
- [ ] Add `mobilePage`/controlled mode only where an existing overlay cannot coexist with persistent chrome; do not change game callbacks.
- [ ] Keep exactly one normal feature visible at a time.
- [ ] Ensure bottom navigation z/order and content bounds remain usable above ordinary feature presentation.
- [ ] Verify Growth→season/sanctuary/ambition→Back = Growth; Adventure→world/expedition prestart→Back = Adventure; Records→archive→Back = Records.

### Task 6: Integrate App schedule/training/dialogue/result navigation

**Files:**
- Modify: `src/Root.tsx`
- Modify minimally: `src/App.tsx` only if a semantic transition callback is required.
- Create: `src/v8-play-routing.test.tsx`

**Interfaces:**
- `gameState.screen==='schedule'`: normal, six nav visible, semantic origin life.
- `training`: guarded active attempt.
- `dialogue`: guarded unresolved choice attempt.
- `result`: normal completed state, six nav visible.
- Confirmed guarded Home dispatches `navigate('hub')` and router HOME. Confirmed guarded Back dispatches hub and returns to the recorded parent category.

- [ ] Write RED tests/source contracts for normal schedule, guarded training/dialogue, and normal result.
- [ ] Implement screen-to-route synchronization without persisting navigation state.
- [ ] Add explicit guarded exit confirmation; cancel must not mutate reducer state or route.
- [ ] Make category selection from schedule/result navigate App to hub before opening the chosen category.
- [ ] Preserve normal reducer-driven result completion; when the cycle returns hub, router normalizes home.

### Task 7: Tactical battle active-attempt guard

**Files:**
- Modify: `src/TacticalExpeditionFlow.tsx`
- Modify: `src/Root.tsx`
- Create: `src/v8-tactical-navigation.test.tsx`

**Interfaces:**
- Add `onBattleStateChange?: (state:{active:boolean;result:boolean})=>void`.
- Starting a battle emits `{active:true,result:false}`.
- Resolution emits `{active:false,result:true}` before/with completion callbacks.
- Retry emits active true again; final exit emits inactive.

- [ ] Write RED tests for battle-state callback transitions.
- [ ] Implement callback without changing tactical engine/session math.
- [ ] Root hides six nav only while tactical active=true/result=false and shows guarded Back/Home.
- [ ] Completed Tactical result restores six nav.
- [ ] Confirmed guarded exit closes tactical session/expedition and returns Adventure for Back or Home for Home.

### Task 8: Remove V7 routing authority and harden usability

**Files:**
- Modify: `src/Root.tsx`
- Modify: `src/LayeredHomeV7.tsx` or replace with `src/MobileHomeV8.tsx`
- Modify: `src/layered-home-v7.css`
- Modify: `src/mobile-router-v8.css`
- Create: `src/v8-mobile-usability-contract.test.tsx`

**Interfaces:**
- No runtime category state in V7 sheet.
- No V7 category backdrop covering nav.
- Root router is the only category/feature navigation authority.

- [ ] Write RED contracts rejecting `.v7-category-backdrop` runtime use and independent launcher booleans.
- [ ] Remove/retire sheet/backdrop routing from production render.
- [ ] Normalize status header height/arrangement and ensure date/resources are readable at 360px.
- [ ] Enforce final-row bottom padding, sticky/visible headers, 44/48px touch targets, and 14px+ critical controls across routed feature overlays.
- [ ] Add Escape/focus-visible/reduced-motion source contracts.

### Task 9: Full regression and release gate

**Files:**
- Update PR # for release evidence.
- Update issue #198 with final evidence.

- [ ] Run targeted V8 suites through CI.
- [ ] Run full `npm run test`; expected baseline is at least 460 files / 1793 tests with all new V8 tests added.
- [ ] Run dependency audit; require 0 vulnerabilities.
- [ ] Run `npm run build`; require TypeScript + Vite success.
- [ ] Review PR diff for unintended save/game changes.
- [ ] Merge source PR normally to `integration/v3`; no force push.
- [ ] Open integration→main release PR and require synthetic merge CI GREEN.
- [ ] Merge to main with expected-head protection.
- [ ] Require exact-main push CI GREEN.
- [ ] Verify exact-main Vercel production deployment is READY.
- [ ] Smoke canonical production root HTTP 200 and `/api/client-telemetry` HTTP 200 `{"ok":true}`.
- [ ] Query production error/fatal runtime logs; require no V8 runtime errors before closing #198 completed.
