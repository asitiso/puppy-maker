# V3 Expanded Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade V3 player clarity and replay feel, harden multi-run persistence, make CI/install reproducible, and produce a fully verified V3 Release Candidate without introducing a new major subsystem.

**Architecture:** Keep `GameState` authoritative and unchanged unless a RED persistence/runtime regression proves a defect. Add one pure semantic run-guidance derivation plus a small Home card; hardening is driven by persistence/soak tests. Production readiness is enforced through lockfile-based CI and the existing full release suites.

**Tech Stack:** React, TypeScript, Vitest, Vite, GitHub Actions, existing puppy-maker V3 campaign/world/tactical/save modules.

**Spec:** `docs/superpowers/specs/2026-08-25-v3-expanded-polish-design.md`

## Global Constraints

- Baseline is `integration/v3@542d1746fb4253a25222435e798d90c189df4d52`.
- One execution room only; no 03/05/06 handoff dependency.
- No new Campaign, replacement combat engine, major economy or major meta subsystem.
- No raw affinity/danger/Legacy threshold exposure.
- Existing `campaignRun`, `characterBonds`, `worldHistory`, `legacy` remain authoritative.
- Mobile: 360/390/430, 9:16, safe area, 44px touch targets, Korean wrapping, focus/back and reduced motion.
- Persistence production changes require a reproduced RED test.
- `main` and prod remain untouched.
- Final `integration/v3` update is non-force and only after exact tested-tree verification.

---

### Task 1: Semantic run guidance model

**Files:**
- Create: `src/run-guidance.ts`
- Create: `src/run-guidance.test.ts`

**Interfaces:**
- Consumes: `GameState` from `src/game.ts`.
- Produces: `RunGuidanceView` and `getRunGuidance(state: GameState): RunGuidanceView`.

`RunGuidanceView` is presentation-only:

```ts
export type RunGuidanceMode = 'first_run' | 'active_run' | 'returning_run' | 'ready_for_new_run';

export type RunGuidanceView = {
  mode: RunGuidanceMode;
  eyebrow: string;
  title: string;
  body: string;
  nextAction: string;
  campaignLabel: string;
  seasonLabel: string;
  routeTone: 'normal' | 'true' | 'hollow';
  recentResult?: string;
};
```

- [ ] **Step 1: Write failing semantic tests**

Test four modes with real `initialState` clones:

```ts
expect(getRunGuidance(initialState)).toMatchObject({
  mode: 'first_run',
  seasonLabel: '봄',
  routeTone: 'normal',
});
```

Add active normal campaign, active `true_path`, active Hollow route, Legacy returning-run and completed-run fixtures. Assert serialized guidance text does not contain `dangerState.score`, `affinity`, `threshold`, `Legacy Power`, or internal tier names such as `hollow_candidate`.

- [ ] **Step 2: Run RED**

Run `npm run test -- src/run-guidance.test.ts` and confirm the missing module/contracts are the failure reason.

- [ ] **Step 3: Implement minimal pure derivation**

Use existing public semantic state only:
- `campaignRun.season`
- `campaignRun.activeCampaign`
- `campaignRun.activeRoute`
- `legacy.runNumber` and recent run summaries
- completed-run state already represented in Legacy/campaign state

Do not mutate `state` and do not add persisted fields.

- [ ] **Step 4: Run GREEN plus campaign/legacy regression**

Run `npm run test -- src/run-guidance.test.ts src/campaign-state.test.ts src/legacy-state.test.ts`.

- [ ] **Step 5: Commit**

Commit `feat: add semantic run guidance`.

### Task 2: Home guidance card and mobile polish

**Files:**
- Create: `src/RunGuidanceCard.tsx`
- Create: `src/RunGuidanceCard.test.tsx`
- Modify: `src/LayeredHome.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `RunGuidanceView` from Task 1.
- Produces: an accessible home card; no progression actions.

- [ ] **Step 1: Write component RED tests**

Render first/active/returning/completed guidance. Require:
- semantic title/body/next action visible;
- `data-route-tone` is normal/true/hollow;
- `aria-label="현재 여정 안내"`;
- no raw score/threshold copy;
- long Korean text can render without truncation attributes.

- [ ] **Step 2: Run RED**

Run `npm run test -- src/RunGuidanceCard.test.tsx`.

- [ ] **Step 3: Implement card and integrate into `LayeredHome`**

Inside `LayeredHome`, derive once with `getRunGuidance(state)` and render `<RunGuidanceCard guidance={guidance} />` near the shared home HUD/action context. Do not add a modal or local persistence state.

- [ ] **Step 4: Add focused CSS**

Add `.run-guidance-card` rules with:
- wrapping via `overflow-wrap:anywhere`;
- compact responsive spacing;
- route-tone modifiers;
- `:focus-visible` support for adjacent actionable home controls;
- `@media (prefers-reduced-motion: reduce)` disabling decorative home motion;
- safe-area-aware bottom spacing and minimum 44px interactive targets without changing unrelated screens.

- [ ] **Step 5: Run UI/mobile regression**

Run `npm run test -- src/RunGuidanceCard.test.tsx src/LayeredHome.test.tsx src/HollowPathHub.test.tsx src/FifthPathHub.test.tsx` plus existing 360/390/430 accessibility suites.

- [ ] **Step 6: Commit**

Commit `feat: improve home journey guidance`.

### Task 3: Repeat-play QoL and route presentation consistency

**Files:**
- Modify only if RED requires: `src/FifthPathHub.tsx`, `src/HollowPathHub.tsx`, `src/ConvergencePanel.tsx`, their existing tests.
- Create: `src/v3-expanded-polish-qol.test.tsx`

**Interfaces:**
- Consumes existing route/season/candidate semantic DTOs.
- Produces no new authoritative state.

- [ ] **Step 1: Write RED regression covering re-entry**

Exercise Home → Fifth/Hollow semantic presentation after reload/re-entry and assert:
- current objective/route remains readable;
- candidate availability is not auto-selection;
- resolved one-shot choice does not reappear;
- completed/locked states provide non-empty explanatory copy.

- [ ] **Step 2: Run RED and identify the smallest actual presentation gap**

Run `npm run test -- src/v3-expanded-polish-qol.test.tsx` together with Fifth/Hollow hub suites.

- [ ] **Step 3: Make only RED-proven presentation fixes**

Prefer copy/derived-state adjustments. Do not alter route authority or persistence.

- [ ] **Step 4: Run GREEN**

Run QoL + Fifth/Hollow presentation suites.

- [ ] **Step 5: Commit**

Commit `fix: reduce repeat run presentation friction` only if production code changed; otherwise commit the regression test as `test: cover repeat run presentation`.

### Task 4: Persistence and multi-run hardening

**Files:**
- Create: `src/v3-expanded-polish-persistence.test.ts`
- Modify only for RED-proven defects: `src/v3-persistent-state.ts`, `src/campaign-state.ts`, `src/legacy-state.ts`, `src/ngplus-replay.ts`, save resilience/schema modules.

**Interfaces:**
- Uses existing V3 selection/hydration/NEW_RUN APIs.
- Adds no new persisted field.

- [ ] **Step 1: Write persistence RED suite**

Table-test:
- save → hydrate → save equality;
- partial/malformed persistent objects;
- NaN/Infinity contamination;
- duplicate canonical IDs where sanitizers dedupe;
- True ending → reload → NEW_RUN;
- Hollow ending → reload → NEW_RUN;
- current danger/route/world/tactical reset while compact echoes remain;
- immediate second NEW_RUN no-op;
- inherited echoes cannot manufacture current Hollow authority.

- [ ] **Step 2: Run RED with existing save suites**

Run `npm run test -- src/v3-expanded-polish-persistence.test.ts src/save-resilience.test.ts src/save-schema.test.ts src/global-release-candidate-malformed-numbers.test.ts`.

- [ ] **Step 3: Trace and fix only reproduced failures**

For each failure, identify the source sanitizer/handoff, write a narrow assertion, then make the smallest production fix.

- [ ] **Step 4: Run persistence GREEN and full NG+ regression**

Include existing NG+ multicycle, Fifth persistence and Hollow persistence suites.

- [ ] **Step 5: Commit**

Commit `test: harden expanded polish persistence` if no production gap exists, otherwise `fix: harden v3 persistence across repeat runs`.

### Task 5: Reproducible CI, dependency/security classification and production readiness

**Files:**
- Modify: `.github/workflows/ci.yml`
- Modify only when evidence requires: `package.json`, `package-lock.json`, `vite.config.*`, `vercel.json`
- Create: `docs/release/v3-release-checklist.md`

**Interfaces:**
- CI remains test/build authority for PRs.

- [ ] **Step 1: Capture current install warning from the latest known GREEN CI job**

Read CI install logs and identify the exact vulnerable dependency/path and whether it is runtime or tooling-only.

- [ ] **Step 2: Make clean installation deterministic**

Replace CI `npm install` with `npm ci` because `package-lock.json` is committed. Keep Node 22 and existing test/build steps.

- [ ] **Step 3: Resolve security warning only when safe**

If the vulnerable package can be removed by a lockfile-compatible patch/minor update without a major API migration, update manifest/lockfile consistently and verify clean install. If it requires a major toolchain migration, do not force the upgrade in Polish; document package, severity, dependency path and why it is tooling-only/runtime-relevant in the release checklist.

- [ ] **Step 4: Verify production configuration**

Check existing Vite/Vercel routing and asset behavior. Modify only a reproduced routing/build fallback defect.

- [ ] **Step 5: Write release checklist**

Checklist contains exact gates: `npm ci`, full test, `tsc -b && vite build`, normal/NG+/True/Hollow soak, Tactical AUTO/stress, mobile/a11y, persistence/malformed, security classification, exact tree, non-force integration promotion, main/prod untouched.

- [ ] **Step 6: Commit**

Commit `ci: make v3 release verification reproducible`.

### Task 6: Expanded multi-cycle soak

**Files:**
- Create: `src/v3-expanded-polish-soak.test.ts`

**Interfaces:**
- Reuses existing campaign, ending, NG+, Fifth, Hollow and persistence APIs.
- Does not duplicate low-level Tactical engine implementation tests.

- [ ] **Step 1: Write connected soak**

Cover at least three sequential run boundaries in one canonical state lineage:
1. normal campaign completion → NEW_RUN;
2. eligible True/Fifth completion → save/reload → NEW_RUN;
3. Hollow candidate/explicit acceptance → fail-forward terminal result → ending → save/reload → NEW_RUN.

After every boundary assert:
- run number advances once;
- current campaign/route/danger/world/tactical authority is clean as designed;
- intended Legacy/World/Bond echoes remain;
- repeated terminal/NEW_RUN action is idempotent.

- [ ] **Step 2: Run soak GREEN**

Run `npm run test -- src/v3-expanded-polish-soak.test.ts`.

- [ ] **Step 3: Run stress neighbours**

Run Tactical stability including AUTO 10/50/100, Expedition stress, Season/meta long-run and existing NG+ multicycle suites.

- [ ] **Step 4: Commit**

Commit `test: soak v3 across expanded repeat runs`.

### Task 7: Full release gate

**Files:**
- No production change unless a reproduced regression is found.
- Update: `docs/release/v3-release-checklist.md` with evidence.

- [ ] **Step 1: Run all Expanded Polish targeted suites**

Run guidance, Home, QoL, persistence and soak suites together.

- [ ] **Step 2: Run full tests**

Run `npm run test`; record exact test-file/test counts.

- [ ] **Step 3: Run production build**

Run `npm run build` (`tsc -b && vite build`); record module/build output.

- [ ] **Step 4: Verify clean install CI**

PR CI must demonstrate `npm ci`, test and build on the exact candidate head/synthetic merge ref.

- [ ] **Step 5: Classify remaining warnings**

No unclassified high-severity runtime vulnerability, failing regression, malformed-save defect, accessibility blocker or build warning is allowed into RC.

- [ ] **Step 6: Record exact tested tree**

Fetch candidate commit/tree and PR synthetic merge tree; require the tree used for promotion to match the tested tree exactly.

### Task 8: V3 Release Candidate promotion

**Files:**
- Update issue #54/release checklist only after GREEN.

- [ ] **Step 1: Confirm baseline has not moved unexpectedly**

Compare current `integration/v3` against baseline and candidate. If baseline moved outside this Wave, stop and reconcile before promotion.

- [ ] **Step 2: Advance `integration/v3` once, non-force**

Use a fast-forward/non-force ref update or an already-tested merge whose resulting tree exactly equals the tested tree.

- [ ] **Step 3: Verify promotion**

Fetch the new `integration/v3` commit and verify its tree equals the tested tree; verify main/prod unchanged.

- [ ] **Step 4: Record RC checkpoint**

Post exact SHA/tree, CI run/job, test counts, build output, security classification and release checklist status to #54. Mark Expanded Polish complete / V3 RC ready.
