# V7 Mobile UX Cleanup / Home Simplification — Design

## Goal
Rebuild the mobile-first home and major interactive panels so players can immediately understand what to do next, read every important label comfortably, and avoid overlapping or duplicated controls on 360px, 390px, and 430px-class phones.

## Baseline
- production main: `0166df866e51fae6e320edd5cc76dd5d166b3a57`
- integration baseline: `bec20da540c3417cb804c06f85224bc18cc0d258`
- shared tree: `63256404d8f484b30745aefac1bd8d7560e6939a`
- work branch: `work/v7-mobile-ux`

## Problems confirmed in current code
1. `LayeredHome` simultaneously renders rank, currency/stamina, weather, RunGuidance, WeeklyPlanner, four shortcut buttons, collection goal, two promo buttons, the authoritative primary action, Luna dialogue, and five bottom-nav buttons. That creates too many simultaneous decision surfaces on mobile.
2. The home uses many absolute-positioned percentage blocks. `lh-shortcuts`, `lh-goal`, `lh-primary-action`, `lh-dialogue`, `lh-bottom-nav`, `lh-weekly-planner`, and companion cards can visually compete or overlap as viewport height changes.
3. Font sizes vary widely and include very small values such as 8px/9px/10px in actionable and explanatory UI. This is below the desired mobile reading comfort for a game designed mobile-first.
4. WeeklyPlanner currently renders seven focus buttons plus Lineage Chronicle and World Chronicle directly in the same home flow, increasing control density.
5. Overlay/panel content inherits multiple ad-hoc text sizes and button styles instead of a small shared mobile type/button scale.

## Design principles
### 1. One dominant action
`hubNextAction(state)` remains the only authoritative home primary action. V7 must not add a second prominent CTA competing with it.

### 2. Progressive disclosure
The home should show only the information needed for the next decision. Detailed weekly focus choices, chronicles, achievements, mail, collection detail, and long-form records move behind a single expandable/action-sheet style surface rather than being fully expanded at once.

### 3. Four mobile layers
The default home is organized conceptually into four layers:
- **Status bar:** generation/year/month/week, stamina, gold/gems, guardian rank in compact readable form.
- **Primary task card:** `hubNextAction` label and short detail, one large action.
- **Today/This week summary:** compact summary of weekly plan, Luna relationship/status, and active world/generation signals with at most 2 secondary buttons visible.
- **Navigation:** five bottom destinations remain, but shortcut duplication above them is removed or folded into a single `더보기`/utility entry.

### 4. Utility consolidation
The four top shortcuts (`출석체크`, `이벤트`, `우편함`, `미션`) and the two promo circles are not all shown simultaneously. They are consolidated into one compact utility launcher with badges for actionable items. Existing destinations and reducer behavior stay intact.

### 5. Weekly planner simplification
The home no longer shows all seven weekly focus buttons at once. The compact weekly card shows current selection/status and one `이번 주 계획` secondary action. Opening it reveals the seven focus choices in a sheet/panel. `LineageChronicle` and `WorldChronicle` remain available but are collapsed under history/world sections rather than permanently occupying the home stack.

### 6. Mobile typography tokens
Introduce a small shared mobile scale used by home and major home-launched panels:
- `--ui-text-caption: 12px`
- `--ui-text-small: 13px`
- `--ui-text-body: 15px`
- `--ui-text-button: 15px`
- `--ui-text-subtitle: 17px`
- `--ui-text-title: 21px`
- `--ui-text-display: 24px`

Rules:
- Actionable button text must not be below 14px; primary/secondary button labels target 15px+.
- Essential status/body text must not be below 13px.
- 12px is reserved for nonessential captions/eyebrows only.
- Existing 8px/9px home labels are removed from important content.
- Line height uses at least 1.35 for body copy.

### 7. Shared control tokens
- minimum touch target: 44px × 44px
- primary button min-height: 52px
- secondary/list button min-height: 48px
- sheet close button: 44px
- consistent radius, padding, focus-visible outline, pressed state
- controls that are not immediate binary settings must not masquerade as toggles

### 8. Layout safety
The home remains 9:16/mobile-first but should rely less on independent overlapping absolute blocks. The scene/character can remain layered, while interactive UI is placed in deliberate top / middle / bottom bands with reserved space.

Viewport contracts:
- 360×640
- 390×844
- 430px-class width
- `100dvh`
- safe-area top/bottom/left/right
- no horizontal overflow
- no primary-action/dialogue/nav overlap
- long Korean labels wrap or truncate intentionally

### 9. Desktop compatibility
Desktop is secondary. V7 must not make the existing desktop shell unusable, but no desktop-specific redesign is required. Wider viewports should center the same mobile-first composition rather than introduce a different information architecture.

## Proposed component boundaries
### `MobileHomeStatus`
Compact display-only status summary. No navigation authority.

### `HomeUtilitySheet`
Owns utility destinations previously shown as multiple top shortcuts/promos. It calls existing `openMenu` destinations; no game-state mutations are duplicated.

### `WeeklyPlannerCard`
Supports compact mode on home. Detailed focus grid is rendered only when its planner panel/sheet is open.

### `LayeredHome`
Continues to own presentation state and `openMenu`. It consumes `hubNextAction` and renders exactly one prominent primary action.

### Shared CSS tokens
Add a focused mobile UI token stylesheet and reuse it from layered-home / planner / chronicle / home panel CSS. No dependency/framework replacement.

## Interaction behavior
1. Player lands on home and sees current status + one obvious next action.
2. If the player wants a different activity, bottom navigation remains available.
3. Utility notifications are represented by one utility launcher/badge rather than four always-visible shortcut buttons.
4. Weekly planning opens into a dedicated panel/sheet; choosing a focus closes or updates the detail state without adding another persistent home control row.
5. Home-launched panels use consistent title/body/button typography and fixed close-target behavior.

## Accessibility
- preserve focus return on panel close
- Escape closes dialogs where currently supported
- `aria-modal`, labels, pressed/current states preserved
- no touch target below 44px
- visible focus outline
- `prefers-reduced-motion: reduce` disables nonessential transitions/animations
- color is not the only indication of selected/available state

## Compatibility invariants
- `hubNextAction` remains authoritative and unique
- no game progression/reducer semantics change
- save schema unchanged
- V3/V4/V5/V6 systems unchanged
- NG+/generation/True/Hollow rules unchanged
- existing menu IDs and callbacks remain valid
- no raw progression reset or migration

## Testing strategy
### Source/UI contract tests
- exactly one `.lh-primary-action`
- no always-visible legacy shortcut cluster on <=430px
- utility launcher exposes existing destinations
- weekly focus grid is hidden from default compact home and available in planner detail
- actionable home/panel text uses tokenized size classes/variables instead of 8px/9px hard-coded values
- mobile control minimum heights are 44/48/52px as designed
- safe-area and reduced-motion declarations exist

### Functional tests
- every existing shortcut destination still opens
- `hubNextAction` routing remains unchanged
- weekly select/complete/advance still works
- panel focus/close behavior still works

### Regression
- full Vitest suite
- TypeScript build
- Vite production build
- existing mobile tests for Spring/Summer/Autumn/Winter/Fifth/Hollow/NG+ remain green

## Release gate
RED contracts → minimal refactor → targeted UI tests → full regression/build → preview visual smoke → integration tree verification → release PR synthetic CI → exact main push CI → exact Vercel production SHA → root/API 200 → production runtime error/fatal log check.
