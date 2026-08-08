# Puppy Maker Raising World Expansion Design

## Goal
Expand the existing 12-month Runa raising loop into a richer but still low-friction game by connecting four systems—village exploration, collectible outfits, hunting challenge, and cooking—without replacing the current schedule/training/dialogue/result/ending architecture.

## Product rule
Every new system must shorten or enrich an action the player already understands. The home must not become a menu grid. New systems reuse existing stats, mastery, memories, events, condition, and collection data wherever possible. No combat party system, online dependency, generational genetics, or second-year rewrite is included.

## Player loop
Home → monthly schedule → training → dialogue/story → growth result → exploration opportunities and ingredients → cooking/support effects → collection unlocks → next month → ending.

Exploration and cooking are supporting loops, not mandatory blockers. A player can still complete the canonical 12-month run without optimizing them.

## 1. Village exploration
Add a small set of named destinations unlocked by raising progress: Forest Path, Moonlit Garden, Village Market, Old Shrine, and Starlight Hill. Each destination has a concise description, unlock condition, deterministic reward pool, and optional Runa reaction. Exploration spends a limited monthly opportunity rather than adding energy currencies.

Rewards primarily use ingredients, gold, memories, and cosmetic discovery progress. The system must avoid random frustration: first discovery rewards are deterministic, repeat rewards may vary within a small bounded table.

## 2. Cooking
Ingredients obtained through exploration and existing activities feed a compact recipe book. Recipes use 2–3 ingredients and create consumable meals. Meals apply bounded effects to fatigue, stress, affection, condition preparation, or a small next-training modifier. Cooking is deliberately simple: no freeform crafting, timers, kitchen upgrades, or dozens of ingredient qualities.

Recipes unlock through months, exploration discoveries, and relevant mastery. The UI shows craftability directly so players do not need to inspect inventory repeatedly.

## 3. Hunting challenge expansion
Keep the existing timing-training foundation instead of building a separate combat engine. Hunting gains challenge targets with clear score bands and first-clear rewards. Challenge difficulty is derived from month and hunt mastery. Results feed ingredients, gold, memories, and cosmetic unlock progress.

This makes hunt mastery visibly useful while avoiding a second control scheme.

## 4. Outfit and collection system
Add a small curated wardrobe rather than a large equipment system. Outfits are cosmetic presentation states with unlock conditions tied to exploration, milestones, endings, and challenge clears. They do not replace Runa's canonical design and do not introduce armor/stat equipment.

Because current image assets do not contain complete alternate Runa outfit renders, the first implementation treats wardrobe entries as collectible unlocks and presentation themes/badges. It must not fake inconsistent character art. The canonical Runa sprite remains the in-game character until matching assets exist.

## 5. Home integration
Replace remaining low-value placeholder navigation with three high-value surfaces:
- Adventure: destinations, remaining monthly exploration, and first-discovery progress.
- Kitchen: craftable recipes and ingredient counts.
- Collection: memories, story discoveries, wardrobe, and endings in one collection surface.

The primary CTA remains the monthly raising action. Adventure/cooking never compete visually with the main schedule/training CTA.

## 6. State and save model
Extend GameState with additive, migration-safe fields only: ingredient inventory, discovered destinations, exploration usage for current month, unlocked recipes, cooked recipe history, meal/support state, hunt challenge clears, wardrobe unlocks, and selected presentation theme if applicable.

Save version advances while hydrateGameState supplies defaults for all legacy saves. Existing endingCollection, memories, eventHistory, mastery, personality, milestones, resources, and current screen are preserved.

## 7. Progression rules
Early months introduce Forest Path and basic recipes. Mid-run unlocks Market/Garden and more meaningful support meals. Late run unlocks Shrine/Hill, harder hunt challenges, and prestige collection rewards. Unlocks should be milestone-based and deterministic enough that a normal 12-month playthrough encounters the systems naturally.

No new feature may require grinding repeat months.

## 8. Feedback
Exploration returns a concise result card: destination → Runa reaction → reward → new discovery/unlock. Cooking returns meal → immediate stat/support change. Hunting challenge returns rank → first-clear reward → mastery/collection consequence. Collection surfaces distinguish discovered, locked-with-hint, and secret entries.

## 9. Architecture
Use focused modules under src/game for exploration, cooking, hunting challenges, and wardrobe. Keep reducer orchestration in the existing game layer, but move tables/calculation helpers into those modules. Home panel builders consume GameState and module catalogs; they do not mutate state.

UI additions reuse the existing panel architecture and current fantasy visual language. Dynamic information stays code-rendered; decorative art remains asset-driven.

## 10. Testing
Add unit coverage for unlock conditions, reward determinism/bounds, recipe crafting, inventory underflow protection, monthly exploration reset, challenge first-clear idempotency, wardrobe unlock persistence, save migration, and 12-month invariants.

Extend integration tests to prove the canonical loop still works with optional systems unused, and a second path where exploration/cooking/challenges are used across the run. Add render tests for Adventure/Kitchen/Collection states and locked/unlocked presentation.

## 11. Failure safety
Invalid destination, recipe, ingredient, challenge, or wardrobe IDs are ignored during hydration. Actions with insufficient ingredients or unavailable unlocks return unchanged state. Rewards and stat effects remain bounded. Monthly reset affects only monthly-use counters, never permanent discoveries.

## 12. Scope boundary
Included: exploration, ingredient inventory, compact recipes, meal support effects, hunt challenge progression, curated wardrobe collection, home integration, save migration, tests, responsive panel work.

Excluded: multiplayer, gacha monetization, 3v3 battle, freeform crafting, equipment stats, second-year rewrite, genetics/breeding, server backend, Live2D, new inconsistent Runa renders.

## Success criteria
A returning player should feel that the world around Runa has opened up while the number of mandatory steps remains essentially unchanged. Existing saves continue safely. The 12-month loop and endings remain authoritative. The new systems provide visible reasons to explore, improve hunt mastery, collect discoveries, and care about Runa's condition without turning the game into inventory management.