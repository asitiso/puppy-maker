# Puppy Maker V9 Full Mobile UX Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Puppy Maker’s mobile presentation into a coherent one-handed game UX with predictable navigation, readable page hierarchy, mobile-first Tactical/choice surfaces, and semantic replaceable art slots while preserving game/save/progression semantics.

**Architecture:** Keep the V8 `mobile-router` and `Root` as navigation authority. Add a V9 presentation layer composed of a central visual-asset registry, reusable scene/page/action/feedback primitives, recommendation-first category dashboards, and route-aware scroll restoration. Existing feature calculations and callbacks remain authoritative; V9 progressively removes legacy modal framing and Tactical presentation constraints without changing battle/reward logic.

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
- Art paths are centralized in `src/mobile-visual-assets.ts`; major V9 screen components must consume semantic visual configuration rather than hardcode final art paths.
- Missing art must retain readable, usable gradient/CSS fallbacks.
- Save schema, progression, economy, Tactical engine, campaign/NG+ outcomes remain unchanged unless an independent correctness bug is proven.
- Promotion order is `work/v9-full-mobile-ux → integration/v3 → main → production`.

---

## File Structure

### New foundation files

- `src/mobile-visual-assets.ts` — canonical semantic V9 visual registry and typed lookup.
- `src/MobileSceneBackground.tsx` — decorative background renderer with image-error fallback.
- `src/MobileCharacterArt.tsx` — foreground character/companion renderer with fallback.
- `src/MobilePageShell.tsx` — page title/back/scene/body/sticky-action boundary.
- `src/MobilePrimaryAction.tsx` — consistent CTA with disabled reason.
- `src/MobileFeedback.tsx` — compact accessible success/info/error feedback.
- `src/mobile-scroll-memory.ts` — in-memory semantic route scroll position store.
- `src/mobile-v9.css` — V9 page, scene, dashboard, feedback, responsive and accessibility styles.
- `src/mobile-category-guidance.ts` — pure recommendation/attention selectors for category dashboards.

### Existing presentation files to modify

- `src/Root.tsx` — inject V9 page/back/visual contracts while preserving router/state authority.
- `src/MobileRouterChrome.tsx` — remove ordinary sticky back on V9 surfaces; keep global status/nav/guard ownership.
- `src/MobileHomeStatus.tsx` — compact two-row status presentation and accessible compact number formatting.
- `src/LayeredHome.tsx` — expose existing home data/callbacks without reintroducing legacy navigation.
- `src/MobileCategoryPage.tsx` — replace flat feature listing with recommendation/attention/grouped dashboard.
- `src/MobileLegacyFeaturePage.tsx` — migrate ordinary features to `MobilePageShell`-compatible content and visible disabled reasons/feedback.
- complex feature components currently rendered from `Root.tsx` — neutralize legacy overlay framing or add embeddable/mobile-page mode where required.
- `src/TacticalExpeditionFlow.tsx` — pass semantic battle scene/companion visual context; preserve phase reporting.
- `src/TacticalBattleScreen.tsx` — mobile-first field/HUD/card/result rendering hooks; preserve engine calls.
- `src/tactical-battle.css` — Tactical viewport/safe-area/card/result layout.
- choice/training presentation files reached from `App.tsx` — add only presentation hooks required for V9 guarded page behavior.

### New V9 tests

- `src/v9-mobile-visual-assets.test.tsx`
- `src/v9-mobile-page-shell.test.tsx`
- `src/v9-mobile-category-dashboard.test.tsx`
- `src/v9-mobile-feature-pages.test.tsx`
- `src/v9-mobile-complex-pages.test.tsx`
- `src/v9-mobile-active-play.test.tsx`
- `src/v9-tactical-mobile.test.tsx`
- `src/v9-mobile-responsive-contract.test.ts`

---

### Task 1: Replaceable Visual Asset Registry and Renderers

**Files:**
- Create: `src/mobile-visual-assets.ts`
- Create: `src/MobileSceneBackground.tsx`
- Create: `src/MobileCharacterArt.tsx`
- Create: `src/v9-mobile-visual-assets.test.tsx`
- Modify/Create: `src/mobile-v9.css`

**Interfaces:**
- Produces:
  - `type MobileVisualSlot = ...` stable semantic slot union.
  - `type MobileVisualAsset = {src?:string;fit:'cover'|'contain';position:string;overlay:'none'|'light'|'medium'|'heavy';alt?:string;fallback:MobileVisualFallback}`.
  - `mobileVisualAssets: Record<MobileVisualSlot,MobileVisualAsset>`.
  - `getMobileVisualAsset(slot:MobileVisualSlot):MobileVisualAsset`.
  - `<MobileSceneBackground slot={slot}/>`.
  - `<MobileCharacterArt slot={slot} className? />`.
- Consumes: no new V9 interfaces.

- [ ] **Step 1: Write the failing semantic-slot test**

```tsx
import {describe,expect,it} from 'vitest';
import {getMobileVisualAsset,mobileVisualAssets,type MobileVisualSlot} from './mobile-visual-assets';

const required:MobileVisualSlot[]=[
  'home.background','home.hero',
  'category.life.background','category.growth.background','category.adventure.background','category.bond.background','category.records.background',
  'feature.raising.background','feature.season.background','feature.sanctuary.background','feature.world.background','feature.archive.background',
  'battle.default.background','battle.forest.background','battle.ruins.background','battle.rift.background',
  'battle.result.victory','battle.result.defeat',
  'companion.bear.portrait','companion.owl.portrait','companion.wolf.portrait','companion.cat.portrait',
  'companion.bear.battle','companion.owl.battle','companion.wolf.battle','companion.cat.battle',
];

describe('V9 replaceable mobile visual assets',()=>{
  it('defines every required semantic visual slot with a fallback',()=>{
    for(const slot of required){
      expect(mobileVisualAssets[slot]).toBeTruthy();
      expect(getMobileVisualAsset(slot).fallback).toBeTruthy();
    }
  });
});
```

- [ ] **Step 2: Run RED**

Run: `npx vitest run src/v9-mobile-visual-assets.test.tsx`
Expected: FAIL because `mobile-visual-assets.ts` does not exist.

- [ ] **Step 3: Implement typed registry with CSS-safe fallback themes**

Use explicit slot values and registry entries. Existing repository artwork may be referenced only from this registry. Optional new PNG/WebP files use `/assets/mobile-v9/...`; no component may depend on them existing.

Core type shape:

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
```

- [ ] **Step 4: Implement image-error fallbacks in renderers**

`MobileSceneBackground` keeps the fallback layer visible and hides a failed image after `onError`. `MobileCharacterArt` renders a themed silhouette/emblem fallback if no image or after image error. Background image element is `aria-hidden="true"`; foreground character alt comes from the registry.

- [ ] **Step 5: Add renderer assertions**

Use `renderToStaticMarkup` to verify fallback classes exist without `src`, semantic background is decorative, and meaningful character alt is present.

- [ ] **Step 6: Run GREEN and full gate**

Run:
- `npx vitest run src/v9-mobile-visual-assets.test.tsx`
- `npm run test`
- `npm run build`
Expected: all GREEN.

- [ ] **Step 7: Commit**

Commit message: `feat: add replaceable V9 visual asset system`

---

### Task 2: Mobile Page Shell, Primary CTA, Feedback and Scroll Memory

**Files:**
- Create: `src/MobilePageShell.tsx`
- Create: `src/MobilePrimaryAction.tsx`
- Create: `src/MobileFeedback.tsx`
- Create: `src/mobile-scroll-memory.ts`
- Create: `src/v9-mobile-page-shell.test.tsx`
- Modify: `src/mobile-v9.css`
- Modify: `src/MobileRouterChrome.tsx`

**Interfaces:**
- Consumes: `MobileVisualSlot`, `MobileSceneBackground` from Task 1.
- Produces:

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
```

- [ ] **Step 1: Write RED contracts**

Assert feature shell markup contains one `data-mobile-page-scroll`, an optional single `aria-label="이전 화면으로 돌아가기"`, and category shell without `onBack` contains none. Assert `MobileRouterChrome.tsx` no longer renders `.v8-route-back` for ordinary V9 pages.

- [ ] **Step 2: Run RED**

Run: `npx vitest run src/v9-mobile-page-shell.test.tsx`
Expected: FAIL because page shell and scroll memory do not exist.

- [ ] **Step 3: Implement scroll memory as in-memory module state**

```ts
const positions=new Map<string,number>();
export const rememberMobileScroll=(key:string,top:number)=>positions.set(key,Math.max(0,Number.isFinite(top)?top:0));
export const readMobileScroll=(key:string)=>positions.get(key)??0;
export const clearMobileScroll=(key:string)=>positions.delete(key);
```

No save-schema writes.

- [ ] **Step 4: Implement `MobilePageShell`**

Use one scrollable `<div className="v9-page-scroll" data-mobile-page-scroll>` with header/content inside it. On mount restore `scrollTop`; on unmount remember it. Sticky action is outside the scroll body but inside the page boundary and above bottom navigation.

- [ ] **Step 5: Implement `MobilePrimaryAction` disabled reason contract**

```ts
export type MobilePrimaryActionProps={
  label:string;
  onClick?:()=>void;
  disabled?:boolean;
  reason?:string;
  tone?:'primary'|'danger';
};
```

When disabled and `reason` exists, render the reason in visible text linked with `aria-describedby`.

- [ ] **Step 6: Implement non-blocking feedback**

`MobileFeedback` supports `success | info | error` and `role="status"` except error may use `role="alert"`. It does not create a modal/backdrop.

- [ ] **Step 7: Remove duplicate V8 ordinary sticky back**

`MobileRouterChrome` keeps status, six tabs, guarded play chrome, exit dialog, and route body ownership. Remove the ordinary-route `.v8-route-back` rendering; feature screens will pass router `BACK` into `MobilePageShell.onBack`.

- [ ] **Step 8: Run targeted/full/build**

Run:
- `npx vitest run src/v9-mobile-page-shell.test.tsx src/v8-mobile-router-ui.test.tsx`
- `npm run test`
- `npm run build`
Expected: GREEN; update V8 compatibility test only where its assertion intentionally conflicts with approved V9 behavior.

- [ ] **Step 9: Commit**

Commit message: `feat: add V9 mobile page system`

---

### Task 3: Home and Compact Status Rebuild

**Files:**
- Modify: `src/MobileHomeStatus.tsx`
- Modify: `src/LayeredHome.tsx`
- Modify: `src/Root.tsx`
- Modify: `src/mobile-v9.css`
- Create: `src/v9-mobile-home-status.test.tsx`

**Interfaces:**
- Consumes: `MobileSceneBackground`, `MobileCharacterArt`, `getMobileVisualAsset`, existing `hubNextAction(state)` behavior.
- Produces: a home scene that uses `home.background` and `home.hero` registry slots and a compact status header.

- [ ] **Step 1: Write RED home/status test**

Assert:
- status exposes context row `세대/년차/월/주차` and resource row;
- notification remains a separate ≥44px control;
- home consumes semantic visual slots rather than direct new V9 art paths;
- only one authoritative `lh-primary-action` / `hubNextAction` CTA remains.

- [ ] **Step 2: Run RED**

Run: `npx vitest run src/v9-mobile-home-status.test.tsx`
Expected: FAIL on V9 visual/status contracts.

- [ ] **Step 3: Add compact numeric formatting without changing underlying values**

Provide a presentation helper inside `MobileHomeStatus.tsx` or a focused helper file:

```ts
export function compactResource(value:number):string{
  const safe=Number.isFinite(value)?Math.max(0,value):0;
  if(safe>=1_000_000)return `${(safe/1_000_000).toFixed(safe>=10_000_000?0:1)}M`;
  if(safe>=10_000)return `${(safe/1_000).toFixed(safe>=100_000?0:1)}K`;
  return Math.round(safe).toLocaleString();
}
```

Full value remains accessible via `aria-label`/title where compacted.

- [ ] **Step 4: Recompose home scene**

Use the semantic background/hero primitives. Preserve `hubNextAction` callback semantics. Keep only compact attention/claimable strip if current state has a meaningful claim; do not restore the legacy shortcut wall.

- [ ] **Step 5: Implement 360px and short-height CSS hierarchy**

Decorative hero scales down before status, CTA, dialogue or nav. No horizontal overflow. Preserve safe-area bottom spacing.

- [ ] **Step 6: Run targeted/full/build**

Run:
- `npx vitest run src/v9-mobile-home-status.test.tsx src/hub-next-action.test.ts src/LayeredHome.test.tsx`
- `npm run test`
- `npm run build`
Expected: GREEN.

- [ ] **Step 7: Commit**

Commit message: `feat: rebuild V9 mobile home and status`

---

### Task 4: Recommendation-First Category Dashboards and Scroll Restoration

**Files:**
- Create: `src/mobile-category-guidance.ts`
- Modify: `src/MobileCategoryPage.tsx`
- Modify: `src/Root.tsx`
- Modify: `src/mobile-v9.css`
- Create: `src/v9-mobile-category-dashboard.test.tsx`

**Interfaces:**
- Produces:

```ts
export type MobileCategoryRecommendation={
  feature:MobileFeatureId;
  title:string;
  reason:string;
  badge?:string;
};
export function mobileCategoryRecommendation(state:GameState,category:MobileContentCategory):MobileCategoryRecommendation;
```

- [ ] **Step 1: Write RED pure guidance tests**

Cover deterministic defaults and high-value overrides:
- life: claimable attendance/mail before schedule; otherwise schedule;
- growth: claimable achievement before raising/ambition default;
- adventure: next expedition/world activity without creating a second eligibility engine;
- bond: available gift/relationship opportunity before story default;
- records: archive/recent chronicle default.

Tests assert recommendation is always a valid feature for the category.

- [ ] **Step 2: Run RED**

Run: `npx vitest run src/v9-mobile-category-dashboard.test.tsx`
Expected: FAIL because `mobile-category-guidance.ts` does not exist.

- [ ] **Step 3: Implement guidance using existing authoritative selectors**

Reuse `currentAvailableMail`, `eligibleAchievements`, attendance state, inventory and existing progression selectors. Never duplicate reward eligibility formulas.

- [ ] **Step 4: Rebuild category markup**

`MobileCategoryPage` renders inside `MobilePageShell` with category background slot, **no `onBack`**. Order:
1. recommendation hero action;
2. compact attention/progress area with at most three items;
3. grouped secondary feature entries.

Records place archive access before long chronicle content, with chronicles in expandable/non-blocking sections so archive is reachable without scrolling through everything.

- [ ] **Step 5: Wire route-key scroll restoration**

Use route keys like `category:life`, `category:growth`, etc. Feature back returns via router and restores prior category position.

- [ ] **Step 6: Run targeted/full/build**

Run:
- `npx vitest run src/v9-mobile-category-dashboard.test.tsx src/v8-mobile-category-page.test.tsx src/mobile-router.test.ts`
- `npm run test`
- `npm run build`
Expected: GREEN.

- [ ] **Step 7: Commit**

Commit message: `feat: rebuild V9 category dashboards`

---

### Task 5: Ordinary Feature Page Migration, Disabled Reasons and Feedback

**Files:**
- Modify: `src/MobileLegacyFeaturePage.tsx`
- Modify: `src/Root.tsx`
- Modify: `src/mobile-v9.css`
- Create: `src/v9-mobile-feature-pages.test.tsx`

**Interfaces:**
- Consumes: `MobilePageShell`, `MobilePrimaryAction`, `MobileFeedback`.
- The existing callback props stay unchanged:
  `onClaimAchievement`, `onOuting`, `onGift`, `onAttendance`, `onMail`, `onMonthlyFocus`.

- [ ] **Step 1: Write RED feature-page tests**

Render representative pages and assert:
- exactly one back control;
- claimable action is ≥48px class contract;
- disabled attendance/mail/gift/achievement rows include visible reason text;
- no disabled action silently relies on native disabled styling alone;
- feedback container is present for post-action confirmation.

- [ ] **Step 2: Run RED**

Run: `npx vitest run src/v9-mobile-feature-pages.test.tsx`
Expected: FAIL against legacy flat rows.

- [ ] **Step 3: Split reusable feature row/card within the same file or focused `MobileFeatureActionCard.tsx` if size exceeds a readable unit**

Card contract must accept `disabledReason?:string` and render reason visibly. Do not add new domain eligibility calculations.

- [ ] **Step 4: Wrap ordinary features in `MobilePageShell`**

Use semantic route key `feature:${feature}` and `onBack` from `Root`. Ensure achievements, mission, attendance, mail, inventory, gifts, outing, bond and stories use one page scroll body.

- [ ] **Step 5: Add non-blocking action feedback**

Root or page-local transient state records the last confirmed presentation event such as `출석 보상을 받았어요`, `선물을 전했어요`, `업적 보상을 받았어요`. Do not alter reducer rewards.

- [ ] **Step 6: Run targeted/full/build**

Run:
- `npx vitest run src/v9-mobile-feature-pages.test.tsx src/v8-legacy-feature-routing.test.tsx`
- `npm run test`
- `npm run build`
Expected: GREEN.

- [ ] **Step 7: Commit**

Commit message: `feat: migrate ordinary features to V9 pages`

---

### Task 6: Complex Raising, Ambition, Season, Sanctuary, Expedition, World and Archive Surfaces

**Files:**
- Modify: `src/Root.tsx`
- Modify as required by current controlled interfaces:
  - `src/RaisingIdentityOverlay.tsx`
  - `src/YearlyAmbitionOverlay.tsx`
  - `src/SeasonLiveOpsOverlay.tsx` or current season entry component resolved from `Root.tsx`
  - sanctuary entry component resolved from `Root.tsx`
  - expedition setup component resolved from `Root.tsx`
  - `src/WorldProgressOverlay.tsx`
  - `src/CollectionArchiveOverlay.tsx`
- Modify: `src/mobile-v9.css`
- Create: `src/v9-mobile-complex-pages.test.tsx`

**Interfaces:**
- Preserve each feature’s existing state/action callback props.
- Add only an embeddable/mobile-page framing prop where the existing component cannot be safely rendered without its own fullscreen overlay, using a consistent name `embedded?:boolean` when new props are required.

- [ ] **Step 1: Read each current component from the V9 branch and list whether it already supports externally controlled `open`/`onClose` framing**

The implementation must use the actual exported component names/imports in `Root.tsx`; do not guess renamed season/sanctuary component files.

- [ ] **Step 2: Write RED contracts from actual component names**

Assert V9 Root wraps each routed complex feature in `MobilePageShell`, passes exactly one back handler, and visual slots are selected from the registry. Assert no V9 route creates a second fullscreen backdrop around the page shell.

- [ ] **Step 3: Run RED**

Run: `npx vitest run src/v9-mobile-complex-pages.test.tsx`
Expected: FAIL while legacy overlay framing remains.

- [ ] **Step 4: Add `embedded` framing support only where needed**

When `embedded` is true, omit legacy fixed fullscreen/backdrop/close framing but render the same functional content/callbacks. `embedded` defaults to false to preserve non-V9 compatibility tests.

- [ ] **Step 5: Route each feature through one V9 page boundary**

Visual slot mapping:
- raising → `feature.raising.background`
- season → `feature.season.background`
- sanctuary → `feature.sanctuary.background`
- world → `feature.world.background`
- archive → `feature.archive.background`
- ambition/expedition may use category fallback unless a dedicated slot is added to the registry in Task 1 test and registry together.

- [ ] **Step 6: Run feature-specific existing suites plus V9 test**

Run `npx vitest run src/v9-mobile-complex-pages.test.tsx` plus the existing UI tests discovered for each modified complex component, then `npm run test` and `npm run build`.
Expected: GREEN.

- [ ] **Step 7: Commit**

Commit message: `feat: migrate complex features to V9 mobile pages`

---

### Task 7: Training and Choice Event Mobile Active-Play UX

**Files:**
- Modify: `src/Root.tsx`
- Modify: `src/App.tsx` only if a presentation hook is required; do not change reducer semantics.
- Modify current training/dialogue/result presentation CSS/components discovered from `App.tsx`.
- Modify: `src/mobile-v9.css`
- Create: `src/v9-mobile-active-play.test.tsx`

**Interfaces:**
- V8 route kinds/screens remain authoritative.
- Active training and unresolved dialogue/choice feed `guarded=true` into `MobileRouterChrome`.
- Result route feeds `guarded=false` and restores bottom nav.

- [ ] **Step 1: Write RED flow contracts**

Assert source/render contracts for:
- schedule ordinary nav visible;
- training guarded;
- unresolved choice/dialogue guarded;
- result ordinary nav visible;
- confirmed exit calls existing `navigate?.('hub')`/router exit path rather than mutating progression state directly.

- [ ] **Step 2: Run RED**

Run: `npx vitest run src/v9-mobile-active-play.test.tsx src/App.test.tsx`
Expected: FAIL on new V9 presentation/guard contracts only.

- [ ] **Step 3: Make gameplay content occupy the free viewport**

Status/nav space is removed only for guarded play. Ensure story/choice buttons remain inside the single reachable gameplay scroll area and are not behind safe-area controls.

- [ ] **Step 4: Style result as ordinary V9 completion surface**

Result shows one clear completion/continue CTA and ordinary six-tab nav. Training result primary completion routes home per spec.

- [ ] **Step 5: Run targeted/full/build**

Run:
- `npx vitest run src/v9-mobile-active-play.test.tsx src/App.test.tsx src/mobile-router.test.ts`
- `npm run test`
- `npm run build`
Expected: GREEN.

- [ ] **Step 6: Commit**

Commit message: `feat: polish V9 active training and choice flows`

---

### Task 8: Tactical Mobile Layout and Replaceable Battle/Companion Art

**Files:**
- Modify: `src/TacticalBattleScreen.tsx`
- Modify: `src/TacticalExpeditionFlow.tsx`
- Modify: `src/tactical-battle.css`
- Modify: `src/mobile-v9.css` only for global shell interaction
- Create: `src/v9-tactical-mobile.test.tsx`

**Interfaces:**
- Consumes: visual registry slots and `MobileSceneBackground`/`MobileCharacterArt`.
- Existing battle inputs/actions stay unchanged: `BattleSession`, `resolveTacticalAction`, `resolveCombinationUltimate`, AUTO selection and `onComplete` contracts.

- [ ] **Step 1: Write RED Tactical presentation tests**

Assert source/rendered markup contains:
- semantic battle background renderer;
- companion art slot lookup from companion id;
- explicit targetable/down state labels;
- top HUD separated from field;
- card hand remains a dedicated bottom interaction region;
- result consumes victory/defeat semantic visual slots;
- no engine/action function signature changes.

- [ ] **Step 2: Run RED**

Run: `npx vitest run src/v9-tactical-mobile.test.tsx src/TacticalBattleScreen.test.tsx`
Expected: FAIL on visual/layout contracts.

- [ ] **Step 3: Add battle scene visual selection**

Map encounter/stage context in `TacticalExpeditionFlow` to `battle.default/forest/ruins/rift.background`; pass the semantic slot to `TacticalBattleScreen` via a new optional presentation-only prop:

```ts
sceneSlot?:MobileVisualSlot;
```

Default to `battle.default.background`.

- [ ] **Step 4: Add companion visual hooks without changing unit identity**

Use party companion ids to select `companion.${id}.battle`/portrait entries. If art is absent, renderer fallback occupies the same layout area.

- [ ] **Step 5: Recompose Tactical CSS for 360×640**

Priority from top to bottom:
1. compact round/AUTO/speed HUD;
2. battlefield with clear targets and health/status;
3. concise live log;
4. ultimates when available;
5. reachable hand/cards above safe area.

At short height, reduce decorative art/spacing before card height or text. Result controls remain visible without nested scroll traps.

- [ ] **Step 6: Keep guarded route behavior intact**

Active phase remains guarded; result phase emits `result` before callbacks and restores ordinary V9 navigation.

- [ ] **Step 7: Run Tactical/full/build gates**

Run:
- `npx vitest run src/v9-tactical-mobile.test.tsx src/TacticalBattleScreen.test.tsx src/tactical-ui.test.ts src/tactical-mobile-contract.test.ts src/tactical-stability.test.ts`
- `npm run test`
- `npm run build`
Expected: GREEN.

- [ ] **Step 8: Commit**

Commit message: `feat: rebuild V9 Tactical mobile presentation`

---

### Task 9: Responsive, Accessibility and Full UX Regression Gate

**Files:**
- Modify: `src/mobile-v9.css`
- Modify: relevant V9 components from Tasks 1–8 for defects found by tests.
- Create: `src/v9-mobile-responsive-contract.test.ts`

**Interfaces:**
- No new domain interfaces.

- [ ] **Step 1: Write responsive/accessibility contract tests**

Read CSS/source and assert explicit contracts for:
- `100dvh`;
- safe-area top/bottom;
- 360/390/430 breakpoints;
- short-height query;
- 44px touch minimum;
- 52px+ primary CTA;
- `overflow-x:hidden` or equivalent no-horizontal-overflow boundary;
- one page-level `overflow-y:auto` implementation in V9 shell/page architecture;
- `prefers-reduced-motion:reduce`;
- `:focus-visible`;
- image contrast overlay classes.

- [ ] **Step 2: Run RED then fix only missing contracts**

Run: `npx vitest run src/v9-mobile-responsive-contract.test.ts`
Expected: initial FAIL for any uncovered V9 contract; implement exact CSS/accessibility fixes until GREEN.

- [ ] **Step 3: Run all V9 targeted tests together**

Run:
`npx vitest run src/v9-mobile-visual-assets.test.tsx src/v9-mobile-page-shell.test.tsx src/v9-mobile-home-status.test.tsx src/v9-mobile-category-dashboard.test.tsx src/v9-mobile-feature-pages.test.tsx src/v9-mobile-complex-pages.test.tsx src/v9-mobile-active-play.test.tsx src/v9-tactical-mobile.test.tsx src/v9-mobile-responsive-contract.test.ts`
Expected: all GREEN.

- [ ] **Step 4: Run complete repository verification**

Run:
- `npm ci`
- `npm audit --json`
- `npm run test`
- `npm run build`
Expected: audit total 0, all tests GREEN, TypeScript and Vite production build GREEN.

- [ ] **Step 5: Review PR diff for gameplay/save isolation**

Confirm no save-schema version changes, no reward/economy constants changed, no Tactical engine calculation changes, and visual asset paths are centralized.

- [ ] **Step 6: Commit final polish**

Commit message: `test: lock V9 mobile usability contracts`

---

### Task 10: Source Review, Integration, Main and Production Verification

**Files:**
- No expected product code changes unless verification exposes a defect.
- Update tracking issue/PR descriptions with evidence.

**Interfaces:**
- Source PR: `work/v9-full-mobile-ux → integration/v3`.
- Release PR: `integration/v3 → main`.

- [ ] **Step 1: Ensure V9 source PR has exact latest head and no unresolved review threads**

Record exact head SHA and CI run number. Do not merge if head moved after validation.

- [ ] **Step 2: Merge source PR with expected-head guard**

Expected: merge succeeds only for the validated source SHA.

- [ ] **Step 3: Verify new `integration/v3` exact commit/tree and create release PR to main**

Wait for release synthetic merge CI and require full GREEN.

- [ ] **Step 4: Merge release PR with expected-head guard**

Record exact main merge SHA.

- [ ] **Step 5: Verify main push CI**

Require test/build/audit evidence from the exact main commit.

- [ ] **Step 6: Verify Vercel exact-SHA production state**

If deployment quota permits, require READY deployment for exact main SHA, HTTP success at canonical root and `/api/client-telemetry`, and no deployment-specific fatal/error evidence in the verification window.

If Vercel reports `api-deployments-free-per-day` or another external quota blocker, record the exact blocker and stop short of claiming production completion. Do not repeatedly trigger deployments merely to exhaust quota further.

- [ ] **Step 7: Close tracking #201 only when the applicable release gates are truthful**

If main is GREEN but production deployment is externally blocked, leave #201 open with a blocker comment rather than labeling the release production-complete.
