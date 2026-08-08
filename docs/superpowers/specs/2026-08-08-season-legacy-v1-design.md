# Season Legacy V1 Design

## Goal
Make completing a season materially improve the next season without adding a management-heavy skill tree or a second shop economy.

## Player-facing loop
1. Finish a season through normal monthly play.
2. Receive a compact season recap showing the strongest growth, memories, mastery and keepsakes earned.
3. Convert season accomplishments into Legacy Points automatically.
4. Unlock permanent passive milestones automatically at fixed Legacy Point thresholds.
5. Start the next season with immediately visible, modest boosts that reduce grind but do not skip the core schedule/training/dialogue loop.

## Legacy Points
Legacy Points are lifetime progression and never spent. They are awarded once per completed season from existing accomplishments: season completion, memories, mastery levels, high training quality and keepsake/collection progress. Awards are idempotent: reloading or revisiting a recap cannot grant points twice.

## Passive milestones
No skill tree and no manual allocation. Threshold milestones unlock automatically:
- Seasoned Heart: small starting affection/stress advantage.
- Trained Instinct: small training score multiplier.
- Veteran Routine: small mastery XP bonus.
- Keeper's Memory: small season reward bonus.

Bonuses are intentionally bounded. They make repeat seasons faster and clearer, not trivial.

## Season recap
At season rollover, persist a compact `lastSeasonRecap` snapshot: season number, Legacy Points earned, total lifetime Legacy Points, strongest mastery, memories gained, keepsakes/collection progress, unlocked passive milestone, and next-season bonuses. The recap is display data; authoritative progression remains in game state.

## Integration
- Preserve the existing save key and migrate legacy saves with zero Legacy Points and no completed-season ledger.
- Preserve the current monthly loop and existing season/keepsake systems.
- Apply passive effects inside existing score/mastery/reward calculations instead of creating parallel progression engines.
- Surface Legacy level/next milestone compactly on LayeredHome and season recap/result surfaces. Do not add a dense permanent dashboard.
- Existing season collection/keepsake progress contributes to Legacy Points so previous systems become more valuable rather than duplicated.

## Data model
Add a `legacy` state containing lifetime points, completed season IDs/ledger and unlocked milestone derivation. Add `lastSeasonRecap` for UI feedback. Hydration sanitizes missing/malformed values and preserves all existing progression.

## Testing
TDD coverage must include legacy-save migration, idempotent season awards, milestone thresholds, bounded passive modifiers, passive score/mastery/reward integration, rollover recap creation, and preservation of existing monthly/season progression.

## Non-goals
No spendable Legacy currency, branching skill tree, reset/respec flow, separate Legacy shop, daily chores, or additional mandatory taps. These add maintenance and player friction without enough convenience or progression value for V1.
