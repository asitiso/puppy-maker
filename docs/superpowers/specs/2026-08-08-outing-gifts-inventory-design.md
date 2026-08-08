# Outing, Gifts, and Inventory Update Design

## Goal

Turn the existing static `outing` and `bag` home buttons into real game systems that deepen the relationship loop without adding a large navigation surface.

## Scope

### Outing locations

Three reusable locations:

- `forest` — 별빛 숲
- `village` — 마법 마을
- `lakeside` — 바람 호숫가

Each outing costs stamina through fatigue, applies a small personality/stat effect, may award one item, and records a first-visit memory.

### Inventory and gifts

Three consumable gift items:

- `star_cookie` — 별빛 쿠키: affection +6, stress -4
- `herb_tea` — 허브티: fatigue -8, calmness +2
- `fox_charm` — 여우 부적: affection +3, courage +2

Inventory is stored as integer quantities. Gifts are consumed exactly once per use. Invalid or zero-quantity uses do nothing.

### Memories

Add:

- `first_outing`
- `forest_memory`
- `village_memory`
- `lakeside_memory`
- `first_gift`

Memories stay deduplicated.

### Achievements

Add two claimable achievements using the existing reward system:

- `little_explorer` — visit all three outing locations; reward 300 gold
- `thoughtful_giver` — give the first gift; reward 2 gems

### Home UI

Reuse the current popup panel. Do not create a new full-screen route.

- `외출` panel shows the three locations and a concise effect hint.
- Tapping a location immediately performs the outing and closes or refreshes the panel with current state.
- `가방` panel shows owned quantities and a `선물하기` action for each consumable.
- `교감` panel includes outing-memory count alongside relationship and collection data.

### Starting inventory

To make the feature testable without a shop, legacy and new saves receive:

- star_cookie: 2
- herb_tea: 1
- fox_charm: 1

Existing saves hydrate these defaults only when the inventory field is missing. If inventory exists, its values are preserved and sanitized.

## Architecture

Create `src/adventure.ts` for outing definitions, inventory definitions, and pure helper functions. `game.ts` owns persistent `GameState` and reducer actions, importing rules from `adventure.ts` only where circular dependencies can be avoided. If type coupling becomes awkward, keep lightweight IDs/types in `game.ts` and pure definitions in `adventure.ts`.

New reducer actions:

- `{ type: 'GO_OUTING'; location: OutingLocationId }`
- `{ type: 'GIVE_GIFT'; item: GiftItemId }`

No new `Screen` values are required.

## Data model additions

`GameState` gains:

- `inventory: Record<GiftItemId, number>`
- `visitedOutings: OutingLocationId[]`

Hydration sanitizes quantities to non-negative integers and filters unknown outing IDs.

## Testing

TDD coverage must prove:

1. legacy save hydration adds starting inventory and empty visited outings;
2. malformed inventory is sanitized;
3. outing applies correct effects and first-visit memory once;
4. repeat outing does not duplicate memory;
5. deterministic item reward is added;
6. gift consumes one item and applies effects;
7. zero-quantity gift is a no-op;
8. explorer and giver achievements become eligible at correct thresholds;
9. rewards remain claimable exactly once through existing achievement action;
10. existing V2 tests continue passing.

## Non-goals

- no shop yet;
- no currency pricing for outings;
- no animated map;
- no new background generation in this code update;
- no equipment slots;
- no random loot rarity system;
- no new full-screen route.
