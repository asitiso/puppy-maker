# Puppy Maker V9 Full Mobile UX Rebuild — Design

**Date:** 2026-08-26  
**Tracking:** #201  
**Baseline:** `integration/v3@970691886d776d8131374ce0f5a4ad81653a63e8`  
**Direction:** Approved C-direction — major mobile UX rebuild, preserving game/save/progression semantics.

## 1. Goal

V9 makes Puppy Maker feel like a coherent mobile game rather than a collection of independently evolved panels. A player using a 360–430px phone should always understand:

1. where they are,
2. what matters now,
3. what they can tap,
4. why an action is unavailable,
5. how to go back or home,
6. what happens after completion,
7. and where they returned after finishing an activity.

The game engine, progression rules, economy, persistence schema, campaign outcomes, NG+, Fifth/Hollow paths, and Tactical calculations remain authoritative. V9 replaces or reorganizes presentation and interaction surfaces where the current mobile experience is cramped, inconsistent, nested, or difficult to control.

## 2. Non-goals

V9 does not:

- redesign battle mathematics, AI, rewards, or progression;
- change save-schema semantics merely to support layout;
- create new campaign content;
- add a second navigation authority beside the V8 router;
- hardcode final production art directly into individual feature components;
- require artwork to exist for a screen to remain usable;
- convert every historical desktop component if it is not exposed in the current mobile route.

## 3. UX Principles

### 3.1 One screen, one primary decision

Every top-level or feature page has one visually dominant decision. Secondary actions remain reachable but do not compete at equal weight.

### 3.2 Predictable chrome

Ordinary screens use the same structural order:

`compact status → page header/context → one scroll body → optional sticky primary CTA → persistent six-tab nav`

The six tabs remain:

`홈 / 생활 / 성장 / 모험 / 인연 / 기록`

Back ownership is intentionally singular in V9:

- category dashboards do **not** show a separate sticky back button; the persistent six-tab nav, especially `홈`, is the global escape path;
- feature pages show exactly one contextual back control inside the `MobilePageShell` header and return to their originating category;
- `MobileRouterChrome` no longer renders the V8 ordinary-route sticky `이전` button on V9 surfaces;
- guarded active-play screens use only the global guarded `뒤로 + 홈` chrome and never add a second page-level back control.

### 3.3 Guarded active play

During only these loss-sensitive states:

- active training,
- active Tactical battle,
- unresolved choice event,

the six-tab navigation is hidden. The player sees only `뒤로` and `홈`, and either action requires an explicit exit confirmation. The confirmation must distinguish `계속하기` from `종료하고 이동`.

Setup and result screens are not guarded unless leaving would lose an unresolved decision.

### 3.4 One primary scroll container

A normal V9 page has one main vertical scroll body. Sticky/fixed chrome must not create nested page-level scroll traps. Embedded sublists may scroll only when they have an explicit bounded purpose and accessible size.

### 3.5 Thumb-first controls

- absolute minimum target: 44×44px;
- normal buttons: at least 48px tall;
- primary CTA: 52–56px tall;
- no critical action represented by a tiny icon-only hit target;
- bottom actions stay clear of `env(safe-area-inset-bottom)`.

### 3.6 Readable hierarchy

Target typography:

- page title: 22–24px;
- section title: 18–20px;
- card/action title: 15–17px;
- normal body: 15px;
- supporting body: 14px;
- 12–13px only for truly secondary metadata, never essential instructions.

Long Korean text must wrap naturally. Important labels may not rely on truncation alone.

## 4. Navigation and Return Rules

V8 remains the sole navigation authority. V9 extends its presentation and remembers useful local UI state without introducing route duplication.

### 4.1 Ordinary feature return

`category → feature → back` returns to the originating category.

Examples:

- `성장 → 성장 업적 → 성장`
- `생활 → 우편함 → 생활`
- `인연 → 선물 → 인연`
- `기록 → 성장 도감 → 기록`

### 4.2 Completed activity return

- training result completion → home;
- Tactical result exit → adventure;
- resolved choice result → the contextual category when one exists, otherwise home;
- ordinary reward claim remains on the feature page long enough to show feedback, then back returns to its category.

### 4.3 Scroll restoration

The V9 page system maintains an in-memory scroll position keyed by semantic route. Opening a feature and returning should restore the category near the prior position. A fresh top-level tab selection may intentionally focus its top/recommendation section.

No scroll position is persisted into save data.

## 5. Replaceable Visual Asset System

Detailed art must be replaceable without editing gameplay or page logic.

### 5.1 Central registry

Create `src/mobile-visual-assets.ts` as the only canonical V9 mapping from semantic visual slots to asset configuration.

Representative slots:

- `home.background`
- `home.hero`
- `category.life.background`
- `category.growth.background`
- `category.adventure.background`
- `category.bond.background`
- `category.records.background`
- `feature.raising.background`
- `feature.season.background`
- `feature.sanctuary.background`
- `feature.world.background`
- `feature.archive.background`
- `battle.default.background`
- `battle.forest.background`
- `battle.ruins.background`
- `battle.rift.background`
- `battle.result.victory`
- `battle.result.defeat`
- `companion.bear.portrait`
- `companion.owl.portrait`
- `companion.wolf.portrait`
- `companion.cat.portrait`
- corresponding companion battle-art slots.

The exact registry may use nested objects rather than string lookup, but components must consume semantic slots and never hardcode final artwork paths throughout the UI.

### 5.2 Asset configuration

Each visual entry may specify:

- `src` — optional image URL/path;
- `fit` — `cover | contain`;
- `position` — focal position;
- `overlay` — `none | light | medium | heavy` for text contrast;
- `alt` — only for meaningful foreground art;
- a deterministic fallback theme when `src` is absent.

### 5.3 Reusable renderers

Create focused visual primitives such as:

- `MobileSceneBackground`
- `MobileCharacterArt`

They accept a semantic visual configuration and render image + contrast layer + fallback consistently.

Background art is decorative and should not create duplicate screen-reader content. Character art receives meaningful alt text only when identity conveyed by the image is not already stated beside it.

### 5.4 Failure behavior

Missing or broken optional art must never make text illegible or controls unusable. Every scene has a themed CSS/gradient fallback. No navigation or action depends on image loading.

### 5.5 Repository art policy

Generated or commissioned PNG/WebP art can later be placed under `public/assets/mobile-v9/` and activated by changing registry entries. V9 can ship with reusable existing artwork and CSS/gradient fallbacks where binary art is not available. No component should need a refactor when final art is replaced.

## 6. Shared Mobile Page System

Introduce a reusable page layer over V8 rather than styling each feature independently.

### 6.1 `MobilePageShell`

Responsibilities:

- page title and optional eyebrow;
- feature-page back affordance when route semantics require it;
- no category-page back affordance;
- optional scene background slot;
- one scroll body;
- optional sticky action zone;
- route-aware scroll restoration hooks;
- correct safe-area padding;
- accessibility landmarks.

It does not own global six-tab navigation; `MobileRouterChrome` remains responsible for global chrome. On V9 ordinary surfaces, `MobileRouterChrome` must not render an additional sticky route-back control. This guarantees exactly one visible back affordance per feature screen.

### 6.2 `MobilePrimaryAction`

A consistent primary CTA primitive supports:

- normal action;
- disabled + visible reason;
- pending/busy;
- destructive/exit variant only where required.

Disabled controls cannot silently fail. If disabled, a nearby text reason or accessible description must state why.

### 6.3 Feedback

Introduce compact page-level feedback for:

- reward claimed;
- gift given;
- attendance received;
- upgrade completed;
- action rejected with reason.

Feedback must not block navigation and must not stack multiple fullscreen modals.

## 7. Home Rebuild

The home screen becomes a game dashboard, not a menu wall.

Visible priorities:

1. compact status;
2. Luna/hero scene;
3. one authoritative `hubNextAction` CTA;
4. one compact claimable/attention strip when needed;
5. dialogue/character response;
6. persistent six-tab nav.

Legacy duplicate shortcuts, promos, planner blocks, duplicated currencies, and competing CTAs remain hidden from the V9 home surface.

The home background and Luna/hero artwork use visual registry slots.

## 8. Compact Status Rebuild

The status area is reorganized for fast scanning on 360px widths.

Primary row:

- generation/year/week context;
- compact notification entry.

Resource row:

- gold;
- gems;
- stamina/energy;
- guardian condition/status when meaningful.

Values must not overflow or push the notification control off-screen. Extremely large values use safe compact formatting while preserving accessible full values when practical.

## 9. Category Dashboard Rebuild

Each category becomes a prioritized dashboard rather than a flat equal-weight list.

Every category contains:

1. `추천` — one next action derived from current game state or a sensible category default;
2. `진행 중 / 받을 것` — at most a few high-value active items;
3. grouped feature navigation.

### 생활
Focus on current week/day: schedule, weekly planner, monthly mission, attendance, mail.

### 성장
Focus on immediate development: raising identity, ambition progress, achievements, inventory, then season/sanctuary grouped as long-term growth.

### 모험
Focus on next outing/expedition/world action. Tactical setup is entered through expedition, not exposed as a competing global route.

### 인연
Focus on current relationship opportunity, gifts, and story.

### 기록
Focus on recent lineage/world changes, then archive access. Long chronicles should not force the player through excessive content just to reach the archive.

## 10. Ordinary Feature Pages

The existing V8 `MobileLegacyFeaturePage` is an adapter, not the final visual architecture. V9 progressively converts exposed features to page-system sections while reusing the existing callbacks/data:

- missions;
- attendance;
- mail;
- achievements;
- inventory;
- gifts;
- outing;
- bond;
- stories.

Action results stay visible long enough to confirm success. Lists use clear card grouping and large actions. Empty states state what will unlock or appear next.

## 11. Complex Feature Pages

The following current fullscreen/overlay-style surfaces receive mobile-first wrappers or presentation refactors:

- raising identity;
- yearly ambition;
- season/live ops;
- sanctuary and astral surfaces;
- guardian expedition setup;
- world progress;
- collection/archive.

V9 should reuse their calculations and callback interfaces. The preferred migration path is to separate content from old overlay framing, then render the content inside `MobilePageShell`. Where that would create excessive risk in one wave, an adapter may temporarily neutralize the legacy frame, but modal-on-modal navigation is not acceptable as the final V9 mobile path.

## 12. Training and Choice Event UX

### Training active

- gameplay content gets maximum available viewport;
- only guarded `뒤로 + 홈` chrome;
- confirmation before loss-sensitive exit;
- no six-tab nav;
- result restores ordinary nav;
- primary result action returns to home.

### Choice events

- readable story body;
- large choice cards/buttons;
- unresolved choice uses guarded chrome;
- selected/resolved result restores normal navigation;
- decision controls cannot be hidden below an unreachable nested scroll area.

## 13. Tactical Mobile Rebuild

V9 does not change Tactical engine semantics.

Presentation goals:

- battle scene uses `battle.*.background` registry slot;
- companion/player visual areas use replaceable character slots;
- compact top HUD communicates turn, team health/status, and resources;
- target selection is visually explicit;
- hand/cards remain reachable above safe area;
- AUTO/speed controls do not compete with the primary action;
- dead/invalid targets are visually distinct and cannot appear actionable;
- active battle has guarded back/home only;
- result restores ordinary navigation and clearly offers retry/continue/exit where supported;
- victory/defeat result can use separate replaceable background slots.

Short-height screens must not hide card actions or result controls.

## 14. Modal Policy

Use modal only for:

- destructive/exit confirmation;
- short blocking confirmation that cannot be a page state;
- very small transient choice where replacing the page would be more disruptive.

Frequently visited game features are routed pages. V9 must avoid overlay-on-overlay-on-overlay stacks.

## 15. Accessibility and Motion

V9 requires:

- semantic headings and landmarks;
- `aria-current` on selected global tab;
- descriptive names for icon actions;
- visible `:focus-visible` treatment;
- modal focus containment/return where modal remains;
- `prefers-reduced-motion: reduce` disabling nonessential transitions;
- text and controls not relying on color alone;
- contrast overlays for image-backed text.

## 16. Mobile Viewport Contracts

Required baselines:

### 360×640
The hard compact case. All critical navigation and primary actions remain reachable. No horizontal overflow.

### 390×844
Primary reference layout.

### 430px width
Uses added space without changing information architecture.

### short-height mode
At heights around 640px or lower, decorative art shrinks before controls or readable text do.

## 17. Error and Disabled-State Communication

A disabled or rejected action should state a reason close to the action, such as:

- `스태미나 부족`
- `이번 주 이미 완료`
- `조건을 충족해야 해금`
- `보유 재화 부족`
- `선택할 수 있는 대상 없음`

The reducer/game engine remains authoritative; presentation-derived reasons must match existing eligibility logic and cannot invent a second rules engine.

## 18. Testing Strategy

V9 adds focused tests before implementation changes.

Required contracts:

- visual asset registry has stable required semantic slots and fallbacks;
- missing visual art renders a usable fallback;
- ordinary page shell has one primary scroll body;
- category dashboards do not render a duplicate back control;
- feature pages render exactly one contextual back control in the page header;
- ordinary routes preserve six-tab navigation;
- training/Tactical/unresolved choice active routes show guarded back/home only;
- result routes restore ordinary navigation;
- category dashboards expose recommendation before grouped secondary features;
- disabled actions expose a visible/accessibility reason;
- feature back restores category route and stored scroll state contract;
- 360/390/430 CSS contracts preserve touch and safe-area rules;
- Tactical UI has replaceable battle/companion visual hooks;
- no mobile route requires nested legacy fullscreen modal framing.

Every package runs targeted tests, then the full suite, TypeScript, production build, and dependency audit gate before promotion.

## 19. Implementation Packages

V9 remains one release but is implemented in four independently verifiable packages.

### Package A — Foundation and Replaceable Art

- asset registry and visual renderers;
- MobilePageShell / primary action / feedback primitives;
- shared V9 tokens and scroll restoration mechanism;
- foundation tests.

### Package B — Home, Status, Navigation, Category Dashboards

- home rebuild;
- compact status rebuild;
- recommendation-first category dashboards;
- six-tab interaction polish;
- route scroll restoration;
- responsive contracts.

### Package C — Feature Surface Migration

- ordinary feature pages;
- raising/ambition/season/sanctuary/world/archive mobile framing;
- disabled reasons, reward feedback, empty states;
- remove remaining avoidable fullscreen modal nesting.

### Package D — Active Play, Tactical, Choice and Final Polish

- training/choice guarded experience;
- Tactical setup/battle/result mobile layout and replaceable art hooks;
- short-height and long-content regression;
- accessibility pass;
- full release verification.

## 20. Release Gates

Promotion order:

`work/v9-full-mobile-ux → integration/v3 → main → production`

Before source merge:

- all targeted V9 tests GREEN;
- full repository test suite GREEN;
- `npm audit` reports zero known vulnerabilities at gate time;
- `tsc -b && vite build` GREEN;
- no unresolved PR review threads.

Before declaring production complete:

- main exact commit is verified;
- main CI is GREEN;
- Vercel production deployment for that exact commit is READY when platform quota permits;
- canonical root responds successfully;
- telemetry endpoint responds successfully;
- no deployment-specific runtime fatal/error evidence in the verification window.

If Vercel build quota blocks deployment, report that as an explicit external blocker and do not claim production completion.

## 21. Acceptance Criteria

V9 is complete when a mobile player can traverse the game without becoming trapped, losing navigation context, or needing to decipher inconsistent controls; primary features have coherent page hierarchy; active play protects accidental exits; return behavior is predictable; critical controls remain reachable at 360×640; and all major decorative/character/battle artwork is accessed through replaceable semantic slots with usable fallbacks.
