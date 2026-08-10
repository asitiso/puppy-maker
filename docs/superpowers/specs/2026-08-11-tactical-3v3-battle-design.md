# Tactical 3v3 Battle v1 Design

## Goal
Add the GDD's missing SCR-07 tactical battle as a reusable combat system without turning Puppy Maker into a second management RPG. The feature must make Runa's existing raising progress materially useful in combat while keeping companion management lightweight.

## Party
- Runa is the permanent leader.
- Pick 2 companions from Bear, Owl, Wolf, Cat.
- Companion base combat stats scale automatically from Runa/current guardian progression.
- Companions have only Bond Lv 1-5 as independent progression. No companion equipment, stat allocation, or separate XP/level grind.

### Roles
- Bear: tank — taunt, shield, intercept.
- Owl: support — healing, MP support, cleanse.
- Wolf: striker — focused burst, execute/extra-action style effects.
- Cat: trickster — high agility, evade, timeline delay.
- Runa: adaptive leader — existing stats and Calling influence card power/style.

## Battle Loop
Target 2-4 minutes for a normal encounter and roughly 5-8 rounds.

1. Build party and choose Front/Back position. A recommended formation button provides a one-tap default.
2. Start a 3v3 encounter.
3. Units enter a visible turn timeline derived primarily from agility.
4. On the active player unit's turn, draw/display 4 usable cards.
5. Tap a card, then a valid target when needed. Avoid confirmation dialogs.
6. Spend AP/MP, resolve damage/heal/shield/status/timeline effects, then advance timeline.
7. Enemy AI selects a deterministic weighted action from its archetype.
8. Win when all enemies are defeated; lose when all allies are defeated.
9. Resolve rewards and Bond progress, then return to the originating Expedition/event flow.

## Resources and Cards
- AP is the frequently refreshed action resource.
- MP accumulates during battle and pays for stronger skills/combination attacks.
- Four broad card families: Attack, Skill, Support, Special.
- Runa card scaling uses existing STR/MAG/SEN/MOR-style raising stats rather than introducing a new battle-stat grind.
- Calling/Guardian progression modifies card behavior through derived bonuses/passives, not duplicate progression trees.
- The first deck should remain intentionally small and readable; depth comes from party composition, timing, target choice, and Bond unlocks.

## Formation
Use only Front/Back positioning instead of a draggable six-cell formation editor.
- Front: more likely to be targeted; better access to melee/protection effects.
- Back: safer; suited to magic/support/ranged actions.
- Recommended Formation automatically places the selected party sensibly.

## Bond
Each companion has Bond Lv 1-5. Bond increases naturally from completing battles together.
- Lv1: base kit.
- Lv2: companion passive.
- Lv3: unique card unlock/upgrade.
- Lv4: team passive.
- Lv5: Runa + companion combination ultimate.

Initial combination identities:
- Runa + Bear: Starlight Guardian Formation.
- Runa + Owl: Moonlight Prayer.
- Runa + Wolf: Twin Moon Assault.
- Runa + Cat: Phantom Dance.

A future three-character ultimate may reuse this system but is explicitly out of v1 scope.

## Enemy AI
Use small archetypes rather than a general AI framework:
- bruiser: prefers vulnerable/front targets.
- guardian: shields/protects allies.
- caster: builds MP then uses area pressure.
- support: heals/debuffs.
- assassin: targets low-HP/back units.

AI decisions must be seedable/deterministic in tests.

## Automation and Speed
- 1x and 2x battle speed.
- AUTO is a first-class feature because Puppy Maker already has many repeatable systems.
- Manual play should matter most on first clears, bosses, and tournaments.
- Cleared ordinary encounters should be comfortable to replay on AUTO.

## Integration
Do not alter the core hub → schedule → training → dialogue → result → next month → hub loop.

First integration point:
Expedition region → exploration → Battle Node → Tactical Battle → result → Expedition.

The same engine can later power the GDD's beast hunts, spring tournament, and winter village defense without duplicating combat logic.

## UI Architecture
Add a standalone `TacticalBattleScreen`/battle component tree rather than expanding LayeredHome.

Portrait 9:16 layout:
- Top: turn timeline.
- Center: player/enemy battlefield and Front/Back positioning.
- Lower: active-unit status and 4-card hand.
- Bottom: AP/MP plus 1x/2x/AUTO controls.

Use code for text, numbers, gauges, target states, layout, and combat feedback. Reuse existing game assets where appropriate. Do not draw decorative fantasy artwork in CSS; missing important art becomes an explicit image-asset task.

## Persistent State
Persist only long-lived information:
- selected companion pair / preferred formation where useful.
- companion Bond progress/levels.
- battle-node clear records/best grade if needed for Expedition progression.

Do not persist transient battle hands, animation state, or timeline unless later resume requirements prove necessary. Hydration must safely default old saves and sanitize invalid companion/bond values.

## Rewards
Battle rewards feed existing systems rather than creating another economy:
- existing gold/gems/items where appropriate.
- Expedition progression/region rewards.
- Season Journey/Live Ops through existing integration boundaries.
- companion Bond progress.

Reward keys/clear records must prevent duplicate one-time rewards while allowing intended repeat rewards.

## TDD / Regression Requirements
Implement in isolated modules and cover at minimum:
- agility timeline ordering and deterministic ties.
- AP/MP affordability and spending.
- draw/hand determinism under a seed.
- valid target rules and Front/Back effects.
- damage/heal/shield/status resolution.
- each companion role's signature behavior.
- enemy AI determinism.
- AUTO reaching the same legal state transitions as manual actions.
- victory/defeat termination.
- Bond gain and Lv1-5 unlock thresholds.
- combination ultimate eligibility and one-resolution behavior.
- hydration of old/malformed saves.
- Expedition battle-node integration.
- reward dedupe and no accidental duplicate Live Ops payout.
- existing core game loop regression tests remain GREEN.

## Delivery Boundary
Tactical Battle v1 is complete only when the engine, four companions, Bond, combination ultimates, enemy archetypes, AUTO/2x controls, Expedition Battle Node, dedicated battle UI, persistence, and regression coverage work together and full test + production build verification succeeds. PR #2 remains draft/open/unmerged unless explicitly instructed otherwise.
