# V14 Polish Pass 4 — Full Mobile Playability & Presentation

Date: 2026-08-29
Branch: `work/v14-polish-pass-4`
Target: `integration/v3` → `main` → production

## 1. Goal

Raise the existing V14 game from a collection of individually polished screens to a consistently playable mobile experience. This pass prioritizes flow continuity, viewport safety, readable hierarchy, predictable back/close behavior, single-scroller overlays, actionable result states, and visual continuity between scenes.

The pass must improve the current systems without introducing a new progression system, currency, menu family, router, animation framework, or alternate gameplay loop.

## 2. Success criteria

A player should be able to move through the highest-frequency paths on 360×640, 390×844, and 430px-class mobile viewports without hidden controls, nested-scroll traps, stale overlays, ambiguous next actions, or bottom-navigation collisions.

The following routes are authoritative for this pass:

1. Home → Training → Result → Home/next action
2. Home → Outing → Scene → Result → Home
3. Home → Story/Archive → read/inspect → return
4. Home → Guardian Expedition → stage/party → Build Editor → Start → Tactical → Result → Retry/Continue
5. Home → Raising/World/Season/Sanctuary overlays → inspect/action → return

The scene identity shown to the player must remain coherent across those transitions: location, weather, runtime phase, actor identity, actor scale/placement, and outfit presentation must not visibly jump because of unrelated UI transitions.

## 3. Design principles

### 3.1 One viewport, one primary scroller

Full-height routed screens and modal-like overlays should not require the browser body, overlay root, and content list to scroll independently. Each large surface gets a stable header/chrome region and one explicit body scroller. The bottom action area must remain reachable above persistent mobile navigation and safe-area insets.

### 3.2 Action → Result → Next

Every major interaction should answer three questions with existing data:

- What just happened?
- What changed or was earned?
- What can I do next?

Do not add confirmation modals merely to make the flow feel explicit. Prefer existing result-summary and CTA patterns. Use live-region announcements only for meaningful state changes.

### 3.3 Local navigation before global escape hatches

When a player is inside a multi-step flow, the nearest meaningful back action should be visible and predictable. `← 이전 화면` or flow-specific wording should return to the immediately preceding local step where that concept exists. Global Home navigation remains available where the existing shell provides it, but must not compete with or obscure the local control.

### 3.4 Existing game logic remains authoritative

UI may expose readiness, disabled reasons, selection state, and outcomes, but must not duplicate eligibility, reward, difficulty, tactical, progression, save, or campaign rules. Existing selectors/runtime helpers remain authoritative.

### 3.5 Existing scene system remains authoritative

Reuse `SceneDirector`, `SceneStage`, existing scene/environment metadata, actor IDs, and available asset/fallback rules. No second scene renderer and no separate weather/time system.

## 4. Scope

### 4.1 Home / Hub

- Re-check top HUD, shortcut lane, goal card, character-safe area, dialogue, primary CTA, promos, and bottom navigation as one composition.
- Preserve current character-safe HUD work.
- Prevent long Korean copy from producing horizontal drift or covering primary controls.
- Keep major sheets on a sticky/local header + one bounded body scroller.
- Keep compact 360×640 layouts useful by reducing low-priority detail before reducing touch targets.
- Preserve 44px minimum actionable targets, focus-visible feedback, safe areas, and reduced-motion handling.

### 4.2 Training

- Harmonize Hunt, Magic, and Herb instruction, progress, success/failure, remaining-step, and completion hierarchy.
- Preserve existing difficulty and reward ownership.
- Make the completion state clearly transition into result/next action rather than feeling like a dead end.
- Reduce repeated decorative movement on short repeated sessions; gameplay-significant timing/motion is not removed.
- Ensure 360×640 does not push the active control or finish CTA below visible bounds.

### 4.3 Outing

- Preserve current stale-overlay fix: Home sheet must close before the activity handoff.
- Verify selection → scene → result → Home is one continuous state path.
- Prevent stale selected location, scroll position, or result UI from bleeding into a fresh outing.
- Use scene metadata and existing actor/outfit presentation consistently.
- Prevent repeated taps from double-triggering a transition where an action is already resolving.

### 4.4 Story / Memory / Archive

- Keep archive/history read-only in V14; no replay subsystem is introduced.
- Improve mobile reading density, title hierarchy, long paragraph wrapping, and current-story versus historical-record distinction using existing data.
- Preserve a clear local return action and predictable focus restoration for overlay/archive surfaces.
- Do not fabricate missing story state merely for presentation.

### 4.5 Guardian Expedition

- Re-verify selection → readiness → Build Editor → Start → Tactical as an end-to-end UI contract.
- Start remains visible above bottom navigation and safe-area space.
- Disabled state must have an immediate text reason when the runtime already exposes the reason.
- Party/stage/current selection must be visually and semantically clear.
- Returning from Build Editor must restore the correct expedition step without stale or duplicated setup state.
- Re-entry after Tactical/result must not inherit transient scroll or selection UI that belongs to the previous screen instance.

### 4.6 Build Editor

- Improve density for Leader, Outfit, Weapon, Defense, and Accessory selection without expanding the system.
- Preserve portal-based placement above global mobile chrome.
- Preserve one internal body scroller and local back action.
- Current item versus candidate must be identifiable without relying on color alone.
- Signature/Preferred/Common semantics remain text/icon assisted.
- Avoid redundant interaction when only one valid choice exists.
- Do not introduce a Save button when existing state already autosaves/commits through the current flow.

### 4.7 Tactical

- Rebalance visual hierarchy of combat state, unit/target state, cards, Ultimate, AUTO, logs, and bottom actions for small screens.
- Do not alter combat engine rules, AI selection rules, resource costs, victory logic, or reward logic.
- Keep target legality and disabled state understandable before a tap when existing runtime state can explain it.
- Ensure result → Retry/Continue remains reachable and does not collide with persistent navigation or safe areas.
- Preserve the completed-stage retry behavior already hardened elsewhere.

### 4.8 Sanctuary / Raising / World / Season major overlays

Apply the same interaction contract where the existing component structure safely supports it:

- initial focus on a meaningful control
- Escape/back behavior appropriate to dismissible versus mandatory surfaces
- Tab containment for modal surfaces
- launcher focus restoration after close
- sticky/local header or reachable home-return chrome
- one body scroller
- safe-area-aware viewport bounds
- 44px targets
- long Korean wrapping
- reduced-motion compatibility

Mandatory acknowledgement/choice screens may intentionally block Escape; this must remain explicit in tests.

### 4.9 Scene continuity

- Preserve actor identity with stable actor IDs.
- Keep location/weather/runtime-phase metadata attached to the directed scene.
- Avoid actor scale/position discontinuities caused only by switching between Home, Training, Outing, Story, or results.
- Keep outfit presentation aligned with current authoritative character equipment where the existing scene adapter already supports it.
- Reuse existing assets and fallback behavior. Do not add a new asset pipeline.

## 5. Shared mobile layout contract

The regression layer should explicitly cover:

- width 360 / height 640
- width 390 / height 844
- 430px-class width
- `100dvh` where supported, while preserving existing fallback behavior
- top and bottom `env(safe-area-inset-*)`
- persistent bottom-nav reservation
- no horizontal overflow from long Korean text
- one intended vertical scroller per large overlay
- sticky/reachable local header
- primary CTA not hidden by browser or app chrome
- 44×44 minimum interactive controls where practical
- `:focus-visible`
- keyboard round-trip for modal surfaces
- `prefers-reduced-motion: reduce`
- disabled state plus visible reason where relevant
- stale-state reset after leaving and re-entering a flow

## 6. State and data flow

This pass should remain presentation-first. Components consume existing runtime state and selectors, derive presentation labels/readiness, and call existing callbacks/actions.

Expected flow pattern:

`authoritative state/selector → screen presentation → user action → existing callback/action → result/runtime state → result summary/next CTA`

The pass must not create parallel ledgers or shadow state for eligibility, rewards, progression, tactical outcomes, story history, weather, or equipment. Temporary UI state is permitted only for interaction concerns such as open/closed panel, selected tab, local pending transition, or focus restoration.

When leaving a flow, transient UI state that should not survive re-entry must be reset at the owning component boundary rather than sanitized globally.

## 7. Accessibility and interaction semantics

- Use semantic buttons for tappable actions.
- Use `aria-current`, `aria-pressed`, `aria-disabled`, or descriptive state text where they match the existing interaction.
- Use `role="status"` / `aria-live="polite"` for non-urgent result/status changes, not for constantly changing combat noise.
- Keyboard focus must not disappear behind a closed overlay.
- Color must not be the only signal for current/selected/preferred/signature state.
- Reduced-motion mode removes decorative transitions/animations but does not disable timing that changes gameplay rules.

## 8. Error and edge-state behavior

The UI should expose existing runtime failure reasons instead of replacing them with generic disabled buttons. When the runtime cannot start an Expedition, perform a Training action, or accept a Tactical action, the existing cause should be surfaced when available.

Malformed saved/game state continues to be handled by existing game/save resilience code. This pass does not introduce a new sanitation layer. UI must remain tolerant of missing optional presentation data and use established fallbacks.

Repeated rapid taps must not cause duplicate navigation or duplicate result commits. Where the current callback is synchronous and idempotent, no artificial delay is added; where a transition already has a resolving/pending state, the UI should respect it.

## 9. Testing strategy

Implementation proceeds TDD-first in bounded slices.

### 9.1 New/extended contract tests

Add or extend regression contracts for:

- shared V14 mobile viewport/safe-area/long-copy behavior
- Home panel single-scroller/local-back behavior
- Training feedback/result/short-height CTA behavior
- Outing close-before-handoff and re-entry stale-state behavior
- Story/archive local return and reading density
- Expedition readiness/disabled reason/Build Editor return/Start visibility
- Build Editor current-versus-candidate semantics and single-choice behavior
- Tactical short-height hierarchy and result CTA safety
- Sanctuary/Raising/World/Season modal focus/back/scroll consistency
- Scene identity/environment/reduced-motion continuity

### 9.2 RED discipline

Each behavior change begins with a test that fails for the intended missing contract. If a RED exposes an invalid assumption about current game rules, correct the test rather than adding fictitious runtime states.

### 9.3 Gate order

1. targeted tests for the slice
2. related UI/flow suites
3. full repository test suite
4. TypeScript/production build through the repository build command
5. PR CI GREEN
6. Vercel preview status when available
7. merge to `integration/v3`
8. integration CI GREEN
9. release PR to `main`
10. main CI GREEN
11. production Vercel deployment SUCCESS
12. compare `integration/v3` and `main` trees; release-only merge ancestry may differ, code files must not

No GREEN or production-complete claim is made without fresh evidence.

## 10. Rollout strategy

Keep changes on `work/v14-polish-pass-4` and open a feature PR against `integration/v3`. Prefer several reviewable commits/slices inside the same branch rather than independent lane branches. This retains the project's single-room sequential workflow and reduces composite/handoff cost.

The branch may include tests, TSX, and CSS across the listed surfaces, but unrelated refactors are excluded. If a component's structure makes a small polish require a risky rewrite, document and defer that sub-item unless it blocks the authoritative user flow.

## 11. Non-goals

This pass does not add:

- new currency/economy
- new growth/progression tree
- new combat engine rules
- new campaign/story content
- story replay
- new menu family
- new router architecture
- new save schema
- new animation framework
- new scene/weather subsystem
- broad component-library rewrite
- balance tuning that changes player power or rewards

## 12. Completion definition

V14 Polish Pass 4 is complete only when the agreed high-frequency mobile flows have their regression contracts, feature CI is GREEN, the feature is merged to `integration/v3`, release gate is GREEN, `main` is GREEN, production deployment reports success, and no code-file drift remains between the integrated release tree and `main`.