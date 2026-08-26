# Puppy Maker V9 — Full Mobile UX Rebuild Design

Date: 2026-08-26
Repository: `asitiso/puppy-maker`
Target baseline: V8 Mobile Router GREEN on `integration/v3`
Working title: V9 Full Mobile UX Rebuild

## 1. Purpose

V9 is a large-scale mobile UX rebuild focused on comfort, clarity, consistency, and controllability. It does not add a new game system. It rebuilds the presentation and interaction layer around existing gameplay so a mobile player can understand what to do, reach the intended action quickly, recover from mistakes, and leave any non-destructive screen without getting trapped.

The existing V8 router remains the navigation foundation. V9 replaces inconsistent screen-specific visual and interaction patterns with one shared mobile UI system.

## 2. Non-goals

V9 must not intentionally change:

- save schema or save compatibility,
- economy/reward values,
- raising calculations,
- expedition/Tactical combat calculations,
- story eligibility or outcome rules,
- NG+/True/Hollow path semantics,
- season progression semantics,
- authoritative game reducer behavior except where a navigation adapter is strictly required.

Any gameplay bug discovered during V9 that requires semantic changes must be isolated and tracked separately unless it blocks safe UX behavior.

## 3. Core UX principles

### 3.1 One screen, one primary decision

Every screen should make one primary action obvious. Secondary actions remain available but must not compete visually with the primary action.

### 3.2 Predictable navigation

Normal state:

- six primary destinations remain available: `홈 / 생활 / 성장 / 모험 / 인연 / 기록`;
- feature pages retain their semantic category;
- Back returns one level within the current navigation history;
- Home returns directly to home.

Guarded active-play state:

- during training, active Tactical combat, and unresolved choice events, the six-category navigation is hidden;
- only fixed `뒤로` and `홈` controls remain;
- either exit action opens a confirmation dialog before abandoning the active attempt;
- completed/result states are not guarded and restore the normal six-category navigation.

### 3.3 One scroll owner per screen

A full-screen route has exactly one primary vertical scroll owner. Nested panels may use internal scrolling only when content semantics require it and the nested scroll region is clearly bounded.

Long screens must never hide the only Back, Close, Home, or primary completion action beyond an unreachable area.

### 3.4 Thumb-first controls

- icon-only control minimum target: 44×44 px,
- standard control target: at least 48 px high,
- primary CTA: 52–56 px high,
- safe-area-aware spacing is mandatory,
- destructive actions are visually distinct from ordinary navigation.

### 3.5 Explicit state feedback

Disabled, locked, completed, claimable, and error states must explain themselves. A disabled button without a reason is not acceptable for core flows.

Success actions such as reward claim, completed growth action, or saved selection receive concise visual feedback without blocking the flow.

## 4. Visual direction

V9 keeps the fantasy identity of Puppy Maker but moves the UI toward a cleaner modern mobile RPG presentation.

- Character/world art remains visually dominant where relevant.
- Heavy parchment framing is reduced.
- Decorative borders are secondary to hierarchy.
- Gold/accent colors identify importance, not every surface.
- Background, cards, controls, and text use a limited shared token system.
- Animation is short and responsive, generally 100–200 ms.
- `prefers-reduced-motion` removes non-essential motion.

## 5. Shared V9 UI system

V9 introduces or standardizes the following reusable primitives:

- `MobilePageShell`
- `MobileTopBar`
- `MobileStatusStrip`
- `MobileBottomNav`
- `PrimaryCTA`
- `SecondaryAction`
- `ActionCard`
- `ListRow`
- `SegmentTabs`
- `ProgressCard`
- `RewardCard`
- `EmptyState`
- `LockedState`
- `InlineReason`
- `Toast`
- `ConfirmDialog`
- `StickyActionBar`

These components own spacing, typography, touch sizes, focus states, disabled semantics, and safe-area behavior. Feature screens should not recreate equivalent styles locally unless they have a documented reason.

## 6. Typography and density

Default mobile targets:

- display: 24 px,
- page title: 22–24 px,
- section title: 18 px,
- body: 15 px,
- secondary body: 14 px,
- button: 15–16 px,
- caption: 12–13 px only for low-priority metadata.

Important information must not rely on 12 px text.

Long Korean copy must wrap naturally. Important labels should not be clipped by fixed-width containers. Information density must be tuned independently for 360×640, 390×844, and 430 px widths rather than scaling every component uniformly.

## 7. Home rebuild

The home screen becomes a compact decision hub rather than a second menu wall.

Required structure:

1. compact status strip,
2. character/world focal area,
3. one `지금 할 일` primary recommendation,
4. concise contextual dialogue/status,
5. persistent six-category bottom navigation.

Duplicate shortcuts, redundant resource blocks, and competing promo cards should not reappear on the home screen if they already have a category destination.

The recommendation should explain what action is suggested and why when that context is useful.

## 8. Category dashboard rebuild

Each category is a dashboard, not an exhaustive menu dump.

### 생활

Prioritize current weekly plan, current actionable life task, and schedule. Attendance, mission, and mail remain reachable but should not all compete equally above the fold.

### 성장

Prioritize the most relevant current growth action, then active progress, then long-term systems. Achievements, Season, Sanctuary, identity, ambition, and inventory should be grouped by player intent rather than displayed as an undifferentiated list.

### 모험

Prioritize current expedition/world opportunity, then travel/outing and world progress. Tactical entry should communicate readiness/locked state before entry.

### 인연

Prioritize current relationship/story opportunity. Gifts and bond status should support the relationship flow instead of acting like unrelated inventory screens.

### 기록

Prioritize recent/new records and collection progress. Lineage/world chronicles remain available but long historical content should be progressively disclosed rather than forcing a very long first screen.

## 9. Feature-page rebuild

All major feature pages receive the shared page shell and interaction contract.

Audit and rebuild scope includes:

- Schedule / Weekly Planner
- Training setup and result
- Inventory / Gifts
- Achievements
- Missions
- Attendance
- Mail
- Season Live Ops
- Sanctuary
- Raising identity
- Yearly ambition
- World progress
- Expedition
- Tactical setup / battle / result
- Story / Bond
- Choice events
- Collection archive
- Lineage / World chronicles
- NG+/generation-related presentation screens
- Existing modal, overlay, sheet, and legacy panel surfaces still reachable from production paths

A feature may retain a specialized internal layout when gameplay requires it, but shell/navigation/typography/control behavior must remain consistent.

## 10. Active-play presentation

Training, active Tactical combat, and unresolved choice events use a focused play mode.

- six-category bottom navigation is hidden;
- fixed Back and Home controls remain available;
- leaving requires confirmation;
- game content owns the rest of the viewport;
- no unrelated status cards or navigation chrome should reduce the play area unnecessarily.

When the active attempt resolves into a result state, normal navigation returns immediately.

## 11. Return and history behavior

V9 keeps route origin and relevant scroll position wherever practical.

Examples:

- `성장 → 업적 → 상세 → 보상 → 뒤로` returns to the previous achievement context;
- `생활 → 우편 → 수령 → 뒤로` returns to mail/life context, not home;
- `인연 → 이야기 → 선택 이벤트 → 결과` returns to the story flow;
- `모험 → 원정 → Tactical → 결과` returns to the expedition/result context;
- an explicitly completed top-level play cycle may return to home when that is the designed completion destination.

Back and Close must not be synonyms for “go home” unless home is actually the parent destination.

## 12. Status, error, and empty states

Every major action should have a clear state model:

- available,
- selected,
- in progress,
- completed,
- claimable,
- claimed,
- locked,
- disabled with reason,
- error/retry where relevant.

Empty lists should explain what the screen is for and what the player can do next.

## 13. Accessibility and interaction

Required:

- visible `:focus-visible`,
- semantic buttons for interactive controls,
- `aria-current` for navigation,
- descriptive accessible names for icon controls,
- reduced-motion support,
- sufficient text/background contrast,
- no color-only status communication,
- keyboard Escape/back behavior for dismissible desktop-compatible dialogs where applicable.

## 14. Responsive requirements

Hard QA targets:

- 360×640,
- 390×844,
- 430 px width,
- short-height viewport,
- `100dvh`,
- top/bottom/left/right safe areas,
- long Korean strings,
- large dynamic content lists.

No target viewport may lose the only exit control or primary CTA.

## 15. Migration strategy

V9 is a controlled UI rewrite, not a big-bang gameplay rewrite.

1. Finish V8 router and establish a GREEN `integration/v3` baseline.
2. Create `work/v9-full-ux-rebuild` from that exact baseline.
3. Add V9 shared primitives and tokens behind tests.
4. Convert Home and category dashboards.
5. Convert ordinary feature pages.
6. Convert large legacy overlays and long-scroll screens.
7. Convert training/choice active-play chrome.
8. Convert Tactical setup/active/result presentation.
9. Remove superseded V7/V8 presentation paths only after all production routes use V9 equivalents.
10. Run full regression and promote through `integration/v3` then `main`.

During migration, gameplay callbacks and reducer ownership should be preserved wherever possible.

## 16. Testing and release gate

V9 must include contract tests for:

- six-category navigation in normal state,
- guarded Back/Home during active training,
- guarded Back/Home during active Tactical combat,
- guarded Back/Home during unresolved choice event,
- normal navigation restored in result states,
- category → feature → Back origin restoration,
- long-list reachability,
- single-scroll-owner behavior,
- safe-area padding,
- minimum touch targets,
- sticky CTA not hidden by bottom navigation,
- disabled reason rendering,
- success feedback,
- empty/locked/completed states,
- reduced-motion,
- long Korean wrapping.

Final gate:

- targeted V9 tests GREEN,
- full Vitest suite GREEN,
- TypeScript GREEN,
- production build GREEN,
- audit gate GREEN under the repository's existing policy,
- exact-head PR verification,
- `integration/v3` verification,
- `main` verification,
- production deployment exact-SHA verification when deployment capacity is available,
- runtime/smoke verification where tooling permits.

## 17. Deployment-capacity handling

Vercel preview/production deployment limits are external release constraints, not reasons to weaken code verification. If deployment capacity is rate-limited, V9 may reach code/integration GREEN but must not be reported as production-deployed until an exact-SHA deployment is actually READY and smoke-verified.

## 18. Success criteria

V9 is successful when:

- a new mobile player can identify the next useful action quickly;
- primary navigation behaves identically across ordinary screens;
- active play cannot be exited accidentally;
- every major screen has a reachable escape route;
- long content remains fully controllable on 360×640;
- repeated UI patterns look and behave the same across systems;
- existing gameplay/save semantics pass unchanged regression tests;
- legacy presentation paths no longer create conflicting scroll/navigation behavior.
