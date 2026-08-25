# V7 Mobile UX Cleanup / Home Simplification — Design

## Goal
Rebuild the mobile-first home and major interactive panels so players can immediately understand what to do next, read every important label comfortably, and navigate the expanded game through clear categories without overlapping or duplicated controls on 360px, 390px, and 430px-class phones.

## Baseline
- production main: `0166df866e51fae6e320edd5cc76dd5d166b3a57`
- integration baseline: `bec20da540c3417cb804c06f85224bc18cc0d258`
- shared tree: `63256404d8f484b30745aefac1bd8d7560e6939a`
- work branch: `work/v7-mobile-ux`

## Problems confirmed in current code
1. `LayeredHome` simultaneously renders rank, currency/stamina, weather, RunGuidance, WeeklyPlanner, four shortcut buttons, collection goal, two promo buttons, the authoritative primary action, Luna dialogue, and five bottom-nav buttons. That creates too many simultaneous decision surfaces on mobile.
2. The home uses many absolute-positioned percentage blocks. `lh-shortcuts`, `lh-goal`, `lh-primary-action`, `lh-dialogue`, `lh-bottom-nav`, `lh-weekly-planner`, and companion cards can visually compete or overlap as viewport height changes.
3. Font sizes vary widely and include very small values such as 8px/9px/10px in actionable and explanatory UI.
4. WeeklyPlanner renders seven focus buttons plus Lineage Chronicle and World Chronicle directly in the same home flow.
5. Existing bottom categories (`스케줄 / 가방 / 퀘스트 / 외출 / 교감`) describe individual features, not the now-larger game domains, so new systems accumulate as duplicate shortcuts and floating cards.

## Information architecture — six clear mobile categories
The bottom navigation becomes six semantic destinations. Labels stay short enough for 360px while each category is broad enough to remain stable as the game grows.

### 1. 홈
Purpose: only the current situation and the single most important action.
- compact generation/year/month/week status
- gold / gems / stamina
- current Luna/context line
- exactly one authoritative `hubNextAction(state)` CTA
- notification badge only when there is actionable mail/attendance/reward information

### 2. 생활
Purpose: time management and routine progression.
- weekly plan and weekly focus
- schedule
- monthly focus / monthly missions
- attendance
- mail / routine notices
- week/month advancement context

### 3. 성장
Purpose: raising and long-term character progression.
- growth achievements
- mastery / talents / guardian rank / career records already exposed by current panels
- season progression entry
- inventory/status information that supports raising

### 4. 모험
Purpose: leaving home to actively play content.
- outing
- Expedition
- Tactical
- world/campaign activity entry points
- generational public project progress where it is actionable

### 5. 인연
Purpose: Luna and character relationships.
- bond / affection
- gifts
- character story/event archive
- living NPC relationship context

### 6. 기록
Purpose: history, collection and multi-generation records.
- Lineage Chronicle
- World Chronicle
- memories / discoveries / collection summary
- campaign/ending history where already available

The navigation labels are exactly `홈 / 생활 / 성장 / 모험 / 인연 / 기록`.

## Navigation behavior
- Home is not an overlay; selecting `홈` closes category/detail sheets and returns to the clean scene.
- The other five categories open a large mobile category sheet with 2–4 clearly grouped destinations rather than placing every destination on the home scene.
- Existing `HomeMenuId` destinations remain internally valid for compatibility. New semantic categories map to them instead of deleting reducer or callback behavior.
- Category sheets use progressive disclosure: category overview → detail panel. Do not show every system at once.

## Icon and visual language
V7 creates an in-app SVG icon system instead of adding mismatched raster assets.

### Six primary icons
- `home`: cottage/roof + small star accent — safe return / current place
- `life`: calendar page + sun dot — weekly/monthly routine
- `growth`: sprout + upward spark — raising/progression
- `adventure`: compass/waypoint — expedition/exploration
- `bond`: heart + paw accent — relationships
- `records`: open book + constellation spark — history/archive

### Icon rules
- shared `24×24` viewBox
- 1.8–2px rounded stroke, `currentColor`
- no text baked into icon assets
- inactive: warm ivory line at reduced opacity
- active: gold/cream foreground plus subtle filled circular/rounded backing
- notification badge is separate from the icon
- minimum rendered icon 22px on bottom navigation; category-sheet icons 24–28px
- selected state must also use shape/background/label weight, not color alone

### Visual tone
Keep the existing warm fantasy home scene, parchment/gold language and Luna character art. V7 makes the chrome quieter and cleaner instead of replacing the game's visual identity.
- dark translucent navigation glass over the scene
- warm parchment sheets for detailed reading
- gold only for focus/selection/reward, not every control
- fewer ornamental frames around small controls
- cards use consistent radius/shadow/border tokens

## Default home composition
The default mobile home has only four persistent interactive zones.
1. **Compact status header** — generation/year/month/week, currency, stamina, guardian rank, notification icon.
2. **Luna scene** — character remains the visual center and can still be tapped for affection feedback.
3. **Primary task card** — `hubNextAction` label and short detail, exactly one large action.
4. **Six-item bottom navigation** — `홈 / 생활 / 성장 / 모험 / 인연 / 기록`.

The existing always-visible shortcut row, promo circles, collection goal panel, full weekly planner, Lineage Chronicle and World Chronicle are removed from the default scene.

## Home status
Create a compact status surface rather than separate rank/currency/weather frames.
- first line: `N세대 · X년차 · M월 W주차`
- second line: gold, gems, stamina
- guardian rank as a small readable chip or short label
- one notification bell/message affordance only when actionable; notification access routes to the correct semantic category/detail instead of becoming a seventh content category

## Weekly planner simplification
- Weekly planning lives under `생활`.
- Home never renders all seven weekly focus buttons.
- `생활` overview shows current week, selected focus and completion state.
- `이번 주 계획` opens the seven focus choices in a dedicated sheet/detail region.
- select/complete/advance reducer semantics remain unchanged.

## Records simplification
- `LineageChronicle` and `WorldChronicle` move to the `기록` category.
- They are not permanently rendered on home.
- The records overview may show one short summary for generation/legacy, then expandable/detail content.

## Mobile typography tokens
Create shared tokens used by home, category sheets and home-launched detail panels.
- `--ui-text-caption: 12px`
- `--ui-text-small: 13px`
- `--ui-text-body: 15px`
- `--ui-text-button: 15px`
- `--ui-text-subtitle: 17px`
- `--ui-text-title: 21px`
- `--ui-text-display: 24px`

Rules:
- actionable button text must not be below 14px
- primary/secondary labels target 15px+
- essential status/body text must not be below 13px
- 12px only for nonessential captions/eyebrows
- remove current 8px/9px important home labels
- body line-height >= 1.35

## Shared control tokens
- minimum touch target: `44px × 44px`
- primary button min-height: `52px`
- secondary/list button min-height: `48px`
- bottom navigation target: at least `48px` high with 44px hit area
- sheet close button: `44px`
- consistent radius, padding, focus-visible outline and pressed state
- no decorative toggle treatment for non-binary actions

## Layout safety
The scene can remain layered/absolute, but interactive chrome uses reserved top/middle/bottom bands rather than independently overlapping percentage blocks.

Viewport contracts:
- `360×640`
- `390×844`
- `430px` class
- `100dvh`
- all safe-area insets
- no horizontal overflow
- no primary-action/dialogue/nav overlap
- six bottom items remain independently tappable
- long Korean labels wrap/truncate intentionally

## Proposed component boundaries
### `MobileNavIcon`
Reusable SVG icon renderer for the six category icons and common utility icons.

### `MobileHomeStatus`
Compact display-only status summary plus actionable notification affordance. No game progression authority.

### `MobileCategorySheet`
Semantic category overview for `생활 / 성장 / 모험 / 인연 / 기록`. Routes to existing destinations/callbacks and can host compact records/planner content.

### `WeeklyPlannerCard`
Gains a detail/compact composition suitable for the `생활` category. It no longer owns persistent home placement.

### `LayeredHome`
Owns presentation state, semantic category state and existing `openMenu`. It still consumes `hubNextAction` and renders exactly one prominent primary action.

### Shared CSS tokens
Add `mobile-ui-tokens.css` and apply it to layered home, category sheets, planner, chronicles and home panels.

## Interaction behavior
1. Player lands on home and sees status, Luna and one obvious next action.
2. Bottom navigation changes semantic category, not individual low-level feature.
3. Category overview explains what belongs there and presents only the most useful sub-destinations.
4. Existing detail panels remain reachable through category destinations.
5. `홈` always closes open category/detail presentation state.
6. Notification badge opens the relevant existing reward/detail destination; it does not duplicate content.
7. Focus returns correctly when detail dialogs close.

## Accessibility
- preserve focus return on detail panel close
- Escape closes modal/detail layers where currently supported
- `aria-modal`, labels, pressed/current states preserved
- every navigation item has visible text plus icon
- no touch target below 44px
- visible focus outline
- `prefers-reduced-motion: reduce` disables nonessential transitions/animations
- color is not the only selected/available indication

## Compatibility invariants
- `hubNextAction` remains authoritative and unique
- no game progression/reducer semantics change
- save schema unchanged
- V3/V4/V5/V6 systems unchanged
- NG+/generation/True/Hollow rules unchanged
- existing `HomeMenuId` and callbacks remain valid internally
- no raw progression reset or migration

## Testing strategy
### Source/UI contracts
- navigation labels exactly contain `홈 / 생활 / 성장 / 모험 / 인연 / 기록`
- six semantic nav items each have icon + label and >=44px hit target
- exactly one `.lh-primary-action`
- legacy shortcut cluster and promo circles are absent from default mobile home
- full weekly focus grid is absent from default home
- Lineage/World Chronicle are absent from default home and available in records category
- actionable home/panel text uses shared token values rather than 8px/9px important labels
- safe-area and reduced-motion declarations exist

### Functional contracts
- home nav closes category/detail surfaces
- life category can reach schedule, weekly planner, missions, attendance and mail
- growth category can reach achievements/status/season progression
- adventure category can reach outing and Expedition/Tactical callbacks
- bond category can reach bond and story/event content
- records category renders lineage/world records
- `hubNextAction` routing remains unchanged
- weekly select/complete/advance remains unchanged
- panel focus/close behavior remains intact

### Regression
- full Vitest suite
- TypeScript build
- Vite production build
- existing Spring/Summer/Autumn/Winter/Fifth/Hollow/NG+/V4/V5/V6 tests remain green

## Release gate
RED contracts → minimal refactor → targeted UI tests → full regression/build → preview visual smoke → integration tree verification → release PR synthetic CI → exact main push CI → exact Vercel production SHA → root/API 200 → production runtime error/fatal log check.
