# V14 Polish Pass 3 — Scene & Flow Continuity Design

## Goal
Raise mobile play-flow coherence across Outing, Story, and shared Scene presentation without adding new game systems.

## Scope
- Outing selection → scene → interaction/result → return continuity.
- Story scene entry/exit continuity and stale overlay/state cleanup.
- Shared mobile shell consistency where evidence shows the same issue: local back control, one body scroller, safe bottom CTA, 44px touch targets, long Korean wrapping, focus-visible, and reduced-motion behavior.
- SceneDirector/SceneStage continuity for time, weather, situation, actor position/scale, and outfit presentation where existing data supports it.
- Action → Result → Next clarity by reusing ActionResultSummary/guide patterns instead of new modal systems.
- Regression coverage for 360x640, 390x844, and 430px mobile widths/heights, safe-area/bottom-nav overlap, stale state after scene transitions, and reduced motion/accessibility.

## Architecture
Use the existing SceneDirector/SceneStage, mobile router shell, scene state, and result-summary components. Add only focused adapters/classes/guards needed to keep transitions deterministic and mobile-safe. Do not introduce a new scene engine, router, animation framework, currency, menu, or progression layer.

## Data Flow
1. Player selects an Outing or Story action.
2. Existing domain state determines the scene, weather/time context, actors, and result.
3. SceneDirector/SceneStage render the scene using stable actor identity and existing presentation tokens.
4. Interaction resolves through existing game/domain ownership.
5. Existing result summary/guide presents what changed and a clear next action.
6. Exit clears transient scene/overlay state and returns to the correct parent screen with no stale scroll or selection leakage.

## Mobile Interaction Contract
- A screen may have one intentional body scroller; nested scrolling is avoided unless an existing component demonstrably requires it.
- Persistent bottom actions reserve bottom-navigation and safe-area space.
- Local back controls are present only where the user enters a sub-flow and return to the immediate parent, not an arbitrary root.
- Interactive controls maintain at least 44px touch size.
- Long Korean strings wrap without horizontal overflow.
- Focus-visible remains clear and reduced-motion disables nonessential motion/transition effects.

## Scene Continuity Rules
- Reuse stable scene actor keys across updates so time/weather changes do not remount characters unnecessarily.
- Preserve character position/scale conventions between adjacent scenes unless the scene explicitly changes composition.
- Reuse existing outfit/appearance resolution when available; no duplicate wardrobe mapping.
- Weather/time changes are presentation state, not a reason to reset unrelated interaction state.
- Exiting a scene clears transient overlay/selection state so a later scene cannot inherit stale UI.

## Outing / Story Behavior
- Outing should present a clear selected/current state before scene entry and a clear result/next action after resolution.
- Story should preserve scene identity and actor continuity while still allowing explicit chapter/beat changes.
- Disabled actions show a short nearby reason rather than relying on disabled styling alone.
- No extra confirmation modal is added when the action is safe and reversible within the existing flow.

## Error / Edge Handling
- If a scene asset is unavailable, retain the existing fallback path rather than blocking progression.
- If transient scene state is malformed or stale, fall back to the parent flow and clear the transient state instead of trapping the user in an overlay.
- Scene transitions must be idempotent under rerender/reload where existing persistence supports it.

## Testing Strategy
- Start with RED contract tests for Outing/Story transition cleanup, single-scroller/safe-bottom behavior, local back semantics, long Korean text, and stable actor continuity.
- Keep domain/game-logic tests separate; this pass tests presentation/flow contracts rather than re-testing reward calculations.
- Run targeted tests first, then full repository tests and production build.
- Promote only after branch CI and release-gate CI are GREEN, then verify main CI and Vercel production status.

## Deliberate Non-Goals
- No new currency.
- No new growth/progression system.
- No new top-level menu.
- No new scene engine.
- No complex animation framework.
- No broad router rewrite.
- No unrelated visual redesign of already-stable screens.

## Success Criteria
- Outing and Story can enter, resolve, and return without stale overlay/scroll/selection leakage.
- Shared mobile shell rules prevent CTA/bottom-nav collisions at 360x640, 390x844, and 430px targets.
- Scene time/weather/actor presentation remains visually coherent across adjacent scenes.
- Result UI clearly states what happened and what the player can do next.
- Full tests and production build pass before integration/main promotion.