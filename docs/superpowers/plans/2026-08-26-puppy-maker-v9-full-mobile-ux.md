# Puppy Maker V9 Full Mobile UX Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Puppy Maker’s mobile presentation into a coherent one-handed game UX with predictable navigation, readable page hierarchy, mobile-first Tactical/choice surfaces, and semantic replaceable art slots while preserving game/save/progression semantics.

**Architecture:** Keep the V8 `mobile-router` and `Root` as navigation authority. Add a V9 presentation layer composed of a central visual-asset registry, reusable scene/page/action/feedback primitives, recommendation-first category dashboards, and route-aware scroll restoration. Existing feature calculations and callbacks remain authoritative; V9 removes legacy mobile modal framing where the current routed feature is exposed without changing battle/reward/save logic.

**Tech Stack:** React 19, TypeScript, Vitest, CSS, Vite 8, existing Puppy Maker game domain/reducer modules.

**Spec:** `docs/superpowers/specs/2026-08-26-puppy-maker-v9-full-mobile-ux-design.md`

## Global Constraints

- V8 router remains the single navigation authority.
- Ordinary screens keep `홈 / 생활 / 성장 / 모험 / 인연 / 기록` visible.
- Active training, active Tactical battle, and unresolved choice events show guarded `뒤로 + 홈` only.
- Category dashboards have no separate sticky back control; feature pages have exactly one `MobilePageShell` header back control.
- One main vertical scroll container per normal V9 page.
- Minimum touch target 44×44px; normal action at least 48px; primary CTA 52–56px.
- Required viewport contracts: 360×640, 390×844, 430px width, plus short-height behavior.
- Art paths are centralized in `src/mobile-visual-assets.ts`; major V9 screen components consume semantic visual configuration instead of final-art paths.
- Missing art retains readable, usable gradient/CSS fallbacks.
- Save schema, progression, economy, Tactical engine, campaign/NG+ outcomes remain unchanged unless an independent correctness bug is proven.
- Promotion order is `work/v9-full-mobile-ux → integration/v3 → main → production`.

## File Structure

**Create**
- `src/mobile-visual-assets.ts` — typed semantic art registry.
- `src/MobileSceneBackground.tsx` — decorative image/fallback renderer.
- `src/MobileCharacterArt.tsx` — replaceable character/companion renderer.
- `src/MobilePageShell.tsx` — page header/back/scene/single-scroll/sticky-action boundary.
- `src/MobilePrimaryAction.tsx` — CTA + disabled-reason primitive.
- `src/MobileFeedback.tsx` — non-blocking success/info/error feedback.
- `src/mobile-scroll-memory.ts` — in-memory route scroll positions.
- `src/mobile-category-guidance.ts` — pure category recommendation selectors.
- `src/mobile-v9.css` — V9 scene/page/dashboard/feature/responsive rules.
- V9 test files listed in the tasks below.

**Modify**
- `src/Root.tsx`
- `src/MobileRouterChrome.tsx`
- `src/MobileHomeStatus.tsx`
- `src/LayeredHome.tsx`
- `src/MobileCategoryPage.tsx`
- `src/MobileLegacyFeaturePage.tsx`
- `src/RaisingIdentityOverlay.tsx`
- `src/YearlyAmbitionOverlay.tsx`
- `src/SeasonLiveOpsOverlay.tsx`
- `src/SanctuaryOverlay.tsx`
- `src/GuardianExpeditionOverlay.tsx`
- `src/WorldProgressOverlay.tsx`
- `src/CollectionArchiveOverlay.tsx`
- `src/App.tsx`
- `src/styles.css`
- `src/TacticalExpeditionFlow.tsx`
- `src/TacticalBattleScreen.tsx`
- `src/tactical-battle.css`

---

### Task 1: Replaceable Visual Asset Registry and Renderers

**Files:**
- Create: `src/mobile-visual-assets.ts`
- Create: `src/MobileSceneBackground.tsx`
- Create: `src/MobileCharacterArt.tsx`
- Create: `src/mobile-v9.css`
- Create: `src/v9-mobile-visual-assets.test.tsx`

**Interfaces:**

```ts
export type MobileVisualOverlay='none'|'light'|'medium'|'heavy';
export type MobileVisualFallback='home'|'life'|'growth'|'adventure'|'bond'|'records'|'battle'|'victory'|'defeat'|'character';
export type MobileVisualAsset={
  src?:string;
  fit:'cover'|'contain';
  position:string;
  overlay:MobileVisualOverlay;
  alt?:string;
  fallback:MobileVisualFallback;
};
export type MobileVisualSlot=
  |'home.background'|'home.hero'
  |'category.life.background'|'category.growth.background'|'category.adventure.background'|'category.bond.background'|'category.records.background'
  |'feature.raising.background'|'feature.ambition.background'|'feature.season.background'|'feature.sanctuary.background'|'feature.expedition.background'|'feature.world.background'|'feature.archive.background'
  |'battle.default.background'|'battle.forest.background'|'battle.ruins.background'|'battle.rift.background'
  |'battle.result.victory'|'battle.result.defeat'
  |'companion.bear.portrait'|'companion.owl.portrait'|'companion.wolf.portrait'|'companion.cat.portrait'
  |'companion.bear.battle'|'companion.owl.battle'|'companion.wolf.battle'|'companion.cat.battle';
export const mobileVisualAssets:Record<MobileVisualSlot,MobileVisualAsset>;
export function getMobileVisualAsset(slot:MobileVisualSlot):MobileVisualAsset;
```

- [ ] **Step 1: Write the failing registry/render test**

```tsx
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it} from 'vitest';
import MobileSceneBackground from './MobileSceneBackground';
import MobileCharacterArt from './MobileCharacterArt';
import {getMobileVisualAsset,mobileVisualAssets,type MobileVisualSlot} from './mobile-visual-assets';

const required:MobileVisualSlot[]=[
  'home.background','home.hero','category.life.background','category.growth.background','category.adventure.background','category.bond.background','category.records.background',
  'feature.raising.background','feature.ambition.background','feature.season.background','feature.sanctuary.background','feature.expedition.background','feature.world.background','feature.archive.background',
  'battle.default.background','battle.forest.background','battle.ruins.background','battle.rift.background','battle.result.victory','battle.result.defeat',
  'companion.bear.portrait','companion.owl.portrait','companion.wolf.portrait','companion.cat.portrait','companion.bear.battle','companion.owl.battle','companion.wolf.battle','companion.cat.battle',
];

describe('V9 visual assets',()=>{
  it('defines every semantic slot with a fallback',()=>{
    for(const slot of required){expect(mobileVisualAssets[slot]).toBeTruthy();expect(getMobileVisualAsset(slot).fallback).toBeTruthy();}
  });
  it('renders usable fallback layers',()=>{
    expect(renderToStaticMarkup(<MobileSceneBackground slot="battle.default.background"/>)).toContain('v9-scene-fallback');
    expect(renderToStaticMarkup(<MobileCharacterArt slot="companion.bear.portrait"/>)).toContain('v9-character-art');
  });
});
```

- [ ] **Step 2: Run RED**

Run: `npx vitest run src/v9-mobile-visual-assets.test.tsx`  
Expected: FAIL because the V9 registry/renderers do not exist.

- [ ] **Step 3: Implement the registry**

Use existing repository image paths only inside `mobile-visual-assets.ts`. Any future generated art lives under `/assets/mobile-v9/` and is enabled by changing only registry entries. Every slot has a fallback theme even when `src` is omitted.

- [ ] **Step 4: Implement `MobileSceneBackground` and `MobileCharacterArt`**

Both keep a CSS fallback layer mounted. A failed `<img>` hides itself using component-local error state. Background images are decorative (`aria-hidden="true"`); meaningful character art uses registry `alt`.

- [ ] **Step 5: Run GREEN + repository gate**

Run:
- `npx vitest run src/v9-mobile-visual-assets.test.tsx`
- `npm run test`
- `npm run build`

Expected: all GREEN.

- [ ] **Step 6: Commit**

`git commit -am "feat: add replaceable V9 visual asset system"` after staging new files.

---

### Task 2: Mobile Page Shell, CTA, Feedback and Scroll Memory

**Files:**
- Create: `src/MobilePageShell.tsx`
- Create: `src/MobilePrimaryAction.tsx`
- Create: `src/MobileFeedback.tsx`
- Create: `src/mobile-scroll-memory.ts`
- Create: `src/v9-mobile-page-shell.test.tsx`
- Modify: `src/mobile-v9.css`
- Modify: `src/MobileRouterChrome.tsx`

**Interfaces:**

```ts
export type MobilePageShellProps={
  routeKey:string;
  eyebrow?:string;
  title:string;
  description?:string;
  visualSlot?:MobileVisualSlot;
  onBack?:()=>void;
  children:React.ReactNode;
  stickyAction?:React.ReactNode;
};
export function rememberMobileScroll(routeKey:string,top:number):void;
export function readMobileScroll(routeKey:string):number;
export function clearMobileScroll(routeKey:string):void;
export type MobilePrimaryActionProps={label:string;onClick?:()=>void;disabled?:boolean;reason?:string;tone?:'primary'|'danger'};
```

- [ ] **Step 1: Write RED tests**

Test exactly one `data-mobile-page-scroll`, exactly one feature back when `onBack` exists, no category back when it does not, visible disabled reason/`aria-describedby`, and non-modal feedback markup.

- [ ] **Step 2: Run RED**

Run: `npx vitest run src/v9-mobile-page-shell.test.tsx`  
Expected: FAIL because V9 page primitives do not exist.

- [ ] **Step 3: Implement scroll memory**

```ts
const positions=new Map<string,number>();
export const rememberMobileScroll=(key:string,top:number)=>positions.set(key,Math.max(0,Number.isFinite(top)?top:0));
export const readMobileScroll=(key:string)=>positions.get(key)??0;
export const clearMobileScroll=(key:string)=>positions.delete(key);
```

No save writes.

- [ ] **Step 4: Implement page/action/feedback primitives**

`MobilePageShell` owns page header/back, scene background, one scroll body, optional sticky action, and scroll restore. `MobilePrimaryAction` renders a reason in visible text when disabled. `MobileFeedback` uses `role="status"` or `role="alert"` without a backdrop.

- [ ] **Step 5: Remove V8 ordinary sticky route-back rendering**

In `MobileRouterChrome.tsx`, keep global status, six tabs, guarded play chrome, exit dialog and route-body container, but remove ordinary `.v8-route-back` markup. Feature pages receive router BACK through `MobilePageShell.onBack`.

- [ ] **Step 6: Run targeted/full/build**

Run:
- `npx vitest run src/v9-mobile-page-shell.test.tsx src/v8-mobile-router-ui.test.tsx`
- `npm run test`
- `npm run build`

Expected: GREEN; V8 compatibility assertions may change only where the approved V9 back-ownership rule intentionally supersedes them.

- [ ] **Step 7: Commit**

`git commit -am "feat: add V9 mobile page system"` after staging new files.

---

### Task 3: Home and Compact Status Rebuild

**Files:**
- Modify: `src/MobileHomeStatus.tsx`
- Modify: `src/LayeredHome.tsx`
- Modify: `src/Root.tsx`
- Modify: `src/mobile-v9.css`
- Create: `src/v9-mobile-home-status.test.tsx`

**Interfaces:**
- Consume `home.background`, `home.hero`, `MobileSceneBackground`, `MobileCharacterArt`.
- Preserve the existing `hubNextAction(state)` callback semantics.

- [ ] **Step 1: Write RED contracts**

Assert status has a context row and resource row, notification remains a separate button, home consumes semantic visual slots, and only one authoritative primary CTA remains.

- [ ] **Step 2: Run RED**

Run: `npx vitest run src/v9-mobile-home-status.test.tsx`  
Expected: FAIL on new V9 home/status contracts.

- [ ] **Step 3: Implement compact presentation-only resource formatting**

```ts
export function compactResource(value:number):string{
  const safe=Number.isFinite(value)?Math.max(0,value):0;
  if(safe>=1_000_000)return `${(safe/1_000_000).toFixed(safe>=10_000_000?0:1)}M`;
  if(safe>=10_000)return `${(safe/1_000).toFixed(safe>=100_000?0:1)}K`;
  return Math.round(safe).toLocaleString();
}
```

Expose full values through accessible labels/title when compacted.

- [ ] **Step 4: Recompose home**

Keep Luna/hero, one `hubNextAction`, compact attention/claimable strip only when meaningful, dialogue, and six-tab nav. Do not restore hidden shortcut/promo/menu walls.

- [ ] **Step 5: Add 360px/short-height rules**

Decorative art shrinks before controls or readable text; no horizontal overflow; Safe Area remains clear.

- [ ] **Step 6: Verify**

Run `npx vitest run src/v9-mobile-home-status.test.tsx`, then `npm run test` and `npm run build`.

- [ ] **Step 7: Commit**

`git commit -am "feat: rebuild V9 mobile home and status"` after staging the test.

---

### Task 4: Recommendation-First Category Dashboards

**Files:**
- Create: `src/mobile-category-guidance.ts`
- Modify: `src/MobileCategoryPage.tsx`
- Modify: `src/Root.tsx`
- Modify: `src/mobile-v9.css`
- Create: `src/v9-mobile-category-dashboard.test.tsx`

**Interfaces:**

```ts
export type MobileCategoryRecommendation={feature:MobileFeatureId;title:string;reason:string;badge?:string};
export function mobileCategoryRecommendation(state:GameState,category:MobileContentCategory):MobileCategoryRecommendation;
```

- [ ] **Step 1: Write RED guidance/dashboard tests**

Cover: claimable attendance/mail before life default schedule; claimable achievement before growth default; adventure recommendation from existing expedition/world state; available gift before bond default; archive/recent records default. Every recommendation must belong to the selected category.

- [ ] **Step 2: Run RED**

Run: `npx vitest run src/v9-mobile-category-dashboard.test.tsx`  
Expected: FAIL because guidance module/dashboard order does not exist.

- [ ] **Step 3: Implement guidance using existing authoritative selectors**

Reuse `currentAvailableMail`, `eligibleAchievements`, attendance state, inventory and existing progression state; do not clone reward eligibility formulas.

- [ ] **Step 4: Rebuild `MobileCategoryPage` inside `MobilePageShell`**

No `onBack`. Order: recommendation hero → at most three active/claimable items → grouped secondary features. Records expose archive before long chronicles; chronicles become expandable/non-blocking sections.

- [ ] **Step 5: Restore category scroll after feature BACK**

Use route keys `category:life`, `category:growth`, `category:adventure`, `category:bond`, `category:records` through Task 2 scroll memory.

- [ ] **Step 6: Verify and commit**

Run `npx vitest run src/v9-mobile-category-dashboard.test.tsx src/mobile-router.test.ts`, `npm run test`, `npm run build`; then commit `feat: rebuild V9 category dashboards`.

---

### Task 5: Ordinary Feature Page Migration

**Files:**
- Modify: `src/MobileLegacyFeaturePage.tsx`
- Modify: `src/Root.tsx`
- Modify: `src/mobile-v9.css`
- Create: `src/v9-mobile-feature-pages.test.tsx`

**Interfaces:**
- Preserve existing callbacks: `onClaimAchievement`, `onOuting`, `onGift`, `onAttendance`, `onMail`, `onMonthlyFocus`.
- Consume `MobilePageShell`, `MobilePrimaryAction`, `MobileFeedback`.

- [ ] **Step 1: Write RED feature tests**

Render achievements, attendance, mail, gifts and outing examples. Assert one contextual back, ≥48px action contract, visible reasons for disabled rows (`수령 완료`, `조건을 달성하면`, `보유한 선물이 없어요`, etc.), and non-blocking success feedback boundary.

- [ ] **Step 2: Run RED**

Run: `npx vitest run src/v9-mobile-feature-pages.test.tsx`  
Expected: FAIL against legacy flat disabled rows.

- [ ] **Step 3: Replace `Row` with a V9 action-card contract**

The card accepts `disabledReason?:string`, renders reason visibly, and uses existing boolean eligibility. Do not add new reward rules.

- [ ] **Step 4: Wrap ordinary features in `MobilePageShell`**

Use `routeKey={`feature:${feature}`}` and router BACK supplied by `Root`. Achievements, mission, attendance, mail, inventory, gifts, outing, bond and stories share one page scroll body.

- [ ] **Step 5: Add transient presentation feedback**

After existing callbacks succeed, show messages such as `출석 보상을 받았어요`, `선물을 전했어요`, `업적 보상을 받았어요`. Feedback does not change reducer rewards.

- [ ] **Step 6: Verify and commit**

Run targeted V9 feature tests, `npm run test`, `npm run build`; commit `feat: migrate ordinary features to V9 pages`.

---

### Task 6: Complex Feature Surface Migration

**Files:**
- Modify: `src/Root.tsx`
- Modify: `src/RaisingIdentityOverlay.tsx`
- Modify: `src/YearlyAmbitionOverlay.tsx`
- Modify: `src/SeasonLiveOpsOverlay.tsx`
- Modify: `src/SanctuaryOverlay.tsx`
- Modify: `src/GuardianExpeditionOverlay.tsx`
- Modify: `src/WorldProgressOverlay.tsx`
- Modify: `src/CollectionArchiveOverlay.tsx`
- Modify: `src/mobile-v9.css`
- Create: `src/v9-mobile-complex-pages.test.tsx`

**Interfaces:**
- Preserve every existing state/action callback prop.
- When a component cannot render without fixed fullscreen framing, add one consistent optional prop: `embedded?:boolean`; default `false` preserves existing behavior/tests.

- [ ] **Step 1: Write RED framing contracts using the exact imported components above**

Assert V9 Root wraps routed complex features in `MobilePageShell`, supplies one BACK, selects semantic visual slots, and passes `embedded` where legacy fixed framing would otherwise create nested fullscreen layers.

- [ ] **Step 2: Run RED**

Run: `npx vitest run src/v9-mobile-complex-pages.test.tsx`  
Expected: FAIL while routed V8 surfaces still own legacy overlay framing.

- [ ] **Step 3: Add `embedded` framing behavior**

For each component that currently owns a fullscreen backdrop/close frame, `embedded=true` removes only that outer frame and close chrome. Content, calculations and callbacks remain identical.

- [ ] **Step 4: Route exact visual slots**

- RaisingIdentityOverlay → `feature.raising.background`
- YearlyAmbitionOverlay → `feature.ambition.background`
- SeasonLiveOpsOverlay → `feature.season.background`
- SanctuaryOverlay → `feature.sanctuary.background`
- GuardianExpeditionOverlay → `feature.expedition.background`
- WorldProgressOverlay → `feature.world.background`
- CollectionArchiveOverlay → `feature.archive.background`

- [ ] **Step 5: Run component suites plus full gate**

Use GitHub/file search to identify existing tests whose imports match the seven exact component names, run them together with `src/v9-mobile-complex-pages.test.tsx`, then `npm run test` and `npm run build`.

- [ ] **Step 6: Commit**

`git commit -am "feat: migrate complex features to V9 mobile pages"` after staging the test.

---

### Task 7: Training and Choice Event Active-Play UX

**Files:**
- Modify: `src/Root.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Modify: `src/mobile-v9.css`
- Create: `src/v9-mobile-active-play.test.tsx`

**Interfaces:**
- Preserve `App` reducer actions and domain state.
- V8 route screens remain `schedule | training | dialogue | result`.
- Active `training` and unresolved `dialogue` are guarded; schedule/result are ordinary.

- [ ] **Step 1: Write RED route/presentation contracts**

Assert schedule ordinary nav visible, training guarded, unresolved dialogue guarded, result ordinary nav restored, and confirmed exit uses the existing hub navigation path rather than direct progression mutation.

- [ ] **Step 2: Run RED**

Run: `npx vitest run src/v9-mobile-active-play.test.tsx`  
Expected: FAIL on new V9 viewport/result/choice contracts.

- [ ] **Step 3: Recompose inline `App.tsx` Schedule/Training/Dialogue/Result presentation only**

Do not change reducer dispatch types or reward calculations. Choice buttons remain reachable inside the available gameplay area. Guarded play receives maximum viewport after the guard header; result uses ordinary chrome and one clear completion action.

- [ ] **Step 4: Add exact CSS rules in `styles.css`/`mobile-v9.css`**

At 360×640, choice controls and result CTA remain above Safe Area and do not require nested page scroll. Decorative pet/background elements shrink first.

- [ ] **Step 5: Verify and commit**

Run `npx vitest run src/v9-mobile-active-play.test.tsx src/mobile-router.test.ts`, `npm run test`, `npm run build`; commit `feat: polish V9 training and choice flows`.

---

### Task 8: Tactical Mobile Layout and Replaceable Battle/Companion Art

**Files:**
- Modify: `src/TacticalBattleScreen.tsx`
- Modify: `src/TacticalExpeditionFlow.tsx`
- Modify: `src/tactical-battle.css`
- Create: `src/v9-tactical-mobile.test.tsx`

**Interfaces:**

```ts
// Presentation-only addition to TacticalBattleScreenProps
sceneSlot?:MobileVisualSlot;
```

Existing `BattleSession`, `resolveTacticalAction`, `resolveCombinationUltimate`, AUTO and `onComplete` contracts remain unchanged.

- [ ] **Step 1: Write RED Tactical tests**

Assert semantic battle background renderer, companion visual lookup by companion id, explicit targetable/down semantics, separate compact HUD/field/hand regions, victory/defeat visual slots, and unchanged engine call signatures.

- [ ] **Step 2: Run RED**

Run: `npx vitest run src/v9-tactical-mobile.test.tsx`  
Expected: FAIL on visual/layout hooks.

- [ ] **Step 3: Add scene selection in `TacticalExpeditionFlow.tsx`**

Map current expedition stage/encounter to `battle.default.background`, `battle.forest.background`, `battle.ruins.background`, or `battle.rift.background`, then pass `sceneSlot` to `TacticalBattleScreen`.

- [ ] **Step 4: Add companion art hooks**

Use `companion.${id}.battle` and portrait registry entries. Missing images render the same-size fallback; unit ids, target ids and combat state remain unchanged.

- [ ] **Step 5: Recompose `tactical-battle.css` for mobile**

Order: compact round/AUTO/speed HUD → battlefield → concise live log → ultimates when available → reachable hand/cards above Safe Area. Short-height rules reduce art/spacing before controls. Result controls remain visible.

- [ ] **Step 6: Preserve guarded phase behavior**

Active phase remains guarded; `result` phase is reported before result callbacks so ordinary nav can return.

- [ ] **Step 7: Verify and commit**

Run `npx vitest run src/v9-tactical-mobile.test.tsx`, then all existing tests found by searching `TacticalBattleScreen`, `tactical-ui`, `tactical-stability`, followed by `npm run test` and `npm run build`; commit `feat: rebuild V9 Tactical mobile presentation`.

---

### Task 9: Responsive, Accessibility and Full Regression Gate

**Files:**
- Modify: `src/mobile-v9.css`
- Modify V9 components from Tasks 1–8 only for defects proven by this gate.
- Create: `src/v9-mobile-responsive-contract.test.ts`

- [ ] **Step 1: Write RED CSS/accessibility contracts**

Assert source/CSS contains:
- `100dvh`;
- `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`;
- 360, 390 and 430 width contracts;
- short-height ≤650px contract;
- 44px touch minimum;
- 52px+ primary CTA;
- no horizontal overflow boundary;
- one V9 page-level vertical scroll implementation;
- `prefers-reduced-motion:reduce`;
- `:focus-visible`;
- image contrast overlay classes.

- [ ] **Step 2: Run RED and implement exact missing contracts**

Run: `npx vitest run src/v9-mobile-responsive-contract.test.ts`  
Expected: FAIL for any missing V9 requirement, then GREEN after exact CSS/accessibility corrections.

- [ ] **Step 3: Run all V9 tests together**

Run:
`npx vitest run src/v9-mobile-visual-assets.test.tsx src/v9-mobile-page-shell.test.tsx src/v9-mobile-home-status.test.tsx src/v9-mobile-category-dashboard.test.tsx src/v9-mobile-feature-pages.test.tsx src/v9-mobile-complex-pages.test.tsx src/v9-mobile-active-play.test.tsx src/v9-tactical-mobile.test.tsx src/v9-mobile-responsive-contract.test.ts`

Expected: GREEN.

- [ ] **Step 4: Run complete repository verification**

Run:
- `npm ci`
- `npm audit --json`
- `npm run test`
- `npm run build`

Expected: dependency audit total 0, all tests GREEN, TypeScript + Vite production build GREEN.

- [ ] **Step 5: Review code isolation**

Confirm no save-schema version/reward/economy constants/Tactical engine formulas changed and new final-art paths appear only in `mobile-visual-assets.ts` (apart from pre-existing legacy paths not touched by V9).

- [ ] **Step 6: Commit**

`git commit -am "test: lock V9 mobile usability contracts"` after staging the responsive test.

---

### Task 10: PR Review, Integration, Main and Production Verification

**Files:**
- No expected product changes unless verification proves a defect.
- Update PR and issue #201 with exact evidence.

- [ ] **Step 1: Verify source PR**

Record exact `work/v9-full-mobile-ux` SHA, synthetic merge CI, full test count, audit result and build result. Require zero unresolved review threads.

- [ ] **Step 2: Merge source PR with `expected_head_sha`**

Target `integration/v3`; reject merge if the validated source head moved.

- [ ] **Step 3: Verify exact integration commit/tree and open `integration/v3 → main` release PR**

Require its synthetic merge CI GREEN.

- [ ] **Step 4: Merge release PR with expected-head guard**

Record exact main merge SHA.

- [ ] **Step 5: Verify main push CI**

Require exact-main audit/test/build evidence.

- [ ] **Step 6: Verify Vercel exact-SHA production state**

If quota permits, require READY for the exact main SHA, HTTP success at canonical root and `/api/client-telemetry`, and no deployment-specific fatal/error evidence in the verification window.

If Vercel returns `api-deployments-free-per-day`, record it as an external blocker and do **not** claim production completion or repeatedly retrigger deployment.

- [ ] **Step 7: Close #201 only when truthful release gates are met**

If main is GREEN but Vercel production is externally blocked, leave #201 open with the exact blocker recorded.
