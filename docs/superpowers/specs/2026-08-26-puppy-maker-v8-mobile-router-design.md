# V8 Mobile Router — Full-screen Navigation & Usability Rewrite

## Status
Approved direction: **C — full mobile router rewrite**.

## Baseline
- `integration/v3@43706e6c25b04786e9aaf4acccfedccb51735867`
- `main@6da538c208d23a40d7a7475854afdbf3c18802ec`
- shared tree: `29ad5ef6b2af615f651badc9e7292956e5e2937b`

## Goal
Replace the V7 overlay-heavy navigation model with one predictable mobile router so status, menus, scrolling, back/home behavior, feature completion, gameplay exit, and result return paths are consistent on 360×640, 390×844, and 430px-class devices.

V8 changes presentation/navigation only. It must not change save, progression, combat, season, lineage, world, NG+, True/Hollow, reward, weekly-determinism, or inheritance semantics.

## Why V8 is a router rewrite
V7 reduced home clutter, but navigation authority is still split across:
- `LayeredHomeV7` category state,
- `LayeredHome` legacy panels,
- `Root` feature overlays,
- `App` reducer-driven play screens.

This creates inconsistent stacking and return behavior. V8 replaces those presentation-level authorities with one mobile navigation model while leaving reducers authoritative for gameplay state.

## Design principles
1. **One navigation authority.** Normal mobile navigation is owned by one router state.
2. **One visible page layer.** Normal navigation uses pages, not stacked full-screen sheets.
3. **Predictable back.** Back returns one semantic level.
4. **Predictable finish.** Ordinary feature completion returns to the origin category. Complete play cycles return to home unless the flow explicitly returns to its category.
5. **Persistent navigation for browsing.** The six main categories remain visible on home, category, ordinary feature, and completed-result pages.
6. **Guarded navigation during active play.** While an unfinished training, Tactical battle, minigame, or choice event can be lost, hide the six-category bar and show only persistent `뒤로` and `홈`. Either exit action requires confirmation before discarding the attempt.
7. **Content scrolls; controls stay reachable.** Only the route body scrolls.
8. **No gameplay semantics in the router.** Navigation state is ephemeral UI state only.
9. **Mobile first.** 360×640, 390×844, and 430px-class devices are first-class contracts.

## Route model

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

export type MobilePlayScreen =
  | 'schedule'
  | 'training'
  | 'dialogue'
  | 'result'
  | 'tactical'
  | 'choice_event';

export type MobileRoute =
  | {kind:'home'}
  | {kind:'category'; category:Exclude<MobileCategoryId,'home'>}
  | {kind:'feature'; category:Exclude<MobileCategoryId,'home'>; feature:MobileFeatureId}
  | {kind:'play'; category:MobileCategoryId; screen:MobilePlayScreen; activeAttempt:boolean};

export type MobileNavigationState = {
  current: MobileRoute;
  stack: MobileRoute[];
};
```

The feature list may expand only to map an already-existing game feature. V8 does not add new gameplay systems.

## Navigation operations

```ts
openCategory(category)
openFeature(category, feature)
openPlay(category, screen, activeAttempt)
replace(route)
back()
home()
finishFeature()
finishPlayCycle(destination?)
```

Exact rules:
- initial state: `current={kind:'home'}`, `stack=[]`.
- home → category: current category, history normalized to `[home]`.
- category → feature: current feature, history normalized to `[home, category]`.
- switching bottom categories from home/category/ordinary feature/result replaces the category branch instead of creating a long category history.
- tapping the already-active category is a no-op.
- feature `back()` / `finishFeature()` returns to its origin category.
- category `back()` returns home.
- `home()` clears navigation history and returns home.
- malformed or impossible route/history combinations normalize to home.
- active-play `back()` or `home()` never silently exits; it opens the guarded-exit confirmation.

## Six-category bottom navigation
The categories remain:
- 홈
- 생활
- 성장
- 모험
- 인연
- 기록

### Visible during normal use
The six-button bar is persistent on:
- home,
- category pages,
- ordinary feature pages,
- completed/result pages where no unfinished attempt can be lost.

It remains reachable while content scrolls. Switching category is one tap and never requires closing the current ordinary feature first.

### Hidden only during an unfinished active attempt
The six-button bar is hidden only while leaving could discard unfinished interaction state, specifically:
- **훈련 진행 중**,
- **Tactical 전투 진행 중**,
- **진행 중인 선택 이벤트**,
- active minigames or equivalent reducer-driven attempts with the same discard risk.

In that mode the UI shows only persistent:
- `뒤로`
- `홈`

Both controls are at least 44×44px. Pressing either opens the same explicit confirmation before discarding the unfinished attempt.

Recommended confirmation:
- title: `진행 중인 플레이를 종료할까요?`
- body: `지금 나가면 현재 진행 내용이 완료되지 않습니다.`
- secondary action: `계속하기`
- destructive/exit action: `종료하고 이동`

For `뒤로`, confirmation returns to the semantic parent after approval. For `홈`, confirmation clears transient navigation and goes home after approval.

No confirmation is shown for ordinary browsing, reward claims, story/archive reading, completed result screens, or other states where nothing unfinished would be lost.

## Mobile shell layout

```text
safe area
┌─────────────────────────┐
│ compact status/header   │  persistent
├─────────────────────────┤
│ page header (if needed) │  persistent
├─────────────────────────┤
│                         │
│ scrollable route body   │  min-height:0; overflow-y:auto
│                         │
├─────────────────────────┤
│ 6-category nav OR       │
│ guarded Back + Home     │  persistent
└─────────────────────────┘
```

Structural requirements:
- use `100dvh` where supported,
- route body uses `min-height:0` and `overflow-y:auto`,
- body/root is not the feature scroll container,
- `overscroll-behavior:contain`,
- safe-area padding top/bottom,
- no page requires scrolling to the top to escape,
- fixed controls never cover the final actionable row.

## Status header redesign
Use a stable compact status component on normal routed pages.

### Row 1
- generation,
- year,
- month/week,
- notification affordance.

### Row 2
- gold,
- gems,
- stamina,
- guardian summary.

Requirements:
- about 56–64px excluding safe area,
- critical values never below 13px,
- primary text 15–16px minimum on 360px devices,
- preserve date/time context before decorative labels when truncating,
- notification touch target minimum 44px.

During active gameplay, the status header may collapse to only gameplay-relevant information if that improves usable space, but guarded `뒤로` and `홈` stay persistent.

## Page header
Category and feature pages use the same header language:
- back when a parent route exists,
- page title,
- optional compact subtitle/context,
- Home affordance on deep routes where useful.

For normal browsing, the six-category bar remains at the bottom even when Back/Home is also present at the top.

## Category pages
V7 content becomes full pages rather than bottom sheets.

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

Category cards retain the V7 icon language but use consistent 48px-preferred touch targets and visible pressed feedback.

## Feature adaptation
Do not rewrite game domain logic.

### Legacy `LayeredHome` panels
Achievement, bond, inventory, outing, mission, event, attendance, and mail content must become route-renderable pages or a shared adapter. They may no longer own a backdrop that always returns directly to home.

### Root overlays
Season, sanctuary, raising, expedition, world progress, archive, and ambition must accept router-controlled page mode. Existing callbacks and reducer semantics remain unchanged.

Independent launcher/open-state authority is removed once each feature is router-controlled.

## Gameplay flows
### Schedule / training
`생활 → schedule → training → dialogue/result`

Rules:
- entering schedule records `life` as origin.
- before training starts, six-category navigation is still available because no active attempt is being lost.
- Back from schedule returns to 생활.
- starting training sets `activeAttempt=true`, hides the six-category bar, and shows only guarded `뒤로 + 홈`.
- guarded exit confirms before discarding the attempt.
- once the attempt reaches a completed result state, `activeAttempt=false`; six-category navigation returns.
- completing the full training/result cycle through its normal completion action returns to **home**.

### Expedition / Tactical
`모험 → expedition → tactical/result`

Rules:
- expedition browsing/preparation keeps six-category navigation visible.
- closing before battle starts returns to 모험.
- entering an active Tactical battle sets `activeAttempt=true`, hides the six-category bar, and shows guarded `뒤로 + 홈` only.
- battle result after resolution is not considered an active attempt; the six-category bar returns.
- normal expedition completion/abort returns to 모험 unless the reducer explicitly ends a global play cycle whose intended destination is home.

### Choice event
For any choice event where the player must choose before the interaction is complete:
- entering the unresolved choice state sets `activeAttempt=true`,
- hide the six-category bar,
- show guarded `뒤로 + 홈` only,
- either exit requires confirmation,
- making the choice resolves the active attempt,
- after resolution, restore the ordinary navigation appropriate to the destination screen.

## Feature completion return rules
- 성장 → 성장 업적 → reward claim → back = 성장
- 생활 → 출석 → claim → back = 생활
- 생활 → 우편 → claim → back = 생활
- 성장 → 야망 → select → back = 성장
- 성장 → 시즌/성소 → action → back = 성장
- 모험 → 월드 → back = 모험
- 기록 → 도감 → back = 기록
- 인연 → 선물/이야기 → back = 인연

Ordinary feature actions never implicitly reset to home. Users may tap the persistent Home/category navigation whenever no active attempt is in progress.

## Scroll and viewport contracts
Every route must satisfy:
- 360×640,
- 390×844,
- 430px-class width,
- top/bottom safe areas,
- keyboard/focus-visible behavior,
- reduced motion.

Long-content rules:
- only the route body is the primary page scroll container,
- headers and bottom controls remain reachable,
- bottom padding accounts for persistent navigation + safe area,
- sticky/fixed CTA never covers last content,
- nested full-page scroll containers are prohibited,
- true modal confirmation uses a bounded accessible dialog.

## Touch feedback
All main navigation and feature controls:
- 44px minimum touch target, 48px preferred,
- pressed state via transform/brightness/background, not color alone,
- active nav combines color + background/fill + typography,
- disabled controls are visibly distinct and inert.

## Typography
Retain V7 tokens and enforce them across V8:
- metadata captions: 12–13px,
- secondary body: 14px minimum,
- primary body/button: 15–16px minimum,
- section title: 17–18px,
- page title: 21–24px,
- no critical actionable text at 8–11px.

## Accessibility and focus
- route change moves focus to the new heading or first meaningful control,
- Back returns focus to the opening control when practical,
- Escape maps to back on ordinary features,
- Escape during an active attempt opens guarded-exit confirmation rather than silently exiting,
- meaningful heading hierarchy and aria labels,
- decorative icons remain aria-hidden.

## Error and safety behavior
- malformed transient route data falls back to home,
- navigation state is not persisted in save data,
- missing optional callbacks produce disabled/unavailable entries rather than throw,
- feature callbacks run before navigation return,
- repeated category taps do not duplicate history,
- only unfinished active attempts require exit confirmation.

## Save and gameplay compatibility
V8 adds no persistent gameplay fields and must not change:
- save schema meaning,
- raw stats/gold/gems inheritance,
- NG+ semantics,
- lineage semantics,
- True/Hollow activation,
- weekly deterministic events,
- combat rewards or progression.

## Migration sequence
1. Pure mobile-router domain + tests.
2. V8 full-height shell, status header, route body, six-category nav, guarded play controls.
3. Convert V7 category sheets to full pages.
4. Convert legacy LayeredHome panels to routed feature pages.
5. Convert Root overlays to router-controlled page mode.
6. Integrate schedule/training/result active-attempt rules.
7. Integrate expedition/Tactical active-attempt rules.
8. Integrate unresolved choice-event active-attempt rules.
9. Remove V7 sheet/backdrop and obsolete independent launcher/open-state authorities.
10. Run full mobile and project regression.

## Testing strategy
### Router unit tests
Lock:
- normalized home/category/feature histories,
- category switches do not accumulate stack,
- feature back returns origin category,
- finishFeature returns origin category,
- normal finishPlayCycle destination,
- malformed route fallback,
- activeAttempt exit requires guard.

### Interaction tests
Lock:
- six bottom categories reachable from home/category/ordinary feature/result,
- category switch from an open ordinary feature works in one tap,
- achievements back → growth,
- mail back → life,
- archive back → records,
- expedition pre-start close → adventure,
- active training hides six-category nav,
- active Tactical hides six-category nav,
- unresolved choice event hides six-category nav,
- active play shows only Back/Home exit controls,
- Back/Home during active play opens confirmation,
- cancel confirmation resumes the same play state,
- confirm Back exits to semantic parent,
- confirm Home exits home,
- resolved choice/completed result restores six-category nav,
- normal completed training cycle returns home.

### Mobile CSS/source contracts
Lock:
- `100dvh`,
- `min-height:0`,
- route-body `overflow-y:auto`,
- `overscroll-behavior:contain`,
- safe-area padding,
- 44/48px touch targets,
- 360/390/430 rules,
- no legacy full-screen backdrop can cover persistent normal navigation.

### Release regression
- targeted V8 suites,
- full existing suite (baseline 460 files / 1793 tests),
- TypeScript,
- production build,
- dependency audit,
- integration PR synthetic merge CI,
- main exact-SHA CI,
- production exact-SHA Vercel READY,
- production root/API smoke,
- production runtime error/fatal log check.

## Non-goals
- redesigning game art,
- changing game economy or progression,
- adding desktop-only navigation,
- replacing React or the reducer architecture,
- persisting navigation/history in save data.

## Completion gate
V8 is complete only when:
1. one mobile router owns normal navigation,
2. home/category/feature/play/result paths match this spec,
3. active training/Tactical/choice events use guarded Back/Home only,
4. 360/390/430 usability contracts pass,
5. no legacy overlay can trap the user or force an incorrect home return,
6. full regression/build/audit are GREEN,
7. integration/main promotion is complete without force push,
8. production exact-SHA deployment and runtime smoke are GREEN.
