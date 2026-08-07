# Puppy Maker V2 Core Growth Design

## Goal

Upgrade the existing playable loop without replacing its current schedule, training, dialogue, result, or save flow.

The first V2 slice should make one training cycle feel meaningfully different by connecting each action to six systems:

1. condition
2. training mastery
3. result quality
4. personality tendencies
5. memories
6. monthly growth report

The design deliberately avoids PvP, real-time AI dialogue, complex equipment, multiple currencies, room decoration, and story chapters in this slice.

## Current baseline

The existing flow is:

`hub -> schedule -> training -> dialogue -> result -> next month -> hub`

Current state already tracks year, month, week, gold, gems, schedule, core stats, combo, training score, and the last dialogue choice. Existing saves are stored in `localStorage` under `puppy-maker-save`.

V2 must preserve that flow and remain backward compatible with existing saves.

## 1. Condition

Add a lightweight current condition field:

- `energetic`
- `normal`
- `focused`
- `tired`

Condition is derived or updated from fatigue, recent activity, and monthly reset rules. It is not a second stamina system.

Effects remain intentionally small so the system guides play without forcing a specific choice.

Example effects:

- energetic: +10% training score gain
- focused: slightly wider PERFECT timing window or equivalent score bonus
- tired: reduced training gain and improved rest value
- normal: no modifier

The home screen should show a short human-readable condition label and one concise recommendation. It must not introduce another dense status panel.

## 2. Training mastery

Add per-activity mastery:

- hunt
- magic
- rest
- herb

Each activity stores experience and a derived level. Initial V2 uses a simple deterministic curve rather than a configurable skill tree.

Example level thresholds:

- Lv.1: 0 XP
- Lv.2: 3 XP
- Lv.3: 7 XP
- Lv.4: 12 XP
- Lv.5: 18 XP

Completing the monthly schedule grants mastery XP to each scheduled activity. Result quality may add a small bonus.

Mastery provides visible progression and can later unlock techniques, but this first slice does not add technique trees yet.

## 3. Result quality

Keep the existing S/A/B/C score grade for compatibility, but add a player-facing quality label for individual training feedback:

- NORMAL
- GOOD
- GREAT
- PERFECT

The quality is derived from training score/accuracy and should remain positive. MISS can still be used for moment-to-moment timing feedback, but the final monthly outcome should not frame the whole month as failure.

Mapping should be centralized in pure functions in `game.ts` and covered by tests.

Quality affects:

- small stat bonus
- mastery XP bonus
- optional memory trigger

It must not dramatically multiply rewards.

## 4. Personality tendencies

Add four personality tendencies for the first slice:

- courage
- kindness
- curiosity
- calmness

Each is stored as a bounded numeric value from 0 to 100.

The user should not need to micromanage these values. UI primarily expresses them as changes and short descriptions.

Example influences:

- hunt -> courage
- magic -> curiosity
- rest -> calmness
- herb -> curiosity and calmness
- hug dialogue -> kindness
- scold dialogue -> courage/calmness tradeoff where appropriate
- snack dialogue -> kindness

Personality changes should be small, predictable, and testable.

This slice does not branch the main story based on personality yet. It prepares the data foundation for later dialogue/event variation.

## 5. Memories

Add a compact memory collection system.

A memory is an ID plus metadata resolved from a static catalog. Saves store only earned IDs and acquisition context where necessary.

Initial memories should reuse events that already exist in the game instead of requiring new screens.

Suggested first memories:

- `first_training`
- `first_perfect`
- `first_hug`
- `first_snack`
- `first_s_grade`
- `first_month_complete`

Memory awards must be idempotent. Repeating the same trigger never duplicates a memory.

The result screen may show at most one newly unlocked memory per cycle to avoid reward clutter.

No full memory gallery is required in this first implementation slice; the underlying collection data is added now and a simple count/recent-memory presentation is sufficient.

## 6. Monthly growth report

Expand the current result screen rather than creating a separate navigation branch.

The report should summarize:

- final result quality / existing grade
- most improved core stat
- mastery gains
- personality changes
- newly earned memory, if any
- current condition entering the next month
- existing monthly gold reward

The report must stay skimmable on a vertical phone screen. Prefer a few grouped rows over many cards.

The existing `NEXT_MONTH` action remains the single transition back to hub.

## Save compatibility

Existing local saves do not contain V2 fields, so direct `JSON.parse` into the new state shape is unsafe.

Introduce a save hydration/migration function that:

1. starts from the latest `initialState`
2. overlays valid legacy fields
3. fills missing V2 fields with defaults
4. validates arrays/objects used by the new systems
5. preserves existing progress where possible

Do not rename the current localStorage key in this slice.

A malformed save must fall back safely to the latest initial state.

## State shape

Add focused fields rather than a large nested framework:

- `condition`
- `mastery`
- `personality`
- `memories`
- `lastGrowthReport`

`lastGrowthReport` is computed when training/dialogue resolution completes and retained until the next result is acknowledged.

Avoid introducing a general event bus or state-machine library.

## Data flow

### Training

`TRAIN` continues to update score/combo.

### Finish training

`FINISH_TRAINING`:

1. applies scheduled activity stat effects
2. calculates final quality/grade
3. applies condition modifier where appropriate
4. grants mastery XP
5. applies activity-driven personality changes
6. checks training-based memory triggers
7. advances to dialogue

### Dialogue choice

`CHOOSE`:

1. keeps the existing stat/gold effects
2. applies personality effects
3. checks dialogue-based memories
4. finalizes the growth report
5. advances to result

### Next month

`NEXT_MONTH`:

1. preserves existing month/year/gold behavior
2. resets combo and training score
3. derives the next condition
4. returns to hub

## Home integration

Do not redesign the LayeredHome in this slice.

Add only high-value dynamic information:

- real level/date/currency/stamina data instead of hard-coded values where practical
- current condition label
- one recommended action/reason
- recent memory indicator only if it fits without crowding

Do not add extra permanent panels simply because new state exists.

The existing image-first UI rule remains: decorative art uses supplied image assets; CSS is for layout, placement, sizing, responsive behavior, transforms, and simple animation rather than painting replacement artwork.

## Root / home architecture

The current `Root.tsx` still detects `.hub-screen` using `MutationObserver` and triggers the old schedule button through `querySelector`.

This is fragile, but replacing it in the same commit as the V2 game systems would increase regression risk.

Plan:

- keep the current bridge during the first game-state implementation commit
- add explicit shared screen-state integration in a separate follow-up commit after tests and flow verification
- remove DOM observation only when the replacement is covered by a home-return regression test

## Repository hygiene prerequisite

The current branch contains a commit that accidentally added `node_modules`, producing a very large PR diff.

Before implementation code is added:

- ensure `node_modules/` is ignored
- remove tracked `node_modules` files from the branch without touching package manifests/lockfiles needed for reproducible installs
- keep this cleanup isolated from game logic changes

This cleanup is mandatory because otherwise future code reviews and deployment debugging become unnecessarily difficult.

## Testing

Extend Vitest coverage with pure-state tests before UI changes.

Required tests:

1. legacy save hydration fills V2 defaults
2. malformed save falls back safely
3. condition modifier is deterministic
4. mastery XP increments and levels correctly
5. result quality boundaries are correct
6. personality values remain within 0-100
7. memories are awarded once only
8. dialogue memories/personality effects apply correctly
9. monthly report contains expected deltas
10. `NEXT_MONTH` still returns to `hub` and preserves V2 progression

Existing tests for activity clamping, S/A/B/C grade calculation, dialogue transition, and month advancement must continue to pass.

## Verification

A change is not considered complete until all of the following are checked:

- `npm run test`
- `npm run build`
- full flow: layered home -> schedule -> training -> dialogue -> result -> next month -> layered home
- mobile overlap/cropping check on the preview
- Vercel deployment status is explicitly verified as READY before reporting deployment success

## Commit boundaries

Keep changes reversible:

1. `chore: remove tracked dependencies and harden gitignore`
2. `test: define v2 growth state behavior`
3. `feat: add v2 growth state systems`
4. `feat: surface v2 growth feedback in results and home`
5. `refactor: replace DOM-based home bridge with explicit screen state` (only after the prior flow is verified)

Do not merge PR #1 or main without explicit user instruction.

## Success criteria

After this slice, one monthly cycle should answer all of these questions visibly:

- How well did this training go?
- What did Runa improve at?
- What kind of Runa is she becoming?
- Did anything memorable happen?
- What should I consider doing next?

If a new system does not make one of those answers clearer or more interesting, it should not be added to this slice.
