# Tactical Battle Depth Design

## Goal
Turn the current portrait 3v3 tactical battle screen into a complete deterministic combat loop that reuses Puppy Maker's existing growth systems instead of creating a disconnected minigame.

## Scope

### 1. Turn engine
- Exactly 3 allies vs 3 enemies.
- Agility determines the stable round timeline; ties break by unit id.
- Each acting unit has AP and MP.
- A round ends after every living unit has acted once, then AP refreshes and the next timeline is rebuilt.
- Victory/defeat remains side-wide elimination.

### 2. Player actions
Four action families are used by the existing UI buttons:
- ATTACK: low AP physical strike.
- SKILL: role-specific stronger action using AP.
- SUPPORT: heal/shield/buff action.
- SPECIAL: consumes full MP and represents Calling/character identity.

Actions have explicit target rules, resource costs, power, and optional status effects. Invalid targets or insufficient resources are no-ops.

### 3. Formation
- Front units receive and deal normal melee pressure.
- Back units gain protection from direct attacks while a living front ally exists.
- Support/ranged actions can still target back units.
- Formation is data, not CSS logic.

### 4. Status effects
Initial deterministic set:
- guard: temporary shield bonus.
- focus: next outgoing action power bonus.
- break: temporary defense penalty.
- regen: heal at round transition.
Durations decrement at round transition and expired effects are removed.

### 5. Enemy AI
- Deterministic rule-based AI; no opaque randomness.
- Priorities: finish low-HP targets, prefer front targets, use support under HP threshold, use special at full MP.
- Seed may only break otherwise-equal choices so save/replay remains reproducible.

### 6. Growth integration
A pure adapter builds Runa's tactical unit from existing state:
- strength -> attack contribution
- intelligence -> skill contribution
- affection / relationship -> support contribution
- current Calling -> tactical role and special
- Calling mastery / selected Growth Traits -> bounded bonuses
- sanctuary / late-game meta systems may contribute capped bonuses, never replace core raising stats.
Two companion ally templates are deterministic support units so combat remains 3v3 without requiring a new collection system in this update.

### 7. Encounter/reward layer
- Add deterministic encounter definitions with enemy teams and recommended power.
- Combat completion returns grade S/A/B/C based on surviving allies, rounds, and damage taken.
- First-clear reward is one-time; repeat clears provide a smaller replay reward.
- Best grade and best round count are persistent.
- Rewards must use explicit dedupe keys.

### 8. UI flow
Existing TacticalBattleScreen is upgraded rather than replaced:
- active unit highlight
- target selection
- disabled unaffordable actions
- AP/MP bars
- statuses
- action log
- victory/defeat result panel
- retry/exit callbacks
- AUTO and 2x remain controls but auto uses the same deterministic engine.
No decorative character art is drawn in CSS. Current simple unit panels remain until dedicated image assets are provided.

## Architecture
New focused modules:
- `tactical-actions.ts`: action definitions and target rules.
- `tactical-engine.ts`: action resolution, round transition, status handling.
- `tactical-ai.ts`: deterministic enemy/auto decision logic.
- `tactical-growth.ts`: GameState -> tactical ally stats adapter.
- `tactical-encounters.ts`: encounter definitions, grading, rewards, persistent record helpers.
- existing `tactical-battle.ts`: core session/unit primitives only.
- existing `tactical-ui.ts`: presentation model only.

The game reducer should integrate records/rewards through a thin wrapper rather than mixing turn simulation into the main reducer.

## Persistence
Persist only strategic outcomes, never an in-progress turn session in this batch:
- `tacticalBattleRecords`
- `claimedTacticalFirstClears`
In-progress battle remains UI/session state. This minimizes save migration risk.

## Testing
TDD in this order:
1. action costs/targeting/damage/shield
2. round progression/status duration/resource refresh
3. deterministic AI
4. growth adapter
5. encounter grade/reward/dedupe
6. persistent reducer integration
7. UI summary/action availability
8. regression + production build

## Non-goals
- PvP/networking
- random gacha units
- asynchronous battle persistence
- new character illustrations
- merging PR #2/main
