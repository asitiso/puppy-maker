# Monthly Challenges & Growth Streak Design

## Goal
Turn the existing Mission shortcut into a real monthly gameplay driver that rewards balanced play and creates a reason to complete each month before advancing.

## Core Loop
Each month has three fixed goals:
- Complete training once.
- Go on two outings.
- Give one gift.

Progress updates automatically from existing actions. A mission reward is granted immediately the first time its target is reached; there is no extra claim tap.

## Rewards
- Training mission: 120G.
- Outing mission: 1 gem.
- Gift mission: 100G.

Rewards cannot duplicate within the same month.

## Growth Streak
If all three monthly missions are completed before `NEXT_MONTH`, `growthStreak` increases by 1. If any mission is incomplete, the streak resets to 0. Every third consecutive completed month grants an additional 3 gems.

## State
Add to the extended game state:
- `monthlyCounters: { trainings: number; outings: number; gifts: number }`
- `rewardedMonthlyMissions: MonthlyMissionId[]`
- `growthStreak: number`

Legacy saves hydrate to zero counters, no rewarded missions, and streak 0. Malformed values are sanitized.

## UI
Reuse the existing Mission popup in `LayeredHome`.
- Show each mission with progress, target, reward, and completed status.
- Show current growth streak at the top.
- Rewards are automatic, so completed rows say `보상 완료`.
- Do not add a new screen or new CSS artwork.

## Non-goals
- No daily login streak.
- No real-world date dependency.
- No extra currency.
- No separate battle pass.
- No penalty for missing a month beyond resetting the growth streak.

## Testing
TDD must cover hydration, exact-once rewards, empty gift no-op, outing target threshold, full-month streak increment, incomplete-month reset, three-month streak bonus, and monthly counter reset.
