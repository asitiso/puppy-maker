# Sanctuary Legacy Design

## Goal
Turn Celestial Convergence from a terminal endgame feature into a long-horizon Sanctuary Legacy loop without adding another daily chore or another spendable currency.

## Product Principle
Legacy should make the existing endgame easier to understand and more rewarding, not create another management screen. It reuses Convergence records, Guardian Boons, Sanctuary Grand progress, Celestial Ascension, season journey, expeditions and training. The player should normally have one obvious next Legacy target and be able to collect crossed rewards together.

## Scope
- Five persistent Legacy ranks: Hearth, Beacon, Chronicle, Mythic, Eternal.
- Deterministic Legacy score derived only from existing endgame progress.
- Three mutually exclusive Legacy paths that can be changed without cost: Mentor, Wayfarer, Keeper.
- Path effects connect to training, expeditions and monthly/season progression respectively.
- Twelve one-time Legacy milestones distributed across existing systems.
- Batch claim for every crossed unclaimed milestone.
- A single steward recommendation that points to the highest-impact currently reachable objective.
- Sanctuary overlay integration; no new home navigation destination.
- Defensive hydration for all new fields and old saves.

## Legacy Score
Legacy score is bounded to 100 for readable rank progression. Inputs are normalized before weighting:
- Celestial Convergence completion and grade quality: 30 points.
- Purchased Guardian Boons: 15 points.
- Sanctuary Grand progress: 20 points.
- Celestial Ascension progress: 15 points.
- Calling mastery: 10 points.
- Astral Rift breadth/relic progress: 10 points.

Legacy ranks unlock at 0 / 20 / 40 / 65 / 85. Rank crossing itself is informational; rewards live in milestones so there is only one claim surface.

## Legacy Paths
The player may select one active path and switch freely. There is no respec currency or cooldown.

### Mentor
For players currently raising stats. Adds a modest percentage bonus to positive training stat gains. It does not alter fatigue costs.

### Wayfarer
For players pursuing exploration. Adds a small journey-point bonus after successful expedition and Convergence clears.

### Keeper
For players focused on long-term care. Adds small fatigue/stress recovery on month advance plus a modest monthly journey bonus.

Path effects stay below existing Masterwork/Constellation headline bonuses so Legacy complements rather than invalidates earlier progression.

## Milestones
Twelve milestones use existing accomplishments. Examples include reaching Legacy score thresholds, clearing all four Convergence guardians, achieving intensity-3 breadth, buying Guardian Boons, reaching Celestial Sanctuary rank, deep Ascension, Calling mastery and Rift relic breadth.

Milestones grant gold/gems and never introduce a new currency. Multiple newly completed milestones are claimed through one `CLAIM_SANCTUARY_LEGACY_REWARDS` action. Claimed ids are persistent and deduplicated.

## Steward Recommendation
A pure selector returns at most one recommendation. Priority is based on effort-to-impact rather than fixed feature order:
1. Immediately claimable Legacy rewards.
2. A Convergence first clear or grade improvement that is currently reachable.
3. The cheapest reachable Guardian Boon.
4. A near Sanctuary/Ascension threshold.
5. Calling or Rift breadth only when it is the shortest remaining route.

The recommendation includes target id, short Korean label, reason, and progress text. It never automatically spends resources or starts content.

## Persistence
Add safe defaults:
- `sanctuaryLegacyPath: SanctuaryLegacyPathId | null`
- `claimedSanctuaryLegacyMilestones: SanctuaryLegacyMilestoneId[]`

Legacy score, rank, milestone completion and recommendation are derived rather than persisted to reduce migration and stale-state risk.

## Architecture
Pure domain modules:
- `sanctuary-legacy.ts`: score, ranks, paths and effects.
- `sanctuary-legacy-milestones.ts`: milestone definitions, completion and batch rewards.
- `sanctuary-legacy-steward.ts`: next-best-action recommendation.

Integration layer:
- a focused `game-sanctuary-legacy-base.ts` wraps the current top endgame reducer and owns hydration/actions/effect application.
- `game.ts` keeps existing public exports and Grand reward behavior while delegating to the Legacy base.

UI:
- extend the current Sanctuary/Convergence overlay with one compact Legacy section: rank/score, active path selector, one recommendation card, milestone progress and one batch-claim button.
- no separate Legacy overlay, no new home button, and no CSS-generated fantasy artwork.

## Error Handling and Compatibility
- Unknown path/milestone ids hydrate to safe defaults.
- Duplicate claimed ids collapse.
- Derived calculations tolerate missing legacy fields and old save shapes.
- Invalid actions return the existing state reference where practical.
- No existing Convergence, Ascension, Sanctuary, Calling or Rift persistence fields are renamed.

## Testing
Use TDD per domain behavior and integration action. Required coverage:
- score boundaries and rank mapping;
- path effect aggregation and free switching;
- milestone completion/deduplication/batch reward totals;
- recommendation priority;
- old-save hydration;
- reducer effects for training, expedition and month advance;
- regression of existing endgame tests;
- production build and GitHub CI before completion is claimed.

## Explicit Non-Goals
- no new spendable currency;
- no daily Legacy quests;
- no random reroll system;
- no separate inventory;
- no destructive prestige/reset;
- no automatic resource spending;
- no new top-level navigation destination.
