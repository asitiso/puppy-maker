# V14 Deep Living World Consequences + Final Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make canonical World Facts, inherited NG+ echoes, companion identity/Bond, season/time/weather, and fail-soft behavior visibly affect scenes, then run the complete V14 mobile/accessibility/reload/regression release gate.

**Architecture:** Scene Resolver remains deterministic and derives presentation from canonical current/inherited facts. A focused consequence mapper adds concrete scene props/interactions/presentation tags; it never grants progression. Companion presentation is derived from existing role/Bond only. Final gating verifies all five product areas share the Scene architecture and that mobile safety regressions remain fixed.

**Tech Stack:** React, TypeScript, Vitest, CSS, GitHub Actions/Vite production build, existing V14 Scene system.

**Spec:** `docs/superpowers/specs/2026-08-28-v14-deep-living-world-expansion-design.md`

## Global Constraints
- Canonical World Fact IDs only; do not invent a second world-state store.
- Current-run facts and inherited NG+ echoes must be visibly distinguishable.
- Bond presentation cannot create another Bond value or reward formula.
- Story/World Fact priority must remain ahead of weekly weather/default presentation.
- Optional visuals and malformed metadata fail soft and cannot block canonical gameplay.
- Final mobile targets: 360x640, 390x844, ~430px; >=44px tap targets, safe-area, Korean wrapping, focus-visible, reduced motion.

---

### Task 1: Convert important World Facts into concrete scene consequences

**Files:**
- Create: `src/scene/scene-consequences.ts`
- Create: `src/scene/scene-consequences.test.ts`
- Modify: `src/scene/scene-resolver.ts`
- Modify: `src/scene/scene-registry.ts`
- Modify: `src/scene/scene-types.ts` only if prop interaction metadata needs a narrow typed field

**Interfaces:**
```ts
export type SceneConsequence={factId:string;layerToken:string;interactionId?:string;interactionLabel?:string;location?:LocationId;inherited:boolean};
export function resolveSceneConsequences(input:{location:LocationId;worldFacts:readonly string[];inheritedWorldFacts:readonly string[]}):readonly SceneConsequence[];
```

Required current-fact mappings include: `festival_saved`, `festival_heavy_losses`, `ancient_route_opened`, route-sealed/limited equivalent if canonical, `regional_alliance`, `rift_unstable`, `rift_stabilized`, `true_path_world_rewoven`, `hollow_rift_entrenched` when those IDs exist canonically.

- [ ] **Step 1: Write failing current-vs-inherited tests**
```ts
const current=resolveSceneConsequences({location:'village',worldFacts:['festival_saved'],inheritedWorldFacts:[]});
expect(current[0].inherited).toBe(false);
const echo=resolveSceneConsequences({location:'village',worldFacts:[],inheritedWorldFacts:['festival_saved']});
expect(echo[0].inherited).toBe(true);
expect(echo[0].layerToken).not.toBe(current[0].layerToken);
```
- [ ] **Step 2: Run RED**
Run: `npx vitest run src/scene/scene-consequences.test.ts`
Expected: FAIL because focused consequence mapper is absent.
- [ ] **Step 3: Implement canonical-ID mapping**
Current fact tokens use `world-fact:<id>`; inherited echoes use `inherited-world-fact:<id>` and optional inspect-only affordances. Unknown facts may remain generic non-blocking tokens but cannot create travel/reward behavior.
- [ ] **Step 4: Merge consequences in resolver**
Add/enable props/interactions only after base registry resolution. Do not mutate canonical facts.
- [ ] **Step 5: Run GREEN**
Run: `npx vitest run src/scene/scene-consequences.test.ts src/scene/scene-resolver.test.ts src/scene/scene-asset-registry.test.ts`
Expected: PASS.
- [ ] **Step 6: Commit**
```bash
git add src/scene/scene-consequences.ts src/scene/scene-consequences.test.ts src/scene/scene-resolver.ts src/scene/scene-registry.ts src/scene/scene-types.ts
git commit -m "feat(v14): materialize canonical world consequences"
```

### Task 2: Deepen companion role/Bond presentation without gameplay duplication

**Files:**
- Create: `src/scene/companion-presentation.ts`
- Create: `src/scene/companion-presentation.test.ts`
- Modify: `src/scene/scene-resolver.ts`
- Modify: `src/scene/CharacterActor.tsx`
- Modify: `src/scene/scene.css`

**Interfaces:**
```ts
export type CompanionPresentation={anchorPreference:'protect'|'observe'|'scout'|'curious';motion:string;proximity:'far'|'normal'|'near';reactionTag:string};
export function resolveCompanionPresentation(actorId:'bear'|'owl'|'wolf'|'cat',bondLevel:number):CompanionPresentation;
```

- [ ] **Step 1: Write failing identity tests**
Bear=`protect`, Owl=`observe`, Wolf=`scout`, Cat=`curious`; higher Bond may change `proximity` from normal to near but never changes any canonical value.
- [ ] **Step 2: Run RED**
Run: `npx vitest run src/scene/companion-presentation.test.ts`
Expected: FAIL because module is absent.
- [ ] **Step 3: Implement pure mapping and resolver integration**
Derive only actor anchor bias/motion/presentation tags. If a companion is not selected/present, base scene progression interactions remain available.
- [ ] **Step 4: Run GREEN**
Run: `npx vitest run src/scene/companion-presentation.test.ts src/scene/scene-resolver.test.ts`
Expected: PASS.
- [ ] **Step 5: Commit**
```bash
git add src/scene/companion-presentation.ts src/scene/companion-presentation.test.ts src/scene/scene-resolver.ts src/scene/CharacterActor.tsx src/scene/scene.css
git commit -m "feat(v14): express companion identity across living scenes"
```

### Task 3: Fail-soft and reduced-motion equivalence pass

**Files:**
- Modify: `src/scene/scene-asset-registry.ts`
- Modify: `src/scene/scene-resolver.ts`
- Modify: `src/scene/activity-checkpoint.ts`
- Modify: `src/scene/scene.css`
- Create: `src/v14-living-world-fail-soft.test.ts`

- [ ] **Step 1: Write failing recovery tests**
Assert unknown location -> Home; missing actor pose -> idle/current fallback; malformed checkpoint -> safe null/pre-commit state; unknown optional visual token does not throw; reduced-motion CSS removes transition/animation but not interaction semantics.
- [ ] **Step 2: Run RED**
Run: `npx vitest run src/v14-living-world-fail-soft.test.ts src/scene/activity-checkpoint.test.ts`
Expected: at least one new recovery assertion FAIL before the pass.
- [ ] **Step 3: Make the minimal fail-soft fixes**
Keep each fallback at its existing ownership boundary. Do not add broad try/catch around domain commits.
- [ ] **Step 4: Run GREEN**
Run: `npx vitest run src/v14-living-world-fail-soft.test.ts src/scene/scene-asset-registry.test.ts src/scene/scene-resolver.test.ts src/scene/activity-checkpoint.test.ts`
Expected: PASS.
- [ ] **Step 5: Commit**
```bash
git add src/scene/scene-asset-registry.ts src/scene/scene-resolver.ts src/scene/activity-checkpoint.ts src/scene/scene.css src/v14-living-world-fail-soft.test.ts
git commit -m "fix(v14): fail soft across living world presentation"
```

### Task 4: Add one cross-feature Deep Living World acceptance suite

**Files:**
- Create: `src/v14-deep-living-world-acceptance.test.tsx`
- Modify existing regression tests only when they encode superseded implementation details while preserving their user-visible invariant.

**Interfaces:** acceptance tests are integration/static-contract tests; they do not introduce production APIs.

- [ ] **Step 1: Write the acceptance suite**
Cover these exact product contracts:
1. Home uses SceneDirector/SceneStage and still exposes quick menu.
2. weekly schedule preserves Hunt/Magic/Herb order and every non-rest activity is playable.
3. Forest/Village/Lakeside expose target-driven Scene interactions backed by Outing adapter.
4. Story scene uses canonical `EVENT_CHOICE` and cannot reclaim committed choice.
5. Expedition exposes semantic journey nodes and hands encounter to existing Tactical flow.
6. Tactical completion proof advances post-encounter and duplicate completion is rejected.
7. current World Fact and inherited echo tokens are distinct.
8. 44px targets, safe-area, readable schedule labels, fixed Expedition CTA and Loadout exit invariants remain encoded.

- [ ] **Step 2: Run RED/GREEN**
Run: `npx vitest run src/v14-deep-living-world-acceptance.test.tsx`
Expected: RED until all prior plans are implemented; after implementation PASS.
- [ ] **Step 3: Run targeted UX regressions together**
Run: `npx vitest run src/v14-deep-living-world-acceptance.test.tsx src/v14-ux-regression-batch.test.ts src/v13-tactical-no-overlap.test.ts src/v9-mobile-active-play.test.tsx`
Expected: PASS.
- [ ] **Step 4: Commit**
```bash
git add src/v14-deep-living-world-acceptance.test.tsx
git commit -m "test(v14): gate deep living world player flows"
```

### Task 5: Full V14 product gate

**Files:** no planned production changes; fix only root-cause failures discovered by the gate.

- [ ] **Step 1: Run all focused V14 Scene/adapter tests**
Run: `npx vitest run src/scene src/training-minigames.test.ts src/v14-deep-living-world-acceptance.test.tsx src/v14-ux-regression-batch.test.ts`
Expected: PASS.

- [ ] **Step 2: Run full regression**
Run: `npm test`
Expected: every test file/test PASS. Record the exact final counts.

- [ ] **Step 3: Run dependency audit**
Run: `npm audit --audit-level=low`
Expected: zero unresolved vulnerabilities, or treat any non-zero finding as a release blocker requiring explicit resolution/review.

- [ ] **Step 4: Run production build**
Run: `npm run build`
Expected: `tsc -b && vite build` PASS; record transformed module count/build result.

- [ ] **Step 5: Verify mobile invariants**
Use existing tests/static CSS contracts to confirm 360x640, 390x844 and ~430px paths: Start CTA reachable, Home alert rail outside character lane, Party Loadout local close works, schedule text remains readable, all actionable scene targets >=44px, Korean text wraps, safe-area padding present.

- [ ] **Step 6: Verify PR preview/CI before promotion**
After pushing the implementation head, confirm GitHub Actions and Vercel status on PR #217 for that exact head/merge ref. Do not rely on an older green run.

- [ ] **Step 7: Update PR #217 body with Deep Living World scope and evidence**
Include implemented waves, exact head SHA, full test counts, audit result, build result, Vercel status, and remaining manual visual checks if any.

- [ ] **Step 8: Integration promotion rule**
Only after exact-head CI/preview is GREEN and no review thread blocks the PR: merge/promote to `integration/v3`, verify the resulting integration SHA and integration CI, then separately evaluate `integration/v3 -> main`. Never claim main/production until those concrete promotions/deployments are verified.
