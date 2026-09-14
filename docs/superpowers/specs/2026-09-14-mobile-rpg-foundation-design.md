# Mobile RPG Foundation Design

**Status:** Approved direction, implementation starting

## Goal

Convert puppy-maker's current scene-card / text-panel outing flow into a mobile-first exploration loop where the player directly moves Runa through a world space, the camera follows, nearby objects and NPCs become interactable, and story beats are delivered through illustrated frame-style story moments instead of long prose panels.

This spec covers the first production vertical slice only. It establishes reusable runtime primitives and replaces one outing entry flow without rewriting unrelated progression, saves, battle, season, bond, or NG+ systems.

## Product principles

1. **Mobile first, desktop compatible.** The primary target is a phone held in portrait or landscape. Touch targets, safe areas, viewport height, thumb reach, and low-height landscape layouts are first-class constraints.
2. **Exploration before menus.** The player should discover interactions by moving through space rather than selecting a location from a list whenever the exploration runtime is active.
3. **World changes communicate story.** Relationship and world-state changes should increasingly appear as actor placement, object state, opened routes, and visual changes instead of explanatory paragraphs.
4. **Short text, visual story frames.** Story presentation uses a framed illustration layer with concise dialogue/caption copy. It must never become a full-screen text wall.
5. **Reuse game state.** Existing GameState, world facts, bond, campaign, save/reload, and outing commit behavior remain authoritative. The exploration runtime is a presentation/input layer, not a second game-state engine.
6. **No game-engine dependency in this slice.** Keep React/Vite. Build a bounded deterministic 2D exploration layer that can later be replaced internally without changing callers.
7. **Accessible fallbacks.** Keyboard input, reduced motion, visible focus, semantic buttons, and readable contrast remain supported.

## Scope

### In scope

- Reusable exploration data model for a bounded 2D world.
- Mobile joystick and action button.
- Keyboard movement fallback.
- Camera follow with clamped world bounds.
- Walkable world bounds and rectangular collision obstacles.
- Proximity interaction selection.
- Mobile HUD showing location, objective, and contextual action.
- Story-frame overlay with original vector illustration assets and concise dialogue/caption presentation.
- One polished forest vertical slice that proves: move -> discover -> interact -> story frame -> outing commit -> visible world response.
- Integration entry from the existing outing panel into the new forest exploration experience.
- Existing outing callback remains the only progression commit for the slice.
- Automated tests for pure movement/camera/interaction logic and integration wiring.

### Out of scope for this slice

- Combat rewrite.
- Seamless travel across all nine locations.
- Inventory redesign.
- Quest-system schema rewrite.
- Full NPC schedules.
- Physics engine.
- Network/multiplayer.
- Replacing existing save format.

These become follow-up slices only after this foundation is stable.

## Architecture

### `src/exploration/exploration-types.ts`

Defines the isolated runtime contract:

- `Vec2`
- `WorldBounds`
- `CollisionRect`
- `ExplorationInteractable`
- `ExplorationWorldDefinition`
- `ExplorationPlayerState`
- `ExplorationStoryFrame`

Coordinates are world-space pixels, not percentages. The first forest world is larger than the viewport so camera following is meaningful on mobile.

### `src/exploration/exploration-runtime.ts`

Pure deterministic functions only:

- normalize directional input
- resolve movement against bounds/obstacles
- compute camera position
- find nearest interactable inside an interaction radius

No React state or timers. This keeps the hardest behavior easy to test.

### `src/exploration/MobileJoystick.tsx`

Pointer/touch control optimized for one-handed mobile play. The joystick tracks pointer capture, emits a normalized direction, and springs to center on release/cancel. It is hidden when the story frame blocks movement.

### `src/exploration/StoryFrameOverlay.tsx`

An illustrated frame layer that shows:

- scene art
- optional speaker portrait / identity
- one short caption or dialogue passage
- a single primary continue/close action

It traps neither the entire application nor progression; closing returns control to the same exploration world. The first slice uses original SVG art stored in `public/assets/exploration/forest/`.

### `src/exploration/MobileExplorationScene.tsx`

Owns transient exploration state only:

- player world position/facing
- held movement direction
- camera position
- active/nearby interactable
- active story frame
- one-shot commit guard

It receives a world definition and callbacks. It does not mutate GameState directly.

### `src/exploration/forest-world.ts`

Forest-specific data and story content:

- world dimensions
- start position
- obstacles
- three interactables: glowing tracks, old tree, exit marker
- forest objective copy
- story-frame definitions
- asset references

The glowing-tracks interaction is the progression interaction. When the story frame is completed, it calls the existing `onOuting('forest')` once. Old tree is optional flavor/worldbuilding and does not commit progression. Exit closes the exploration slice.

### `src/scene/OutingSceneFlow.tsx`

Forest becomes the first exploration-backed outing. Village and lakeside remain on existing SceneStage during this slice, limiting risk while giving the player a clearly new play experience immediately.

## Mobile layout

### Portrait

- World fills the viewport (`100dvh`) behind safe-area aware controls.
- Objective card stays in the upper-left safe region.
- Joystick lives bottom-left in thumb reach.
- Action button lives bottom-right.
- Story frame occupies the lower-middle / center while leaving visual context around it.
- Interaction prompt never overlaps joystick/action controls.

### Landscape / low-height

- Objective card collapses to one line.
- Joystick and action controls shrink modestly but remain at least 52px interactive targets.
- Story frame changes to a side-by-side art/text composition where height is limited.
- No bottom UI relies on fixed pixels alone; safe-area insets are included.

## Visual direction

The slice uses a warm painterly-fairytale vector direction that belongs to puppy-maker, without copying Zelda art or UI. The forest world uses layered SVG scenery: soft moss ground, path, trees, stones, luminous plants, and a star-glow interaction motif. Story frames use an ornate but readable wooden/gold picture frame and a dedicated illustrated inset.

Assets are semantic and replaceable. CSS positions world objects; SVGs provide visual identity. The first implementation favors a coherent small set over a large inconsistent asset library.

## Input and movement

- Joystick and keyboard feed the same normalized input function.
- Movement speed is time-based.
- Diagonal input is normalized so it is not faster.
- Movement resolves X and Y independently to allow sliding along obstacles rather than sticking.
- World position is clamped to world bounds.
- Interaction target is the nearest enabled interactable inside its radius.
- Story frame pauses movement and disables world action controls.

## Data flow

1. LayeredHome outing panel selects forest.
2. Existing app transition opens `OutingSceneFlow` for `forest`.
3. `OutingSceneFlow` renders `MobileExplorationScene` for forest instead of SceneStage.
4. Player moves through local transient world state.
5. Proximity to glowing tracks enables contextual action.
6. Action opens `StoryFrameOverlay`.
7. Completing the frame invokes `onOuting('forest')` exactly once.
8. Existing reducer/game progression remains authoritative.
9. The exploration scene displays a completed visual state locally until the parent transition finishes or user exits.

## Error and edge behavior

- Invalid or non-finite delta times are ignored/clamped by pure runtime helpers.
- Player cannot leave bounds or enter obstacles.
- Pointer cancel/lost capture resets joystick direction.
- No nearby interactable means action button is disabled and announces a neutral prompt.
- Progression callbacks are protected by a ref so repeated taps cannot double-commit.
- Reduced-motion users get instant/short camera/overlay transitions without pulsing or floating animation.
- Asset failure does not block interaction; semantic labels and world geometry still function.

## Testing strategy

### Pure runtime tests

- diagonal normalization
- bound clamping
- obstacle collision and axis sliding
- camera centering and edge clamping
- nearest-interactable selection

### Component/source contract tests

Following existing repository patterns, verify:

- mobile scene exposes semantic joystick/action controls
- safe-area and `100dvh` rules exist
- story overlay uses dialog semantics and concise content slots
- forest world exposes all required interactions
- OutingSceneFlow routes forest to the exploration scene while preserving existing flow for village/lakeside
- one-shot progression commit guard is present and exercised

### Regression gate

- targeted exploration tests
- existing scene/outing tests
- full test suite
- TypeScript/build
- PR CI

## Success criteria

The slice is successful when, on a phone-sized viewport, a player can enter the forest outing, move Runa with a thumb joystick, have the camera reveal a world larger than the screen, approach a visual clue, receive an obvious contextual action affordance, open an illustrated story frame with minimal text, close/continue it, and trigger the existing outing progression exactly once without using the old location-card interaction model.
