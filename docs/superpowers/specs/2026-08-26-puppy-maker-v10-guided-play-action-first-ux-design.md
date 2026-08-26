# Puppy Maker V10 Guided Play & Action-First UX Design

## Status

Approved design for Issue #204.

Baseline:
- `integration/v3@0ef2dc1d2058d6bb54014dee8288ddcccec6f4f5`
- `main@fe97a2c80d3541d70e63e59d6b7ea8cc2962b496`
- V9 production tree `5cf240e3297dd9391359cfcf3b72b4fcf101d996`

Working branch:
- `work/v10-guided-play-ux`

## Goal

Make ordinary Puppy Maker play faster to understand and easier to operate on mobile by reducing menu searching, backtracking, and uncertainty about the next useful action. V10 is not a cosmetic redesign and does not replace the V9 router or page-shell architecture.

The user-facing promise is:

> The game should show what matters now, explain why, take the player directly to the relevant action, and make the next step obvious after completion.

## Product Principles

### 1. Convenience must be measurable

A V10 change is worthwhile only when it materially reduces at least one of:
- taps required to reach an intended action,
- menu scanning,
- backtracking after encountering a prerequisite,
- scrolling required to find the primary CTA,
- uncertainty about what to do after completing an action.

Features that provide only a small cosmetic or convenience gain while adding substantial implementation, testing, or maintenance cost are out of scope.

### 2. Action-first, not menu-first

Home and category pages should lead with the most useful current action. Feature lists remain available, but they are secondary to the current actionable state.

### 3. Guidance must remain authoritative

UI components must not duplicate reward rules, progression gates, Calling/Trait logic, World/Season eligibility, Tactical rules, or save-derived domain calculations.

Recommendations and prerequisite explanations must be produced by selectors/adapters that consume existing authoritative domain APIs.

### 4. Free choice remains intact

Recommendations are guidance, not automation. Weekly focus, category navigation, campaign choices, training choices, and Tactical choices remain player-controlled.

### 5. V9 remains the structural foundation

Keep:
- V8/V9 mobile router semantics,
- `MobileRouterChrome`,
- `MobilePageShell`,
- contextual back rules,
- one primary page scroll region,
- sticky action support,
- semantic visual asset slots,
- V9 safe-area and accessibility contracts.

Do not introduce a second navigation reducer or a parallel fullscreen shell.

## Architecture

V10 adds a thin guidance layer above existing domain and routing contracts.

```text
Existing domain state / selectors
        ↓
V10 guidance selectors / adapters
        ↓
Action presentation components
        ↓
Existing router callbacks / authoritative actions
```

The three responsibilities stay separate:

1. **Domain layer owns truth** — eligibility, rewards, progression, state mutations.
2. **Guidance layer owns prioritization** — what is most useful now, why, and where it routes.
3. **UI layer owns presentation** — hierarchy, CTA placement, compact/expanded information, feedback.

No UI component may recalculate domain truth merely to improve copy.

## Core Data Contracts

### Guided action

V10 should evolve the existing `HubNextAction` concept into a reusable presentation contract rather than replacing it with screen-specific conditionals.

Expected semantic shape:

```ts
type GuidedAction = {
  id: string;
  domain: 'reward' | 'weekly' | 'raising' | 'world' | 'season' | 'tactical' | 'bond' | 'records' | 'schedule';
  label: string;
  detail: string;
  route: MobileRouteIntent;
  priority: number;
  state: 'ready' | 'blocked' | 'complete';
  reason?: string;
  resolveRoute?: MobileRouteIntent;
};
```

The exact exported names may follow repository conventions, but the semantics are fixed:
- `ready`: can be acted on now,
- `blocked`: useful but requires another action first,
- `complete`: shown only when completion context materially helps the player,
- `reason`: plain-language explanation,
- `resolveRoute`: optional direct route to satisfy the prerequisite.

A blocked item without a safe authoritative resolution route shows the reason only; V10 must not invent a route.

### Action stack

Home consumes a prioritized stack:

```ts
type GuidedActionStack = {
  primary: GuidedAction;
  secondary: GuidedAction[]; // maximum two on Home
};
```

The selector, not the visual component, determines priority.

## Feature Design

## 1. Home Command Center

### Current problem

V9 has both run guidance and `hubNextAction`, but the player can still receive multiple parallel information blocks without one clear visual hierarchy.

### V10 behavior

Home leads with:
1. one primary action,
2. up to two secondary actions,
3. normal navigation below.

Primary action card includes:
- concise label,
- one-sentence reason,
- one obvious CTA,
- optional compact context such as reward availability or weekly state.

Run guidance remains visible but is demoted to context when it is not itself the current action.

### Priority

Default priority model:
1. immediately claimable reward or acknowledgement,
2. required weekly progression transition,
3. required choice / newly available progression decision,
4. time-sensitive World / Season action,
5. chosen weekly focus action,
6. default schedule/play action.

Selectors may refine priority using existing authoritative state. Presentation components must not.

## 2. Category Recommended Action

Each major category — Life, Growth, Adventure, Bond, Records — displays one recommended action before its full feature list when a meaningful recommendation exists.

The recommendation must:
- belong to the category or route clearly to the needed prerequisite,
- explain why it matters now,
- avoid hiding other features,
- use existing router callbacks.

If no recommendation is materially better than the list itself, no recommendation card is shown.

This avoids adding UI that provides no real convenience gain.

## 3. Blocked Action → Resolution Guidance

### Current V9 behavior

V9 explains disabled reasons.

### V10 extension

When the prerequisite can be resolved through an existing authoritative route, the blocked presentation becomes actionable guidance.

Examples:
- `이번 주 계획을 먼저 선택하세요` → `주간 계획 열기`
- `성장 특성이 필요해요` → route to the relevant Growth surface only if the existing domain contract can identify that surface safely
- expedition prerequisite → show missing condition and route to the relevant existing screen when available

Rules:
- never enable the blocked action itself,
- never bypass eligibility,
- never manufacture completion state,
- never duplicate the prerequisite calculation in the component.

## 4. Weekly Planner Recommendation Hierarchy

### Current behavior

Seven focuses are visually equivalent.

### V10 behavior

The Weekly Planner may surface a small recommended group above the complete choice grid.

Recommendations may use existing state signals such as:
- fatigue / recovery need,
- selected weekly/campaign context,
- available weekly event or NPC presence,
- current World / Tactical / Season progression signals.

The complete seven-choice grid remains available and authoritative.

The recommendation copy explains the relevant state; it must not claim optimality when the game has no authoritative basis for that claim.

Recommended choices are shortcuts to the same existing `onSelectFocus` action, not a new mutation path.

## 5. Sticky Primary CTA Adoption

Use the existing `MobilePageShell.stickyAction` on screens where the primary action is otherwise likely to require meaningful scrolling or searching.

Candidate screen classes:
- reward claim pages,
- choice confirmation pages,
- training/start pages,
- expedition launch/preparation,
- completion/continue pages.

Do not add sticky CTAs to information-only screens or screens where the action already remains naturally visible. This prevents visual clutter and duplicate controls.

Requirements:
- bottom safe area respected,
- no content obscured by sticky footer,
- one primary action per sticky area,
- secondary actions remain in normal flow unless essential.

## 6. Result → Continue Flow

Completion screens should answer two questions in order:
1. What changed?
2. What is the useful next action?

Examples:
- reward claim → show received reward → next relevant action or contextual back,
- training result → show stat/progression deltas → continue weekly flow or Home,
- expedition result → show outcome → return to map / next available expedition action,
- Tactical result → preserve existing Tactical/Expedition route semantics while clearly exposing the continuation action.

The continuation route must come from router/domain context. A result screen must not independently decide navigation by reimplementing game progression.

## 7. Change-First Feedback

Result feedback emphasizes deltas before full totals.

Example presentation:

```text
훈련 완료
힘 +3
피로 +8
Calling 숙련도 +12
```

Full current values can appear below as secondary detail.

Implementation rule:
- derive UI deltas from authoritative pre/post action state or existing result payloads,
- never recalculate the reward formula in the UI,
- if reliable pre/post evidence is unavailable, show the existing authoritative result rather than guessing a delta.

## 8. Progressive Information Density

Primary mobile surfaces should visually prioritize:
- current context,
- current action,
- immediate result.

Secondary information can be placed in compact expandable/detail sections:
- full stats,
- completed history,
- long explanations,
- archival detail.

Do not hide information that is required to make the current decision safely.

## Navigation and Return Contracts

V9 return semantics remain authoritative:
- ordinary feature back → origin category,
- active play exit uses guarded router behavior,
- completed real play cycle may return Home where already defined,
- expedition internal map/battle/result transitions remain feature navigation, not router-back replacements.

V10 continuation CTAs must call the same router/domain callbacks rather than creating a separate route stack.

## Accessibility and Mobile Constraints

Must preserve or improve:
- 360×640,
- 390×844,
- 430px width,
- `100dvh`,
- top and bottom safe areas,
- 44px minimum touch targets,
- 48–52px primary CTA target where practical,
- long Korean wrapping,
- keyboard navigation,
- visible `:focus-visible`,
- Escape behavior where dismissible,
- focus return,
- `prefers-reduced-motion`,
- one primary vertical scroll area per mobile page.

Sticky actions must not create nested vertical scroll traps.

## Error and Edge-State Behavior

- Non-finite or malformed display values use existing sanitizers or established safe presentation behavior; V10 does not create new progression repair logic.
- If a guidance selector cannot establish a safe route, show explanation without a direct resolution CTA.
- If no high-value recommendation exists, fall back to the standard category/home presentation rather than inventing weak recommendations.
- A stale recommendation must never mutate state directly; mutation remains behind existing callbacks which revalidate authoritative state.

## Testing Strategy

V10 follows TDD.

### Contract tests

Add focused tests for:
- deterministic action priority,
- primary + maximum-two-secondary Home stack,
- no duplicate action routes when avoidable,
- blocked reason and optional resolution route,
- fallback when no resolution route exists,
- weekly recommendations do not remove any of the seven choices,
- sticky CTA presence only on selected action-oriented pages,
- result delta presentation uses supplied/observed authoritative values,
- continuation uses existing router callbacks.

### Navigation regression

Retain V8/V9 tests and add scenarios such as:
- Home primary reward → claim → next action,
- Home weekly planning → choose focus → recommended action,
- blocked action → resolution screen → back/continue without losing category context,
- training result → continuation,
- expedition result → map → contextual back,
- Tactical result → correct return route.

### Responsive/accessibility

Contract/source/component tests cover:
- 360×640,
- 390×844,
- 430px,
- sticky footer safe-area spacing,
- scroll-to-bottom reachability,
- touch targets,
- keyboard focus state,
- reduced motion.

### Final gate

Before promotion:
1. targeted V10 suites,
2. router / V8 / V9 compatibility suites,
3. Tactical and Expedition compatibility suites,
4. full test,
5. TypeScript,
6. production build,
7. npm audit,
8. PR review threads and Vercel preview check,
9. expected-head guarded merge to `integration/v3`,
10. integration full CI,
11. release PR to `main`,
12. main CI,
13. Vercel production exact SHA verification,
14. production root and `/api/client-telemetry`,
15. runtime fatal/error log inspection.

Actual test counts must be reported from CI, never estimated.

## Work Packages

### Package A — Guidance Model
- evolve authoritative action selector contracts,
- Home action stack,
- blocked/reason/resolution semantics,
- no visual redesign yet.

### Package B — Home and Category Hierarchy
- Command Center presentation,
- category recommended-action slots,
- compact context hierarchy.

### Package C — Weekly and Prerequisite UX
- Weekly Planner recommendation group,
- blocked → resolve navigation,
- preserve all existing choices.

### Package D — Action and Result Flow
- selective sticky CTA adoption,
- change-first result feedback,
- contextual continuation routes.

### Package E — Final Mobile / Accessibility Pass
- viewport sizes,
- Safe Area,
- scrolling,
- keyboard/focus,
- reduced motion,
- legacy/mobile compatibility.

## Out of Scope

V10 will not add:
- save-schema fields for UI preferences,
- a new game reducer or duplicate domain reducer,
- swipe-only navigation,
- gesture shortcuts that lack equivalent controls,
- re-orderable/customizable dashboards,
- user-authored recommendation rules,
- a new router/navigation stack,
- broad animation redesign,
- broad theme/art replacement,
- gameplay economy or Tactical engine rewrites.

## Release Strategy

Required promotion path:

```text
work/v10-guided-play-ux
→ integration/v3
→ main
→ production
```

No force push.
No direct work → main merge.
Expected-head guards are required for promotion merges.

## Definition of Done

V10 is complete only when:
- action guidance is selector-driven rather than duplicated in components,
- Home has one clear primary and at most two secondary actions,
- meaningful blocked states explain and, where safe, route toward resolution,
- Weekly Planner recommendations preserve all player choices,
- selected action screens use sticky CTAs without scroll obstruction,
- result screens prioritize authoritative changes and offer correct continuation,
- V8/V9 navigation/return contracts remain GREEN,
- mobile/accessibility gates are GREEN,
- full CI/build/audit are GREEN,
- integration and main are promoted through the required path,
- production deployment metadata matches exact `main` SHA,
- production HTTP/telemetry/runtime-error checks are GREEN.
