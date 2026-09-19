# V18 Open Adventure Reconstruction — Architecture Diagnosis

## Target loop

Explore freely → notice something interesting → choose whether to investigate → fight / solve / traverse → gain a capability, resource, item, or world fact → reach a new vantage point → choose a new destination.

The world, not a quest arrow or menu stack, should be the primary navigation surface.

## KEEP

- V3 persistent state and hydration/sanitization.
- World history / current facts / inherited facts.
- NG+ handoff and legacy echoes.
- Fifth Path eligibility and seasonal commit state.
- Four companion identities, bond levels, and combination-ultimate definitions as combat design data.
- Equipment instance / evolution data.
- Expedition crafting materials and recipes as economy data.
- Campaign affinities, major choices, fail-forward outcomes, and world facts.

## REWORK

- MobileExplorationScene: useful collision/input lessons, but it is a top-down 2D scene and cannot be the new core runtime.
- Tactical battle: card/turn resolution becomes a source of action definitions, companion roles, status ideas, and balance values; moment-to-moment combat must become real-time.
- Tactical AI: archetype intent is reusable, but turn selection must become perception + state-machine behavior.
- Expedition bosses: rewards and IDs survive; actual bosses need authored patterns, phases, tells, arena interaction, and traversal unlocks.
- world-event: definitions survive, but events must become in-field actors/state changes rather than monthly numeric bonuses.
- Quests: contract/history persistence can survive, but world discovery and environmental clues should replace tracker-first routing.
- Inventory/equipment: data survives, acquisition and use must become contextual world gameplay.
- Existing outing/expedition maps: location themes survive, maps must be rebuilt as dense traversable regions.

## REMOVE FROM THE CORE LOOP

- Category/menu selection as the first action before exploration.
- Quest-arrow/tracker-driven navigation as the default.
- Auto battle or card selection as the default combat experience.
- Stage/wave progression as the primary world structure.
- Separate puzzle/minigame screens for interactions that can exist physically in the world.
- Large permanent HUD panels that tell the player where to go.

Legacy screens may remain temporarily as compatibility surfaces while the new runtime replaces them.

## New module boundaries

- adventure3d/PlayerController
- adventure3d/CameraController
- adventure3d/FieldDefinition
- adventure3d/InteractionSystem
- next: CombatSystem, EnemyAI, EnvironmentSystem, WorldEventSystem
- existing save/meta layers remain outside moment-to-moment runtime

## Vertical Slice 01 — Dawnreach Meadow

First complete unit:
- camera-relative acceleration/braking movement
- sprint with stamina cost
- jump/gravity/landing
- sloped terrain height
- free orbit camera with pitch and zoom limits
- perspective 3D-coordinate renderer with no new engine dependency
- three visible competing landmarks at spawn
- at least six optional discoveries between major landmarks
- no minimap or quest arrows
- high observation point with genuinely higher terrain
- outing routes directly into this runtime

Next implementation unit:
real-time attack / dodge / hit reaction + perception-driven enemy camp AI inside the same field.
