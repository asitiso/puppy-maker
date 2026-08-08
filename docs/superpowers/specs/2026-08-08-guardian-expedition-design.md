# Guardian Expedition Design

## Goal
Transform the existing raising game into a larger adventure-driven progression game without replacing the current monthly training loop. Guardian Expedition adds a persistent expedition layer that makes training, condition, mastery, talents, exploration, story, collection, yearly ambitions, and long-term legacy directly matter in active gameplay.

## Product Principles
- Preserve the current hub → schedule → training → dialogue → result → next month loop.
- Expedition is an additional persistent activity, not a replacement for monthly raising.
- Existing save key remains `puppy-maker-save`.
- No new external libraries, global state framework, event bus, or state machine.
- Decorative game art must use image assets. CSS may handle layout, spacing, progress bars, text, and interaction states only.
- Existing art assets are reused in the first implementation phase. New region/boss/guardian-form artwork is a separate asset pass.
- Main/PR merge is not part of this work.

## 1. World Structure
Guardian Expedition contains 3 major regions and 9 stages.

### Regions
1. **별빛 숲** (`starlight_forest`)
   - Stage 1: 달빛 오솔길
   - Stage 2: 별가루 수풀
   - Stage 3 Boss: 고목의 수호자

2. **고대 마법도시** (`ancient_city`)
   - Stage 1: 잊힌 광장
   - Stage 2: 수정 회랑
   - Stage 3 Boss: 봉인된 마도핵

3. **바람 호수령** (`wind_lakes`)
   - Stage 1: 잔잔한 물길
   - Stage 2: 바람 절벽
   - Stage 3 Boss: 폭풍의 정령

Stages unlock sequentially inside a region. Region 2 unlocks after clearing the first region boss. Region 3 unlocks after clearing the second region boss.

Persistent progression stores best score, best grade, first-clear status, and cleared stage IDs.

## 2. Expedition Battle
Expedition battle reuses the existing training actions `attack`, `dodge`, and `charge` rather than creating a second unrelated combat language.

### Battle Inputs
The expedition battle score is derived from:
- strength
- magic
- condition
- fatigue
- activity mastery levels
- currently unlocked advanced talents
- equipped expedition relic bonuses
- player action quality from attack/dodge/charge timing

### Action Roles
- `attack`: primarily scales with strength and hunt mastery.
- `charge`: primarily scales with magic and magic mastery.
- `dodge`: reduces incoming stage pressure and gains extra value from calmness/rest mastery.

### Stage Pressure
Each stage has a difficulty score. Higher stages add fatigue/stress pressure during the expedition result calculation. Expedition cannot reduce permanent stats below their normal clamped minimums.

### Grade Thresholds
- S: score >= stage target × 1.20
- A: score >= stage target × 1.00
- B: score >= stage target × 0.80
- C: below B

A stage counts as cleared at B or higher. Best grade and best score only improve; replaying with a worse result never overwrites the better record.

## 3. Boss Trials
Each region’s third stage is a boss trial.

Boss trials:
- have higher target score and pressure;
- require the previous two stages in that region to be cleared;
- award a one-time boss badge;
- award a one-time first-clear reward;
- unlock the next region when appropriate.

Boss first-clear rewards:
- Starlight Forest boss: 500G + 2 gems
- Ancient City boss: 700G + 3 gems
- Wind Lakes boss: 1000G + 5 gems

Boss rewards are idempotent and persisted in save data.

## 4. Expedition Relics
Expedition introduces equipment-like relics distinct from the existing legacy relic collection.

### Slots
- Maximum 3 equipped expedition relics.
- One relic cannot occupy multiple slots.
- Unequipped owned relics remain in inventory.

### Initial Relic Set
1. `moonfang_charm` — attack score +6%
2. `mana_prism` — charge score +6%
3. `wind_feather` — dodge value +8%
4. `guardian_thread` — all expedition score +3%
5. `explorer_compass` — expedition material reward +1
6. `bond_locket` — first clear affection +2

Relics can be obtained from boss first clears, crafting, and region completion rewards.

Relic bonuses are modest and additive to existing raising progression; they must not replace mastery/talent value.

## 5. Materials and Crafting
Each region has one persistent material:
- `star_bark`
- `arcane_shard`
- `wind_pearl`

Normal cleared stages award 1 material, S-grade clears award 2. `explorer_compass` adds +1 material after grade calculation.

### Crafting Recipes
- 2 Star Bark → Star Cookie ×1
- 2 Arcane Shards → Fox Charm ×1
- 2 Wind Pearls → Herb Tea ×1
- 3 of each regional material → `guardian_thread` relic

Crafting is deterministic, checks resources before mutation, and never allows negative material counts.

## 6. Guardian Evolution
Guardian evolution is a derived long-term status, not a separate XP bar.

Stages:
1. `apprentice` — 견습 수호자
2. `guardian` — 수호자
3. `star_guardian` — 별의 수호자
4. `legendary_guardian` — 전설의 수호자

Evolution is derived from existing long-term progression plus expedition completion:
- Guardian: current guardian rank at least `guardian`
- Star Guardian: all three region bosses cleared + archive >= 75 slots
- Legendary Guardian: all expedition stages S-cleared + archive 100/100 + guardian legacy top tier

Evolution unlocks titles/labels and content gates only in this phase. Character appearance changes require dedicated image assets and are not rendered with CSS.

## 7. Expedition Story
Nine expedition story entries map one-to-one to the nine expedition stages.

Rules:
- Story entry unlocks on first clear of its stage.
- Entry remains permanently unlocked.
- Story is displayed inside the existing `루나 이야기` archive rather than a new permanent navigation tab.
- Boss entries provide a stronger chapter-ending summary.

## 8. 100-Slot Growth Archive
The existing 50-slot Growth Archive is preserved and expanded to 100 slots.

### New 50 Slots
- Expedition stage records: 9
- Boss badges: 3
- Expedition relic ownership: 6
- Expedition story entries: 9
- Region discoveries: 9
- Guardian evolution milestones: 4
- Crafting milestones: 4
- Region mastery/complete objectives: 3
- Expedition S-grade milestones: 3

Total new slots: 50.

### Archive Rank Extensions
Existing archive ranks remain unchanged through 50 slots.
New ranks:
- 75: `원정 기록관`
- 100: `수호 연대기의 완성자`

Archive recommendation logic must include expedition categories and route the player toward Expedition when those categories are the lowest completion ratio.

## 9. Region Discoveries
Each stage has one persistent discovery collectible, for nine total.

Discovery is awarded on the first A-or-better clear of that stage. A B-grade clear unlocks the stage/story but not its discovery, giving replay value without random grind.

Discoveries are permanent and unique.

## 10. Rewards and Economy
One-time rewards are separated from replay rewards.

### First Clear
Normal stage: 150G
Boss: boss reward table above

### Replay
- Cleared stage: materials only
- No repeated first-clear gold/gem payout

### Region Completion
Clearing all three stages in a region grants one expedition relic:
- Forest: `moonfang_charm`
- City: `mana_prism`
- Lakes: `wind_feather`

### Full Expedition Completion
Clearing all 9 stages grants:
- 5 gems
- `explorer_compass`
- permanent title/collection milestone

## 11. State Model
New persistent GameState fields:
- `expeditionRecords: Record<ExpeditionStageId, ExpeditionStageRecord>`
- `expeditionMaterials: Record<ExpeditionMaterialId, number>`
- `ownedExpeditionRelics: ExpeditionRelicId[]`
- `equippedExpeditionRelics: ExpeditionRelicId[]`
- `rewardedExpeditionStages: ExpeditionStageId[]`
- `rewardedExpeditionRegions: ExpeditionRegionId[]`
- `expeditionDiscoveries: ExpeditionDiscoveryId[]`
- `expeditionStoryEntries: ExpeditionStageId[]`
- `craftingMilestones: CraftingMilestoneId[]`

Hydration validates every enum, clamps numeric values to nonnegative integers, removes duplicates, limits equipped relics to three owned unique relics, and supplies safe defaults for legacy saves.

Transient battle UI state must not be persisted inside GameState unless needed to restore a screen safely. Permanent stage outcomes are persisted only after an expedition is finished.

## 12. Reducer Actions
New actions:
- `START_EXPEDITION_STAGE`
- `EXPEDITION_ACTION`
- `FINISH_EXPEDITION_STAGE`
- `EQUIP_EXPEDITION_RELIC`
- `UNEQUIP_EXPEDITION_RELIC`
- `CRAFT_EXPEDITION_RECIPE`

Expedition actions must not mutate monthly schedule, monthly counters, yearly ambitions, attendance claims, mail claims, annual records, or legacy records unless a specifically defined cross-system reward requires it.

## 13. UI and Navigation
### Home
Add an Expedition destination using the existing explicit home-navigation bridge.
Home expedition summary shows:
- current unlocked region
- cleared stages / 9
- boss badges / 3
- recommended next stage

### Expedition Screen
A dedicated expedition screen is allowed because the system is too large for the existing small home popup.

The screen contains:
- region selector
- three stage cards for the selected region
- clear/grade/best-score state
- lock state and unlock reason
- equipped relic summary
- material counts

### Battle Screen
Reuse existing training UI interaction language and existing effects where possible. Do not fabricate new boss/region art in CSS.

### Results
Show:
- score + grade
- first clear state
- material reward
- discovery unlocked
- relic/boss badge unlocked
- story unlocked

## 14. Cross-System Integration
- Training stats/mastery/talents affect expedition strength.
- Expedition clears feed Growth Archive.
- Expedition story feeds the existing story archive.
- Expedition progression contributes to guardian evolution.
- Archive recommendation can route to expedition.
- Yearly ambition remains independent in the first phase; a future expansion may add expedition-specific ambition types.
- Monthly progression remains fully playable without using expedition.

## 15. Testing Strategy
TDD is required for every subsystem.

Minimum coverage:
- region/stage unlock order
- grade thresholds
- combat scaling and relic modifiers
- best-score/best-grade preservation
- boss first-clear idempotency
- material rewards and S-grade bonuses
- crafting resource validation
- relic equip uniqueness and 3-slot cap
- legacy save hydration
- story/discovery first unlock semantics
- region/full-clear rewards
- guardian evolution derivation
- archive expansion to exactly 100 slots
- archive recommendation routing to expedition
- RESET/NEXT_MONTH preserve the intended permanent expedition fields
- existing monthly loop regression remains green

## 16. Delivery Sequence
1. Expedition domain model and stage progression
2. Battle calculation and boss rules
3. GameState/hydration/reducer integration
4. Relics and crafting
5. Expedition UI and navigation
6. Story and discoveries
7. Guardian evolution
8. 100-slot Growth Archive integration
9. Full regression/CI/Vercel verification
10. Dedicated art asset pass for new region/boss/evolution visuals if/when approved or explicitly requested

## Non-Goals
- No multiplayer or leaderboards.
- No gacha or paid currency economy.
- No real-time combat server.
- No procedural infinite map.
- No CSS-generated substitute illustrations for new bosses, regions, or evolution forms.
- No merge to main or PR merge.
