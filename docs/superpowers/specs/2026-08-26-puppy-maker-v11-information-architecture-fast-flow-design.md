# Puppy Maker V11 — Information Architecture Rebuild + Fast Flow + Visual Polish

Status: approved high-level design, written specification for Issue #208

## 1. Baseline and release lane

Authoritative development baseline:

- `integration/v3@5e01ea77e906255b784c1e78542aaec78e7b6831`
- current `main@6f6b1f380b515e57b48a2a253228452a5bcf74f4`
- working branch: `work/v11-information-architecture`
- tracking: Issue #208

V10's production deployment quota blocker is an operational deployment concern and is not a V11 product or architecture dependency. V11 must not change its design to work around Vercel Hobby deployment limits.

Promotion remains:

`work/v11-information-architecture` → `integration/v3` → `main` → production

No force push. No direct work-branch-to-main merge. Promotion must use exact-head guards and fresh CI evidence.

## 2. Goal

V11 makes information-heavy screens faster to understand and faster to use.

The update is not primarily a visual redesign. It reorganizes existing information so a player can:

1. understand the current state without scanning a long page,
2. find a specific item with less scrolling,
3. distinguish what matters now from historical/completed information,
4. compare related items consistently,
5. understand why something is locked,
6. move directly into an existing valid action when one is available,
7. keep the visual feeling of an RPG rather than an administration dashboard.

The player-facing promise is:

> 필요한 정보를 빠르게 찾고, 중요한 항목을 먼저 이해하고, 기존 행동으로 바로 이어갈 수 있게 한다.

## 3. Approved product direction

V11 is built around **Information Architecture Rebuild**.

Two smaller supporting themes are included:

- **Fast Flow:** safe quick actions, continuation, retry, and direct resolution routes using existing callbacks/routes.
- **Visual Polish:** consistent typography, cards, spacing, progress, badges, focus states, and empty/locked/completed presentation.

Priority order is fixed:

1. Achievements / Quests
2. Records / Collection
3. Season / Meta
4. Expedition / Regions
5. Bag / Items

This ordering determines implementation sequence unless a shared primitive must be completed first.

## 4. Product principles

### 4.1 Information architecture first

V11 should improve hierarchy before decoration.

Each screen should answer these questions in roughly this order when applicable:

- What is my overall state here?
- What needs attention now?
- How do I narrow the list?
- What are all available items?
- What does the selected item mean?
- What can I do next?

### 4.2 Domain truth stays authoritative

UI code must not become a second rules engine.

Progress, rewards, eligibility, unlock conditions, inventory ownership, attempts, completion, and campaign/season state remain owned by existing domain modules/selectors.

V11 adapters may:

- group items,
- prioritize items,
- choose presentation labels from authoritative values,
- expose safe existing actions,
- build searchable text from information already visible to the player.

V11 adapters must not:

- calculate substitute rewards,
- infer new unlock conditions,
- manufacture eligibility,
- change inventory semantics,
- repair malformed state independently of existing sanitizers,
- reveal information the domain currently keeps hidden.

### 4.3 UI state is session-only

Search text, active filters, sort selection, currently selected list item, expanded/collapsed sections, and local recent-navigation state are presentation state only.

They must not add fields to the save schema.

They may live in component state or a small local presentation helper where useful. They must reset safely on remount/reload without changing gameplay.

### 4.4 Progressive disclosure

Important context appears first. Detail appears when requested.

Do not force every card to show every field. The compact view should carry enough information to scan and compare. Detailed descriptions, history, long explanations, and secondary metadata belong in a detail surface or expandable section.

### 4.5 Free exploration remains available

Recommendations, important sections, and quick actions must not hide the full list or turn the UI into a forced wizard.

### 4.6 Clean RPG menu, not admin dashboard

The information layout may borrow the clarity of productivity interfaces, but it must retain game presentation:

- concise section titles,
- progression-oriented language,
- visual hierarchy rather than dense tables,
- clear cards/list rows,
- restrained game accents,
- no spreadsheet-like management aesthetic.

## 5. Existing foundations to retain

V11 builds on V9 and V10 rather than replacing them.

### Mobile page architecture

`MobilePageShell` remains authoritative for:

- page heading,
- contextual back,
- one vertical scrolling region,
- scroll memory,
- optional sticky primary action,
- background slot integration.

V11 must not create a second page shell or nested page-scroll architecture.

### Navigation

Existing mobile router/navigation callbacks remain authoritative. V11 does not create a parallel route stack.

List-detail selection may use local UI state where appropriate. Existing routed detail screens continue to use existing routes.

### Guided actions

V10 `GuidedAction` / `GuidedActionStack` semantics are reused when an information item can safely point to an existing route or callback.

A quick action must never bypass prerequisite validation. Existing reducers/callbacks remain the mutation boundary.

### Results and continuation

V10 result/continuation presentation remains the reference for expedition/tactical completion flows. V11 may improve the surrounding information hierarchy but must not recalculate outcome values.

## 6. Architecture

Data flow:

`existing domain state/selectors → V11 screen adapter/view model → small reusable information primitives → existing route/callback`

V11 adds a presentation layer, not a new gameplay layer.

### 6.1 Semantic view model

Exact file/export names may follow repository conventions, but the following semantics are fixed:

```ts
type InformationItemState =
  | 'claimable'
  | 'active'
  | 'near_complete'
  | 'complete'
  | 'locked';

type InformationProgress = {
  current: number;
  total: number;
  label?: string;
};

type InformationItem = {
  id: string;
  title: string;
  subtitle?: string;
  category: string;
  state: InformationItemState;
  progress?: InformationProgress;
  badge?: string;
  rewardLabel?: string;
  reason?: string;
  searchText: string;
  sortRank: number;
  action?: GuidedAction;
};

type InformationSummaryMetric = {
  id: string;
  label: string;
  value: string | number;
  emphasis?: 'normal' | 'positive' | 'attention';
};

type InformationPageModel = {
  summary: InformationSummaryMetric[];
  important: InformationItem[];
  items: InformationItem[];
  filters: InformationFilterOption[];
};
```

`claimable` is a presentation state only when an existing domain explicitly says a reward/action can be claimed now. It must never be inferred from display text.

These are presentation semantics, not a requirement for one giant universal exported type.

Screen-specific adapters may use narrower types where that improves clarity.

### 6.2 Small reusable primitives

V11 should introduce or consolidate small presentation components such as:

- summary metric strip/grid,
- important/current section,
- search field,
- filter chips,
- lightweight sort control,
- compact information row/card,
- progress meter,
- state badge,
- detail panel/card,
- empty-search state,
- truly-empty state,
- locked state,
- completed state,
- one sticky primary action where materially useful.

Do **not** build one giant universal `InformationPage` component that understands every domain. Each domain keeps its own adapter/composition.

### 6.3 Search contract

Search operates only on information the current player is already allowed to see.

`searchText` may include visible title, visible subtitle, visible category, and other already-revealed labels.

It must not include secret names, undiscovered descriptions, hidden reward text, future story information, or internal canonical IDs when those would reveal hidden content.

Search should be stable and tolerant of ordinary Korean input. Case folding applies where Latin text exists.

### 6.4 Filter contract

Filters must only change presentation membership. They must never mutate domain collections or game state.

Unavailable filters should not be rendered merely to achieve visual uniformity.

### 6.5 Sort contract

Sort is added only where it reduces scanning cost.

Default ordering should prefer existing meaningful progression order unless V11 has a clear presentation benefit such as:

- claimable before non-claimable,
- near-complete before low-progress active items,
- current/incomplete before completed history.

Sort must be stable for equal ranks.

Do not invent “best” or “optimal” ranking without an authoritative basis.

## 7. Shared page hierarchy

Where applicable, the five V11 areas follow this structure:

### 7.1 Summary

A compact first-screen overview using 2–4 high-signal metrics.

Examples include claimable count, completion percentage, current attempts, or owned item count when those values already exist authoritatively.

Avoid turning summary cards into secondary dashboards containing every statistic.

### 7.2 Important / current

A small section for things worth attention now.

Only defensible signals may appear here:

- claimable reward,
- active/current objective,
- near-complete progress based on explicit progress data,
- current region/run,
- currently available existing action.

If no strong signal exists, omit the section rather than manufacturing urgency.

### 7.3 Find controls

Search, filter, and sort appear only where useful for that domain.

Controls should be compact, keyboard accessible, touch friendly, and visually subordinate to the page goal.

### 7.4 Full list

The full player-visible set remains accessible.

List rows/cards prioritize scan value:

- title,
- status,
- compact progress or primary metadata,
- one concise secondary cue.

Long descriptions belong in detail.

### 7.5 Detail

Selecting an item reveals decision-relevant information first:

1. state/status,
2. progress/current requirement,
3. reward/effect if currently visible,
4. reason if blocked,
5. primary safe action if one exists,
6. secondary/long explanation.

### 7.6 Action

A sticky action is allowed only if it saves material scrolling/searching and there is one clear primary action.

The action must call an existing authoritative callback or route.

## 8. Screen 1 — Achievements / Quests

This is the first player-facing migration because it has high repeat-check frequency and strong actionable state.

### Summary

Show authoritative counts such as:

- claimable,
- in progress,
- completed.

Do not count hidden achievements if the current UI/domain intentionally withholds them.

### Important section

Default priority:

1. claimable,
2. near-complete,
3. other active.

“Near complete” must be derived from explicit current/total progress. It must not guess based on description text.

### Filters

When supported by the authoritative item set:

- 전체,
- 수령 가능,
- 진행 중,
- 완료,
- 잠김.

Do not show a category that would leak hidden entries.

### Search

Search visible achievement names/descriptions only.

### Detail

Show objective, progress, visible reward, and status.

Claiming must use the existing claim callback.

If locked, show an authoritative reason when one exists. Offer a direct resolution route only when V10 GuidedAction routing can safely reach an existing prerequisite screen.

### Fast Flow additions

- claim directly from a selected claimable achievement using the existing callback,
- after claim, keep the user in a valid filtered/list context,
- if the selected item leaves the active filter after claim, clear selection or move focus predictably rather than showing stale detail.

## 9. Screen 2 — Records / Collection

The goal is to turn accumulated historical content into something scannable without spoiling undiscovered content.

### Summary

Use existing collection/archive progression values to show a concise completion view.

### Important section

Possible sections include recently revealed or incomplete entries **only when the domain already exposes a defensible ordering/signal**.

Do not fabricate chronology from array position if that array is not authoritative chronology.

If no valid recent signal exists, omit “최근 획득”.

### Filters

Use actual existing categories only.

### Hidden-content contract

Undiscovered entries must keep the repository's existing mystery/hidden semantics.

Search, filter counts, summary counts, sorting, accessibility labels, and detail state must not expose secret names or descriptions.

### Detail

Visible entries can show their existing definition/detail. Hidden entries show only the currently sanctioned mystery presentation.

No new persistent “viewed”, “recent”, or discovery-history fields are added.

## 10. Screen 3 — Season / Meta

Season/meta consists of the existing systems and routed surfaces present in the current application. V11 improves entry and information hierarchy without merging them into a new gameplay engine.

During implementation, the landing may include only modules that are actually present in current route wiring and whose authoritative state can be read without duplication. No module is invented to fill the layout.

### V11 responsibility

Create a presentation-level landing/overview only if it reduces navigation cost.

The landing may summarize:

- currently claimable/available season progress,
- currently relevant weekly/meta action,
- existing module availability,
- high-level progression metrics already calculated by each module.

Each module remains the source of truth for its own state.

### Explicit prohibition

V11 must not create a unified Season state object or duplicate progression across modules.

It must not calculate cross-module rewards or eligibility.

### Navigation

Module cards link through existing routes/callbacks.

Locked modules show existing conditions/reasons when available. If a safe resolution route exists, it may be offered as a secondary action.

## 11. Screen 4 — Expedition / Regions

The expedition page should become easier to compare before launch and easier to continue after a result.

### Summary

Use existing authoritative data for compact values such as:

- current/remaining attempt information,
- current or selected region/stage,
- progress/clear state where already modeled.

### Important section

Possible signals:

- current run/selected region,
- incomplete active objective,
- retryable recent result,
- clearly available next stage.

Do not invent an “optimal region” recommendation without an authoritative basis.

### Region list

Rows/cards should expose comparable existing information such as objective, state, risk/difficulty label, and visible reward label where those already exist.

Long encounter/reward explanation moves to detail.

### Fast Flow additions

- launch uses the current expedition callback,
- retry uses the existing retry/attempt flow,
- continue/home uses existing router callbacks,
- V10 change/result summary remains authoritative for completion display.

No expedition engine, reward calculation, attempt rule, or campaign objective is changed.

## 12. Screen 5 — Bag / Items

Bag information is reorganized around what the player owns and can understand quickly.

### Summary

Use actual inventory semantics, not invented inventory categories.

Possible summary metrics include owned item count or category counts only where they are meaningful and already derivable from visible inventory data.

### Filters

Filters map to real item types/categories in existing definitions.

### Ordering

Actionable/usable items may appear before inert/history-only items only if the domain already distinguishes that capability.

Do not infer “usable” from display copy.

### Search

Search visible item names/effects/categories.

### Detail

Show authoritative item effect/description and current quantity/ownership.

Gift/use actions must reuse existing callbacks and eligibility checks.

V11 introduces no new inventory consumption rules or item state.

## 13. Fast Flow additions across V11

Fast Flow is a supporting layer, not the primary architecture.

Allowed improvements:

- one primary CTA in detail/result where meaningful,
- direct existing route to resolve an understandable blocker,
- retry/continue for existing flows,
- quick action for an already-valid current task,
- recent/quick section only when an authoritative non-persistent signal already exists.

Disallowed improvements:

- bypassing eligibility,
- auto-claiming or auto-spending without the existing explicit action semantics,
- inventing “recommended” routes from weak signals,
- adding a new persistent recent-history subsystem solely for V11.

## 14. Visual Polish system

V11 should make the five areas feel related without flattening their domain identity.

### Typography

Use a consistent hierarchy for:

- page title,
- section title,
- item title,
- supporting description,
- progress number,
- reward/effect emphasis,
- metadata.

### Cards and rows

Standardize:

- padding rhythm,
- selected state,
- focus-visible state,
- active/complete/locked visual distinction,
- progress placement,
- status badge placement,
- touch target sizing.

### Progress

Progress bars/meters must communicate exact existing progress and have accessible labels.

Avoid decorative progress bars for states without measurable progress.

### States

Provide coherent presentation variants for:

- claimable,
- active,
- near-complete,
- complete,
- locked,
- empty search,
- truly empty domain.

### Motion

Use restrained transitions only. Respect reduced-motion preferences. No heavy list animation, swipe UI, or gesture-dependent navigation.

## 15. Navigation, focus, and scroll behavior

V9 `MobilePageShell` remains the page/scroll authority.

### Back behavior

Returning from detail should restore a sensible list context within the current session where possible.

Do not persist this context into the save file.

### Focus behavior

- Opening detail moves focus intentionally where needed.
- Closing/dismissing detail returns focus to its launcher/list item when practical.
- Claim/use actions that remove an item from the current filtered set must move focus to a valid next target or the list/section heading.
- Escape closes only dismissible local detail/overlay surfaces according to existing patterns.

### Scroll behavior

- exactly one primary vertical page scroll region,
- no nested scrolling list traps,
- sticky action must not obscure the final content,
- existing scroll memory behavior remains intact.

## 16. Responsive and accessibility requirements

Required mobile widths:

- 360×640,
- 390×844,
- 430px-wide devices.

Requirements:

- `100dvh`/existing mobile shell behavior preserved,
- top/bottom safe areas preserved,
- minimum practical touch target 44px,
- primary CTA generally 48–52px tall,
- long Korean labels wrap without clipping controls,
- badges must not force destructive horizontal overflow,
- search/filter/sort controls have accessible labels,
- selected filter/item state is programmatically conveyed,
- focus-visible remains obvious,
- reduced-motion remains respected,
- keyboard-only operation is supported for interactive controls.

## 17. Edge cases and safety

### Malformed state

Continue using existing domain hydration/sanitization behavior. V11 must not add a parallel repair layer.

### Empty search vs empty domain

These are distinct:

- **empty search:** data exists but the current query/filter returned zero results; provide a clear filter-reset action.
- **empty domain:** the player genuinely has no visible items; explain the empty state without pretending search caused it.

### State changes while detail is open

After claim/use/progression updates, the adapter re-evaluates against the new authoritative state.

If the selected item is no longer valid or visible, detail must close or transition safely rather than retain stale actionable data.

### Locked action

A blocked item remains blocked. The UI explains rather than enabling it.

### Hidden information

Hidden/undiscovered content stays hidden across visible text, screen-reader labels, search indexes, counts, and detail views.

## 18. Testing strategy

V11 uses TDD for each package.

### Pure adapter tests

Verify:

- deterministic important-item ordering,
- stable sort behavior,
- search behavior,
- filter membership,
- no domain mutation,
- no hidden data in `searchText`,
- lock reason/resolution behavior,
- no duplicate or fabricated route actions.

### Achievements / Quests

Verify:

- claimable → near-complete → active hierarchy,
- completed/locked filters where valid,
- claiming uses existing callback,
- post-claim selected/filter state remains valid,
- hidden achievement semantics are preserved.

### Records / Collection

Verify:

- category filtering,
- progress summary from existing values,
- hidden discovery mystery text remains hidden from search/accessibility metadata,
- recent section appears only when supported by authoritative chronology.

### Season / Meta

Verify:

- overview links only to existing modules/routes,
- module state comes from its own authoritative selector/state,
- locked modules remain locked,
- no new unified season progression calculation.

### Expedition / Regions

Verify:

- region/stage comparison uses existing definitions,
- launch/retry/continue callbacks remain unchanged,
- attempts/rewards are not recomputed,
- no invented “best” recommendation,
- result flow remains V10-compatible.

### Bag / Items

Verify:

- filters match real item semantics,
- search sees only visible item information,
- use/gift invokes existing callbacks,
- quantity/effect data is authoritative,
- no new inventory mutation path.

### Navigation/accessibility regression

Verify:

- detail open/back/focus return,
- filtered list state during session,
- selected item removal behavior,
- sticky action only when meaningful,
- one scroll region,
- last content remains reachable above safe-area/sticky footer,
- 360/390/430 responsive contracts,
- 44px touch targets,
- focus-visible,
- reduced motion,
- Korean wrapping.

### Compatibility suites

At minimum include relevant V8/V9/V10 mobile/router suites plus Tactical, Expedition, save-schema/save-resilience, and global release candidate regressions.

Actual final test counts must come from CI. No estimated counts may be reported as completed evidence.

## 19. Work packages

### Package A — Shared IA foundation

- screen adapter/view-model conventions,
- compact summary primitives,
- search/filter controls,
- item row/card,
- progress/status variants,
- detail/empty/locked presentation,
- accessibility contracts.

### Package B — Achievements / Quests

First full migration and proving ground for the shared pattern.

### Package C — Records / Collection

Second migration with explicit hidden-information safety tests.

### Package D — Season / Meta

Presentation-level aggregation/navigation across existing modules only.

### Package E — Expedition / Regions

Comparison hierarchy plus safe V10-compatible fast flow.

### Package F — Bag / Items

Inventory browsing/search/filter/detail using existing inventory semantics.

### Package G — Visual/accessibility/final regression

- consistency sweep,
- responsive fixes,
- keyboard/focus review,
- reduced-motion review,
- unrelated-diff audit,
- full release gate.

Implementation order is A → B → C → D → E → F → G.

## 20. Non-goals

V11 does not include:

- new saved UI preference/filter fields,
- router rewrite,
- a second page shell,
- game balance changes,
- reward/economy formula changes,
- achievement semantics changes,
- new inventory semantics,
- unified Season engine/state,
- customizable/reorderable dashboard,
- swipe/drag navigation system,
- heavy animation system,
- unrelated desktop redesign,
- new persistent recent-history subsystem,
- disclosure of hidden/undiscovered content.

## 21. Final gate and release

Before promotion:

1. targeted V11 tests,
2. V8/V9/V10 mobile/router compatibility,
3. Tactical/Expedition compatibility,
4. save-schema/save-resilience compatibility,
5. full test suite,
6. TypeScript,
7. production build,
8. `npm audit`,
9. diff audit for unrelated changes,
10. GitHub review threads,
11. Vercel preview status when platform quota permits.

Promotion:

1. expected-head merge V11 work branch → `integration/v3`,
2. verify exact integration SHA,
3. create integration → main release PR,
4. require fresh release-candidate CI,
5. expected-head merge → `main`,
6. require fresh main CI,
7. verify exact production deployment SHA if Vercel permits a production deployment,
8. production root HTTP verification,
9. `/api/client-telemetry` verification when publicly reachable,
10. production error/fatal runtime log check.

If Vercel quota blocks deployment, report production as BLOCKED rather than GREEN. Do not alter V11 code or Git history to work around an external quota.

Browser/mobile automation must be reported separately. If unavailable, do not claim click/scroll/screenshot verification; rely only on the actual component/CSS contracts, tests, CI, deployment metadata, HTTP checks, and runtime logs that were performed.

## 22. Definition of Done

V11 is complete when:

- all five priority areas use the approved summary/important/find/list/detail/action hierarchy where it materially applies,
- the UI is meaningfully faster to scan without hiding full player choice,
- search/filter/sort remain presentation-only state,
- no duplicated progression/reward/unlock/inventory rules are introduced,
- hidden information remains hidden in both visual and accessibility/search surfaces,
- Fast Flow actions only call existing authoritative routes/callbacks,
- common visual/accessibility patterns are consistent without a giant domain-aware universal component,
- mobile responsive/accessibility contracts are GREEN,
- full tests, TypeScript, build, and audit are GREEN,
- review threads are resolved,
- final diff contains no unrelated changes,
- integration/main promotion is exact-head guarded,
- production is claimed GREEN only with exact-SHA production evidence,
- browser automation status is stated accurately.
