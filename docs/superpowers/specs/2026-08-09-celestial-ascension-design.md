# Celestial Ascension Design

## Goal
Create a late-game meta progression layer above Astral Trials, Astral Blessings, Sanctuary Constellations, and Sanctuary Grand progression without introducing another grind currency.

## Progress Model
Celestial Ascension derives a score from existing permanent progression:
- Astral trial clears: 2 points each, capped at 12 clears / 24 points.
- Unique S-grade Astral trial types: 4 points each, capped at 4 / 16 points.
- Purchased Astral Blessings: 5 points each, capped at 4 / 20 points.
- Sanctuary Constellations: 2 points each, capped at 5 / 10 points.
- Sanctuary Grand progress: 1 point per 5 progress, capped at 65 / 13 points.

Maximum score is 83.

## Ascension Ranks
- 0: 지상의 별지기 (earthbound)
- 12: 성광 각성자 (awakened)
- 28: 성좌 승천자 (stellar)
- 48: 천궁 수호자 (empyrean)
- 72: 초월의 별수호자 (transcendent)

## One-Time Rewards
- Awakened: 250G + 1 Star Shard
- Stellar: 1 Gem + 2 Star Shards
- Empyrean: 500G + 2 Gems + 3 Star Shards
- Transcendent: 1200G + 5 Gems + 5 Star Shards

Only claimed rank IDs are persisted. Score/rank remain derived from existing state. Rewards are evaluated only after an accepted underlying game action; rejected/no-op actions return the same state and cannot duplicate rewards.

## UI
Celestial Ascension is surfaced inside the existing Starlight Sanctuary rather than creating another home entry. The Sanctuary panel shows current rank, score/next threshold, five contributing progression components, and the four-rank reward track. Existing popup frame artwork is reused; CSS handles layout and readability only.

## Compatibility
Legacy saves hydrate with an empty claimed Ascension reward list. Invalid or duplicate rank IDs are removed. Existing Sanctuary, Astral, Live Ops, monthly growth, and expedition state remain authoritative and unchanged.

## Verification Contract
- Pure score/rank/reward tests.
- Hydration sanitation tests.
- Automatic reward on a threshold-crossing Astral Blessing purchase.
- Same-object no-op on rejected duplicate purchase.
- Sanctuary UI summary tests.
- Full project tests and production build must pass before completion is claimed.
