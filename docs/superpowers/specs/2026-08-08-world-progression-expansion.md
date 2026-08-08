# World Progression Mega Update

## Goal
Connect long-term exploration and expedition play into a persistent world progression layer without replacing the existing raising loop.

## Systems

### Regional Renown
- Persistent renown for `starlight_forest`, `ancient_city`, and `wind_lakes`.
- Successful expedition clears grant renown by grade: B +1, A +2, S +3.
- First boss clear grants an additional +2 renown.
- Renown levels use thresholds 0 / 5 / 12 / 22 / 35.
- Level-up rewards are one-time and deduped by `region:level` keys.
- Rewards: Lv2 100G, Lv3 1 gem, Lv4 150G, Lv5 2 gems.

### Expedition Season
- A season key is `year-season`, using the existing spring/summer/autumn/winter month mapping.
- Expedition clears award season points: B 10, A 20, S 30; first boss clear +20.
- Seasonal reward tiers: 50 / 120 / 220 / 350 points.
- Tier rewards: 150G / 1 gem / 250G / 2 gems.
- Claimed tier rewards are persistent and keyed by `seasonKey:tier`.
- Season points are stored per season key, so old seasons remain visible in history.

### Monthly World Event
- One deterministic event is derived from year and month.
- Six events rotate across the three regions.
- Each event has a featured region, title, description, and expedition bonus.
- Clearing the featured region grants +5 season points.
- S clear in the featured region grants +1 extra regional material once per stage result, not a permanent economic multiplier.

### World Contracts
- Three deterministic contracts are generated every month from the current world event.
- Contract categories: expedition clears, high-grade clears, featured-region clears.
- Monthly contract progress is stored explicitly and resets on `NEXT_MONTH`.
- Completed contracts auto-pay once and are deduped by `year-month:contractId`.
- Rewards are intentionally modest: 100–200G or 1 gem.

## UI
- Add a World Progress panel accessible from the expedition overlay.
- Show current world event, season points/reward track, three regional renown bars, and monthly contracts.
- Reuse current panel/card assets. No CSS-drawn decorative art.
- Expedition result adds compact rows for renown, season points, and event bonus.

## Save Compatibility
- Legacy saves hydrate empty renown, season progress, claimed reward keys, and contract progress.
- Invalid keys and negative progress are sanitized.
- Existing expedition rewards, Calling rewards, crafting, discoveries, and story progression remain unchanged except for additive world-progression rewards.

## Constraints
- Preserve the existing hub → schedule → training → dialogue → result → next month → hub loop.
- No merge to base/main without explicit user instruction.
- TDD: every behavioral slice starts with a failing test and is verified RED before implementation.
