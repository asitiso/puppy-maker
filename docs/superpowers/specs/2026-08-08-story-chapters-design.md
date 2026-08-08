# Story Chapter Progression Design

## Goal
Turn the existing Event shortcut into a long-term story archive whose chapters unlock from meaningful player progress without adding a separate story currency or blocking the core raising loop.

## Chapters
1. `first_step` — **첫 발걸음**: unlock after first training. Intro chapter; no currency reward.
2. `wide_world` — **넓어진 세계**: unlock after visiting all three outing locations. Reward: 1 gem.
3. `trusted_bond` — **마음을 나누는 사이**: unlock at close-friend relationship or higher. Reward: 1 gem.
4. `guardian_oath` — **수호자의 맹세**: unlock at guardian rank (`guardian`) or higher. Reward: 2 gems.
5. `starlight_road` — **별빛으로 가는 길**: unlock at veteran rank or higher and at least four hidden discoveries. Reward: 3 gems.

## Narrative Copy
Each chapter has a short title and 1-2 sentence summary stored as code data. No AI-generated live story is required. Locked chapters show a concise unlock hint.

## State
Persist `rewardedStoryChapters: StoryChapterId[]`. Chapter eligibility is derived from existing state, so there is no duplicate progress counter. Automatic rewards are reconciled after state-changing actions and never duplicate.

## UI
Reuse the existing layered-home `event` popup. Show all five chapters in order:
- unlocked: title, short summary, `열림`
- locked: title, unlock hint, `잠김`
- newly eligible rewards are automatic, so no claim button is needed

Do not add a new full-screen story screen yet. A later content update can make unlocked chapter rows open dedicated story scenes once actual background/character art assets exist.

## Non-goals
- no story choices in this iteration
- no new currency
- no CSS-painted story background
- no mandatory story gate for training/outings

## Testing
TDD covers unlock conditions, chapter ordering, reward exact-once behavior, malformed-save hydration, and persistence across months.
