# Guardian Rank Progression Design

## Goal
Create a clear long-term growth arc that combines memories, skills, discoveries, and mastery into one prestigious guardian rank without adding another grind currency.

## Ranks
- trainee: 견습 수호자 — 0 points
- junior: 초급 수호자 — 8 points
- guardian: 정식 수호자 — 16 points
- veteran: 숙련 수호자 — 28 points
- starlight: 별빛 수호자 — 42 points

## Growth points
- each memory: 1 point
- each unlocked skill: 2 points
- each hidden discovery: 1 point
- each activity mastery level above Lv1: 1 point per level

## Rewards
When crossing into a rank for the first time, grant automatically:
- junior: 1 gem
- guardian: 2 gems
- veteran: 3 gems
- starlight: 5 gems

Persist rewarded ranks so rewards never duplicate. Legacy saves begin with no reward claims; the next progress-changing action may reconcile any rank already earned and grant missing rank rewards once.

## UI
Reuse existing UI only:
- replace the hard-coded home `Lv.10` identity with the current guardian rank label/point progress.
- Bond panel shows current guardian rank and points to next rank.
- No character costume/evolution image is created in CSS. Future rank-specific character art must be separate image assets.

## Non-goals
- no new currency
- no manual rank-up button
- no rank-specific character artwork in this implementation
- no stat reset or prestige reset

## Testing
TDD covers point calculation, rank thresholds, next-rank progress, exact-once automatic rewards, hydration sanitization, and rank persistence across months.
