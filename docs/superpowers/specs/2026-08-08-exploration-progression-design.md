# Exploration Progression Design

## Goal
Turn outings from one-click rewards into a repeatable exploration loop with location levels, location-specific random events, and permanent hidden discoveries.

## Scope
- Keep the existing three outing locations: forest, village, lakeside.
- Add exploration XP and level 1-5 per location.
- Add deterministic event selection driven by location, level, personality/condition, and a supplied random roll.
- Add six events total, two per location.
- Add six permanent hidden discoveries, two per location.
- Show exploration level/progress and the latest event/discovery inside the existing outing popup.
- Add exploration memories/achievements only where they reuse the existing achievement and memory systems.
- Preserve existing inventory rewards and outing stat/personality effects.
- Preserve legacy save compatibility.

## Non-goals
- No separate map screen.
- No real-time movement or combat.
- No new currency.
- No shop or equipment system.
- No painterly scene/background implementation in CSS. Scene art remains a future image-asset task.

## Data model
Add `explorationXp: Record<OutingLocationId, number>` and `discoveries: DiscoveryId[]` to `GameState`.

`explorationLevel(xp)` thresholds: Lv1 0, Lv2 3, Lv3 7, Lv4 12, Lv5 18.

Each outing grants 1 exploration XP. A rare event may grant one extra XP or an item/stat bonus.

## Events
Forest: `glowing_tracks`, `ancient_tree`.
Village: `street_performance`, `wand_repair`.
Lakeside: `silver_fish`, `quiet_breeze`.

Events are selected from eligible entries by weighted roll. Level 1 has the common event; level 3 unlocks the second event. A no-event weight remains so not every outing produces a special event.

## Discoveries
Forest: `moon_feather`, `star_mushroom`.
Village: `tiny_bell`, `old_spellbook`.
Lakeside: `glass_shell`, `wind_crystal`.

The first discovery for a location becomes eligible at Lv2; the second at Lv4. Discovery is not guaranteed: event selection can return a discovery candidate only when the level threshold is met and it has not been collected. Permanent discoveries never duplicate.

## UI
Reuse the existing layered-home outing popup. Each location row shows `Lv.N`, XP progress, visit state, and a single action button. After an outing, the popup stays open and shows the latest event/discovery result at the top. The collection summary includes `발견물 x/6`.

## Testing
TDD coverage must include level thresholds, deterministic event selection, discovery uniqueness, legacy hydration, XP persistence, and no regression to the existing outing rewards/visit memories.
