# V8 Mobile Router — Full-screen Navigation & Usability Rewrite

## Status
Approved direction: **C — full mobile router rewrite**.

## Baseline
- `integration/v3@43706e6c25b04786e9aaf4acccfedccb51735867`
- `main@6da538c208d23a40d7a7475854afdbf3c18802ec`
- shared tree: `29ad5ef6b2af615f651badc9e7292956e5e2937b`

## Goal
Replace the V7 overlay-heavy mobile navigation model with one predictable, mobile-first navigation authority that keeps status, back behavior, scrolling, touch controls, gameplay exits, and category return paths consistent across the app.

The rewrite must improve usability without changing save, progression, combat, season, lineage, world, NG+, True/Hollow, or reward semantics.

## Why a router rewrite is necessary
V7 reduced home clutter, but navigation remains split across several authorities:
- `LayeredHomeV7` owns category state.
- `LayeredHome` owns legacy home panels.
- `Root` owns season/sanctuary/raising/expedition/world/archive/ambition overlays.
- `App` owns gameplay screens such as schedule/training/dialogue/result.

This produces inconsistent return paths and stacking rules. A category sheet can obscure the bottom navigation, legacy panels close directly to home, and full-screen feature overlays have independent open/close state. The user should not have to understand which implementation layer a feature belongs to.

## Design principles
1. **One navigation authority.** Mobile navigation state lives in a single router model.
2. **One visible page layer.** Normal navigation uses pages, not stacked full-screen overlays.
3. **Predictable back.** Back means one semantic step backward.
4. **Predictable finish.** Feature completion returns to the origin category; complete play cycles return to home unless the flow explicitly continues.
5. **Persistent controls.** The user must always retain a visible path back or home.
6. **Content scrolls, controls stay reachable.** Page header and bottom navigation stay stable; only the content region scrolls.
7. **No gameplay semantics in the router.** The router controls presentation/history only; reducers remain authoritative for game state.
8. **Mobile first.** 360×640, 390×844, and 430px-class devices are first-class contracts.

## Route model
Create a dedicated mobile router domain.

```ts
export type MobileCategoryId =
  | 'home'
  | 'life'
  | 'growth'
  | 'adventure'
  | 'bond'
  | 'records';

export type MobileFeatureId =
  | 'schedule'
  | 'mission'
  | 'attendance'
  | 'mail'
  | 'raising'
  | 'ambition'
  | 'achievements'
  | 'inventory'
  | 'season'
  | 'sanctuary'
  | 'outing'
  | 'expedition'
  | 'world'
  | 'bond'
  | 'gifts'
  | 'stories'
  | 'archive'
  | 'lineage'
  | 'world_chronicle';

export type MobileRoute =
  | {kind:'home'}
  | {kind:'category'; category:Exclude<MobileCategoryId,'home'>}
  | {kind:'feature'; category:Exclude<MobileCategoryId,'home'>; feature:MobileFeatureId}
  | {kind:'play'; category:MobileCategoryId; screen:'schedule'|'training'|'dialogue'|'result'};

export type MobileNavigationState = {
  current: MobileRoute;
  stack: MobileRoute[];
};
```

The exact feature list may only be expanded when an already-existing V7 feature is mapped. V8 does not create unrelated gameplay systems.

## Navigation operations
The router exposes a small interface:

```ts
openCategory(category)
openFeature(category, feature)
openPlay(category, screen)
replace(route)
back()
home()
finishFeature()
finishPlayCycle()
```

Rules:
- `openCategory`: category becomes current route and is pushed from home or another category.
- `openFeature`: remembers the origin category.
- `back`: returns to the previous semantic route, never an implementation overlay.
- `finishFeature`: returns to the feature's origin category.
- `finishPlayCycle`: returns to home and clears transient play history.
- `home`: clears stack and returns to `{kind:'home'}`.
- repeated selection of the active bottom-nav category does not duplicate history.
- switching bottom-nav categories replaces the current category/feature route rather than building a long category stack.

## Bottom navigation behavior
The six V7 categories remain:
- 홈
- 생활
- 성장
- 모험
- 인연
- 기록

The bottom navigation is visible on home and category pages and remains reachable while category content scrolls.

Feature pages may either keep the bottom bar visible or use a compact home/back footer when screen real estate is constrained; whichever option is used must be consistent per page class and must not allow hidden navigation traps.

Bottom category switching must work in one tap even while another category is open.

## Mobile shell layout
Replace the V7 backdrop/sheet composition with a full-height shell:

```text
safe area
┌─────────────────────────┐
│ compact status/header   │  sticky/fixed within shell
├─────────────────────────┤
│                         │
│ scrollable page body    │  overflow-y:auto; min-height:0
│                         │
├─────────────────────────┤
│ bottom navigation       │  persistent, safe-area aware
└─────────────────────────┘
```

Structural requirements:
- shell uses `100dvh` when supported.
- content region uses `min-height:0` and `overflow-y:auto`.
- body/root must not become the feature scroll container.
- `overscroll-behavior:contain` prevents accidental background scrolling.
- header and navigation never disappear below long content.
- no page requires scrolling back to the top just to close it.

## Status header redesign
The status window becomes a stable compact component shared by home/category/feature pages.

### Row 1
- generation
- year
- month/week
- notification affordance

### Row 2
- gold
- gems
- stamina
- guardian points/rank summary

Requirements:
- target height about 56–64px excluding safe area.
- no important value below 13px.
- primary text 15–16px minimum on 360px-class devices.
- overflow truncation must preserve the date/time context before decorative labels.
- notification button minimum touch target 44px.

## Page header
Category and feature pages use a consistent page header:
- back button when there is a parent route.
- page title.
- optional compact context/subtitle.
- optional home button for deep feature/play routes.

Back and home controls must be at least 44×44px.

## Category pages
V7 category content is retained but rendered as full pages rather than bottom sheets.

### 생활
- Weekly Planner
- schedule
- monthly mission
- attendance
- mail

### 성장
- raising identity
- yearly ambition
- achievements
- inventory/abilities
- season
- sanctuary

### 모험
- outing
- expedition/tactical
- world progress
- generational public project summary

### 인연
- bond
- gifts
- stories/events

### 기록
- lineage
- world chronicle
- archive
- discovery/collection summary

Category entry cards keep the V7 icon language but receive clearer pressed/active feedback and uniform minimum height.

## Feature adaptation strategy
Do not rewrite game domain logic. Adapt presentation incrementally behind the router.

### Legacy `LayeredHome` panels
Quest/achievement, bond, bag/inventory, outing, mission, event, attendance, and mail content must be extracted into route-renderable feature components or a shared `MobileLegacyFeaturePage` adapter. They may no longer own a backdrop that returns directly to home.

### Root overlays
Season, sanctuary, raising, expedition, world progress, archive, and ambition must accept router-controlled page mode. Their existing callback semantics remain unchanged.

During migration, an adapter may render existing inner content inside the V8 page body. The old home launcher and independent open-state authority must be removed once that feature is router-controlled.

## Gameplay routes
`App` remains authoritative for reducer-driven gameplay state, but navigation presentation must integrate with the V8 router.

### Schedule flow
`생활 → schedule → training → dialogue/result`

Rules:
- entering schedule records `life` as the origin category.
- normal back from schedule before starting returns to 생활.
- starting training enters play mode.
- while a training attempt is active, accidental category switching is disabled or guarded; there must always be an explicit exit control.
- completing the full training/result cycle returns to **home**.

### Expedition/Tactical flow
`모험 → expedition → tactical/result`

Rules:
- closing before starting returns to 모험.
- completing/aborting the active expedition flow exits to 모험 unless the game reducer explicitly ends a global play cycle that should return home.
- tactical result screen must expose a visible exit control.

## Feature-completion return rules
Feature completion must preserve spatial memory:

- 성장 → 성장 업적 → reward claim → close/back = 성장
- 생활 → 출석 → claim → close/back = 생활
- 생활 → 우편 → claim → close/back = 생활
- 성장 → 야망 → select → close/back = 성장
- 성장 → 시즌/성소 → action → close/back = 성장
- 모험 → 월드 → close/back = 모험
- 기록 → 도감 → close/back = 기록
- 인연 → 선물/이야기 → close/back = 인연

No feature action may implicitly reset the route to home unless it represents a complete play cycle or the user taps Home.

## Scroll and viewport contracts
Every route must satisfy:
- 360×640
- 390×844
- 430px-class width
- safe-area top and bottom
- keyboard/focus-visible controls
- reduced-motion

For long content:
- scrollable body has bottom padding at least `bottomNavHeight + safeArea + 16px` when bottom nav overlays content.
- sticky page header remains visible.
- no fixed CTA can cover the last actionable row.
- nested full-page scroll containers are prohibited.
- dialogs used for truly modal confirmation must have their own bounded scroll area and accessible close button.

## Touch feedback
All main navigation and feature-entry controls:
- minimum 44px touch target; preferred 48px.
- visible pressed state using transform/brightness/background, not color alone.
- active navigation state combines color + fill/background + typography.
- disabled state is visually distinct and cannot receive accidental click handlers.

## Typography
Retain V7 token system, but enforce it across routed pages:
- captions: 12–13px only for non-critical metadata.
- secondary body: 14px minimum.
- primary body/button: 15–16px minimum.
- section title: 17–18px.
- page title: 21–24px.
- no critical actionable text at 8–11px.

## Accessibility and focus
- changing routes moves focus to the new page heading or first meaningful control.
- `back()` returns focus to the entry that opened the child route when practical.
- Escape maps to `back()` for feature routes on hardware keyboards.
- route pages expose meaningful `aria-label`/heading hierarchy.
- decorative icons remain `aria-hidden`.

## Error and safety behavior
- unknown/malformed transient route data falls back to home; navigation state is not persisted in the save schema.
- missing optional callbacks render disabled/unavailable entries rather than throwing.
- feature completion callbacks run before navigation return so game-state mutations are not lost.
- rapid repeated category taps cannot duplicate stack entries.

## Data and save compatibility
V8 adds no persistent gameplay fields.

Do not change:
- save schema meaning
- raw stats/gold/gems inheritance rules
- NG+ semantics
- lineage semantics
- True/Hollow activation rules
- weekly deterministic event semantics
- combat rewards or progression

Navigation state is ephemeral UI state only.

## Migration sequence
1. Add pure mobile router domain and tests.
2. Add V8 shell, page header, persistent nav, and scrolling contract.
3. Move V7 categories from sheet routes to page routes.
4. Adapt legacy home features.
5. Adapt Root overlays into router-controlled pages.
6. Integrate schedule/training/result return rules.
7. Integrate expedition/tactical return rules.
8. Remove V7 sheet/backdrop and independent launcher state that is no longer authoritative.
9. Run mobile usability regression and full project regression.

## Testing strategy
### Pure router tests
Lock:
- category switching does not duplicate stack.
- feature back returns to origin category.
- `finishFeature()` returns to origin category.
- `finishPlayCycle()` returns home and clears transient stack.
- malformed route fallback.

### Render/interaction tests
Lock:
- six bottom-nav categories remain reachable from category pages.
- long category content scrolls while header/nav remain structurally persistent.
- back from achievements returns to growth.
- close from mail returns to life.
- archive returns to records.
- expedition pre-start close returns to adventure.
- training result completion returns home.
- no feature backdrop covers the navigation unexpectedly.

### Mobile CSS/source contracts
Lock:
- `100dvh` shell.
- `min-height:0` scroll region.
- `overflow-y:auto` only on routed content container for page scrolling.
- safe-area paddings.
- 44/48px control minimums.
- 360/390/430 media rules.

### Release regression
- targeted V8 suites
- full existing suite (baseline 460 files / 1793 tests)
- TypeScript
- production build
- dependency audit
- integration PR synthetic merge CI
- main exact-SHA CI
- production exact-SHA Vercel READY
- production root/API smoke
- production runtime error/fatal log check

## Non-goals
- redesigning game art.
- changing game economy or progression.
- adding desktop-only navigation.
- replacing React or the current reducer architecture.
- creating a second saved navigation/history model.

## Completion gate
V8 is complete only when:
1. one mobile router owns normal navigation,
2. home/category/feature/play/result return paths match this spec,
3. 360/390/430 usability contracts pass,
4. no legacy overlay can trap the user or force an incorrect home return,
5. full regression/build/audit are GREEN,
6. integration/main promotion is complete without force push,
7. production exact-SHA deployment and runtime smoke are GREEN.
