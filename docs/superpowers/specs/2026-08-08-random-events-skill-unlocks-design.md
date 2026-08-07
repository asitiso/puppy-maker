# Puppy Maker Random Events + Skill Unlocks Design

## Goal

Add meaningful variation to the existing monthly raising loop without adding a large new menu surface. The update should make repeated training feel less predictable and make existing mastery levels matter through small automatic skill bonuses.

## Scope

This update adds only two systems:

1. Conditional random events that occur after training and before the normal dialogue/result flow.
2. Automatic skill unlocks tied to existing training mastery levels.

No separate skill tree, no inventory dependency, no new currency, no online systems, and no AI-generated dialogue are added in this phase.

## Design Principles

- Preserve the existing flow: home → schedule → training → dialogue → result → next month → home.
- Do not add extra mandatory screens for common runs.
- Events must be short, readable, and resolved with one choice when a choice is required.
- Events must be influenced by current condition, personality, and scheduled activities so previous player choices matter.
- Skill unlocks should be automatic and immediately useful; the player should not need to manage a skill loadout.
- Avoid CSS-drawn illustration. If a future event needs an illustrated background or decorative asset, use an image asset. This phase can ship with text and existing UI frames only.
- Preserve existing save data through hydration defaults and validation.

## Random Event System

### Event Timing

After `FINISH_TRAINING`, the game evaluates whether one event should occur. At most one event can trigger for a monthly training cycle.

The event is stored in state and surfaced inside the existing dialogue/result sequence rather than opening a permanent new menu.

### Initial Event Pool

Ship with six events:

1. `new_move` — Runa discovers a better training motion.
   - Favored by hunt training and high courage.
   - Reward: small mastery XP bonus to hunt.

2. `magic_resonance` — Magic flows unusually well.
   - Favored by magic training and focused condition.
   - Reward: small magic stat bonus and magic mastery XP.

3. `rare_herb` — A rare herb is found during gathering.
   - Favored by herb activity and curiosity.
   - Reward: small gold bonus and curiosity gain.

4. `calm_breakthrough` — Runa finds a better recovery rhythm.
   - Favored by rest activity and calmness.
   - Reward: fatigue/stress reduction and rest mastery XP.

5. `second_wind` — Runa pushes through a tiring session effectively.
   - Favored when condition is tired but the final training quality is GOOD or better.
   - Reward: partial fatigue recovery and courage gain.

6. `quiet_moment` — Runa pauses after training and shares a small personal moment.
   - Favored by high kindness/affection.
   - Reward: affection and kindness gain.

### Determinism and Testing

Randomness must not live directly inside the reducer through uncontrolled `Math.random()` calls.

Expose a pure event selector that accepts an explicit roll value from `0` to `<1`, for example:

`selectRandomEvent(state, roll): RandomEventId | null`

This keeps tests deterministic and allows future seeded randomness if needed.

The runtime action that finishes training may call a small helper that supplies `Math.random()` outside the core selection logic.

### Event Probability

Base event chance: 35%.

Modify chance modestly based on relevant state:

- favored condition/personality/activity can raise effective chance up to 55%
- no event should exceed 55% effective chance
- no run should trigger more than one event

The event selector should first decide whether an event occurs, then choose among eligible weighted candidates.

### Event Resolution

Events should not create a new permanent screen type in this phase.

Store:

- `pendingEvent: RandomEventId | null`
- `lastEvent: RandomEventId | null`

When `pendingEvent` exists, the existing dialogue area shows the event copy and one or two compact choices. Resolving the event applies its reward, clears `pendingEvent`, stores `lastEvent`, then continues to the normal character dialogue.

For the first version, only two events need actual player choices; the rest can have one acknowledgement action. This keeps implementation and UI overhead low.

Recommended choice events:

- `new_move`: “조금 더 연습한다” vs “오늘은 여기까지”
- `rare_herb`: “챙겨간다” vs “그 자리에 둔다”

The second option should provide a different but not punitive benefit.

## Skill Unlock System

### Unlock Model

Skills unlock automatically from existing mastery level. There is no skill tree screen and no manual equip step.

Each activity has four skill milestones tied to mastery Lv.2–5.

Initial skills:

### Hunt

- Lv.2 `quick_strike`: attack training score +5%
- Lv.3 `steady_guard`: dodge training score +5%
- Lv.4 `combo_instinct`: successful actions preserve combo more easily
- Lv.5 `hunter_focus`: final hunt mastery gain +1 on GREAT/PERFECT

### Magic

- Lv.2 `mana_flow`: charge training score +5%
- Lv.3 `spell_focus`: focused-condition score bonus is slightly stronger
- Lv.4 `arcane_memory`: magic activity stat gain +1 magic
- Lv.5 `resonance_mastery`: magic mastery gain +1 on GREAT/PERFECT

### Rest

- Lv.2 `deep_rest`: rest fatigue reduction improves by 3
- Lv.3 `calm_breath`: rest stress reduction improves by 3
- Lv.4 `recovery_rhythm`: tired condition penalties are reduced slightly
- Lv.5 `restoration`: monthly rest activity grants +1 affection

### Herb

- Lv.2 `keen_eye`: herb intelligence gain +1
- Lv.3 `forager_luck`: rare_herb event gets extra weight
- Lv.4 `field_calm`: herb activity reduces stress by 2
- Lv.5 `master_gatherer`: herb mastery gain +1 on GREAT/PERFECT

### Representation

Do not persist a separate unlocked-skill array unless necessary. Skills are derived from mastery levels via pure helpers:

`getUnlockedSkills(state): SkillId[]`

`hasSkill(state, skillId): boolean`

This prevents duplicated state and save migration complexity.

## Result Feedback

The monthly result screen keeps its current compact layout.

If a new skill was unlocked during the cycle, the existing “새로운 발견” slot should prioritize the skill unlock.

Priority for the discovery slot:

1. newly unlocked skill
2. triggered random event outcome
3. new memory
4. current condition

Do not add another full result page.

## Home Feedback

The home screen should not become denser.

After returning home, the dialogue panel may mention the latest event or newly unlocked skill once. It should then fall back to the existing condition recommendation copy.

No new home card is required.

## Data Model Changes

Extend `GameState` minimally with:

- `pendingEvent: RandomEventId | null`
- `lastEvent: RandomEventId | null`
- `lastUnlockedSkill: SkillId | null`

Do not store the complete unlocked skill list because it is derived from mastery.

Extend `GrowthReport` with:

- `newSkill: SkillId | null`
- `event: RandomEventId | null`

Hydration must validate these enum-like values and fall back to `null` for malformed or legacy saves.

## State Flow

Expected flow with no event:

`training → FINISH_TRAINING → dialogue → choice → result`

Expected flow with event:

`training → FINISH_TRAINING → pending event shown inside dialogue → RESOLVE_EVENT → normal dialogue → CHOOSE → result`

`NEXT_MONTH` clears transient `pendingEvent` and `lastUnlockedSkill` only after the result has already surfaced them as appropriate. Persistent mastery/personality/memories remain unchanged.

## Error Handling

- Unknown event IDs in saved data become `null`.
- Unknown skill IDs in saved data become `null`.
- Invalid event choice is ignored by reducer default behavior or constrained at the action type level.
- Event rewards must clamp stats/personality using existing clamping rules.
- Gold never falls below zero.
- Event selection must never throw when no candidate is eligible; return `null`.

## Testing

Add deterministic unit coverage for:

- skill unlock thresholds at Lv.2–5
- skill bonuses affecting attack/dodge/charge scoring
- rest/herb passive bonuses
- event eligibility and weighted selection using explicit roll values
- no more than one pending event per training cycle
- event resolution applies reward exactly once
- legacy save hydration fills new fields with `null`
- malformed event/skill IDs are discarded
- monthly result report prioritizes newly unlocked skill over event/memory
- `NEXT_MONTH` returns to hub and transient event state does not block a new schedule cycle

Existing tests for V2 growth, save hydration, monthly return, and build must continue to pass.

## Explicit Non-Goals

Not included in this update:

- skill tree UI
- manual skill equip/loadout
- event collection menu
- event-exclusive image production
- new currencies
- PvP
- real-time combat expansion
- AI-generated events/dialogue
- seasonal event framework

These can be reconsidered only if this lightweight system measurably improves repeated-play variety.
