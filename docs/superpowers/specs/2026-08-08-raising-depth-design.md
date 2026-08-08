# Runa Raising Depth Expansion Design

## Goal
Make Runa feel like a character the player has genuinely raised rather than a bundle of increasing stats. The expansion introduces identity, vocation, deliberate trait investment, relationship scenes, preferences, and signature abilities while preserving the existing monthly raising loop and Guardian Expedition.

## Design Choice
Three broad approaches were considered:

1. **More stats and more automatic milestones** — low implementation risk, but weak player agency and too similar to existing mastery/rank systems.
2. **Large unrestricted skill tree and manual combat loadout** — high depth, but creates UI complexity, respec pressure, and risks replacing the simple monthly raising loop.
3. **Calling + bounded Trait Board + Bond Scenes + Preferences** — recommended. It adds meaningful identity choices, reuses existing personality/mastery/relationship systems, and improves both raising and expedition without introducing a second game economy.

This expansion uses approach 3.

## Product Principles
- Preserve hub → schedule → training → dialogue → result → next month → hub.
- Guardian Expedition remains optional but benefits from raising choices.
- Existing save key remains `puppy-maker-save`.
- No premium currency, gacha, paid respec, or external dependency.
- Player choices should matter, but no choice should permanently ruin a save.
- Decorative character forms/outfits require image assets and are not faked with CSS.
- Existing game art is reused for this logic/UI phase.
- Main/PR merge is out of scope.

## 1. Personality Archetype
Runa already has courage, kindness, curiosity, and calmness. This expansion derives a visible personality archetype from those existing values.

Archetypes:
- `brave` — 용감한 루나
- `gentle` — 다정한 루나
- `curious` — 호기심 많은 루나
- `serene` — 차분한 루나
- `balanced` — 균형 잡힌 루나

Rules:
- Highest tendency wins if it leads the second-highest value by at least 5.
- Otherwise personality is `balanced`.
- No new personality XP or saved archetype field.
- Ties are always balanced.

Personality affects preferences and a few bounded trait effects, but never blocks story or progression.

## 2. Guardian Callings
At Guardian rank or above, the player can choose one active Calling.

Callings:
1. `vanguard` — 선봉 수호자
   - hunt/strength oriented
   - expedition attack specialization
2. `arcanist` — 별빛 마도사
   - magic/intelligence oriented
   - expedition charge specialization
3. `caretaker` — 마음의 치유사
   - rest/kindness/relationship oriented
   - fatigue/stress and bond specialization
4. `pathfinder` — 별길 탐험가
   - herb/curiosity/exploration oriented
   - discoveries/materials specialization

Rules:
- Calling selection becomes available at Guardian rank.
- One active Calling at a time.
- Switching is allowed only once per game month.
- Switching costs 300G. Initial selection is free.
- Calling choice persists across months and years.
- A switch cannot reduce gold below zero.
- Calling history is recorded so long-term identity milestones can recognize multiple paths.

## 3. Growth Trait Board
The player gains **Growth Points** used on a bounded 16-node trait board.

### Point Income
- +1 Growth Point on every completed month.
- +1 additional point when the month ends with S training grade.
- +1 on first clear of each Guardian Expedition boss.
- Points are persistent and unspent points carry forward.

No paid point purchase exists.

### Board Structure
Each Calling has four ordered nodes. A node requires the previous node in the same Calling.

#### Vanguard
1. `vanguard_power` — monthly hunt strength bonus +1
2. `vanguard_focus` — hunt mastery gain +1 on GREAT/PERFECT months
3. `vanguard_assault` — expedition attack +5%
4. `vanguard_legend` — first expedition clear each month reduces resulting fatigue by 2

#### Arcanist
1. `arcanist_mana` — monthly magic bonus +1
2. `arcanist_insight` — magic months intelligence +1
3. `arcanist_channel` — expedition charge +5%
4. `arcanist_legend` — A/S expedition discoveries also reduce stress by 2

#### Caretaker
1. `caretaker_rest` — monthly rest fatigue recovery +2
2. `caretaker_bond` — successful gift affection +1
3. `caretaker_guard` — expedition dodge/pressure guard +5%
4. `caretaker_legend` — first bond scene unlocked in a month grants stress -3

#### Pathfinder
1. `pathfinder_herb` — herb month intelligence/morality total bonus +1
2. `pathfinder_eye` — exploration discovery eligibility improves through deterministic threshold support, not random rerolls
3. `pathfinder_supply` — expedition material reward +1 on S clear
4. `pathfinder_legend` — first new discovery each month grants 100G

### Costs
- Node 1: 1 point
- Node 2: 1 point
- Node 3: 2 points
- Node 4: 2 points
Total to complete one path: 6 points.

Players may buy traits in any Calling, but the node’s full active bonus applies only when that Calling is active. This makes Calling switches meaningful without making old investments useless: purchased traits remain permanently owned.

### Respec
No point refund/respec in this phase. Because players can eventually earn all traits and Calling switches are possible, there is no irreversible dead-end.

## 4. Signature Abilities
Each Calling has two signature passive abilities, unlocked from Trait Board milestones.

- Vanguard
  - `rally_strike` at node 2: first attack in an expedition gets +8%
  - `guardian_breaker` at node 4: boss attack score +6%
- Arcanist
  - `mana_echo` at node 2: first charge gets +8%
  - `astral_core` at node 4: boss charge score +6%
- Caretaker
  - `gentle_guard` at node 2: first dodge pressure guard +10%
  - `heart_anchor` at node 4: expedition stress delta -2
- Pathfinder
  - `trail_reading` at node 2: first normal-stage clear grants +1 material
  - `star_compass` at node 4: region completion grants +1 bonus material of that region

Signature abilities are derived from owned traits + active Calling. They are not separately equipped.

## 5. Bond Scenes
Relationship progression gains persistent scenes rather than only labels.

Initial scene set: 10 scenes.

1. `first_trust` — affection 55
2. `favorite_place` — affection 65 + any outing visited
3. `shared_secret` — affection 75
4. `training_promise` — affection 75 + 10 trainings
5. `gift_memory` — affection 80 + 5 gifts
6. `guardian_confession` — affection 85 + Guardian rank
7. `first_boss_together` — any expedition boss clear
8. `three_regions_together` — all expedition bosses clear
9. `year_together` — at least one annual record
10. `precious_partner` — affection 95 + at least 8 previous bond scenes

Rules:
- Scenes unlock automatically from existing progress.
- Each scene remains permanently unlocked.
- Unlocking a scene grants a one-time small reward: either 100–200G or 1 gem for major milestones.
- Scene rewards are idempotent.
- Scene text appears in the existing Bond panel / story archive rather than a permanent new tab.

## 6. Preferences
Runa gains visible preferences derived from personality + active Calling.

### Favorite Activity
Base personality mapping:
- brave → hunt
- curious → magic/herb, resolved by Calling
- serene → rest
- gentle → rest/herb, resolved by Calling
- balanced → active Calling’s associated activity

### Favorite Gift
- brave → fox charm
- gentle → herb tea
- curious → star cookie
- serene → herb tea
- balanced → Calling mapping

Preference bonuses:
- Favorite activity scheduled at least once: +1 corresponding personality tendency at training finish.
- Favorite gift: +2 extra affection, not multiplied by other bonuses.
- Bonuses are capped through existing 0–100 clamps.

Preferences are derived, not saved.

## 7. Calling Mastery
Each Calling tracks a small persistent mastery value from active use.

Gain:
- +1 at each month completion while active.
- +1 for an expedition clear where the Calling’s specialized action was used at least once.

Levels:
- Lv1: 0
- Lv2: 3
- Lv3: 7
- Lv4: 12
- Lv5: 18

Calling mastery is intentionally slow and is independent from activity mastery.

Calling Lv milestones unlock titles only in this phase; raw combat/training bonuses come from traits to avoid double power inflation.

## 8. Identity Title
Runa’s current identity is displayed as a combination of personality + Calling, for example:
- 용감한 선봉 수호자
- 호기심 많은 별빛 마도사
- 다정한 마음의 치유사
- 차분한 별길 탐험가

If no Calling is selected, display personality archetype + current Guardian rank.

This replaces remaining generic/hardcoded level identity text where practical. Character artwork does not change without dedicated assets.

## 9. State Model
New persistent fields:
- `activeCalling: GuardianCallingId | null`
- `callingHistory: GuardianCallingId[]`
- `callingMastery: Record<GuardianCallingId, number>`
- `callingLastSwitchKey: string | null` (`year-month`)
- `growthPoints: number`
- `purchasedTraits: GrowthTraitId[]`
- `unlockedBondScenes: BondSceneId[]`
- `rewardedBondScenes: BondSceneId[]`
- `growthPointBossRewards: ExpeditionStageId[]` restricted to boss IDs

Derived only, not persisted:
- personality archetype
- preferences
- signature abilities
- identity title

Hydration:
- validates IDs;
- removes duplicates;
- clamps points/mastery to nonnegative integers;
- discards invalid switch keys;
- ensures rewarded scenes are a subset of valid scene IDs;
- safely defaults all fields for legacy saves.

## 10. Reducer Actions
New actions:
- `SET_GUARDIAN_CALLING`
- `PURCHASE_GROWTH_TRAIT`

Existing actions are extended:
- `FINISH_TRAINING` applies active trait + favorite activity effects.
- `GIVE_GIFT` applies favorite gift and Caretaker bonuses.
- `FINISH_EXPEDITION_STAGE` applies Calling/trait/signature effects and boss Growth Point reward.
- `NEXT_MONTH` grants monthly Growth Points and Calling mastery.

No action may duplicate rewards when replayed or rehydrated.

## 11. UI
### Home / Bond
Display:
- identity title
- personality archetype
- active Calling + mastery
- Growth Points available
- favorite activity/gift
- unlocked bond scenes

### Calling & Trait Board
Use one existing popup/frame-based overlay reachable from Bond panel.
It contains:
- 4 Calling cards
- active Calling state and monthly switch availability
- 4×4 trait board
- point costs / prerequisites / purchased state
- signature ability preview

No CSS-generated character illustrations.

### Bond Scene Archive
Existing Bond/Story UI gains a “함께한 장면” section showing 10 scenes as opened/locked.

### Expedition
Guardian Expedition header shows current identity and active Calling.
Battle calculations consume trait/signature bonuses but do not add more permanent action buttons.

## 12. Cross-System Integration
- Personality → preferences.
- Calling → smart schedule recommendation weight.
- Traits → monthly training, gifts, expedition combat/rewards.
- Expedition bosses → Growth Points and bond scenes.
- Bond scenes → long-term collection.
- Calling history/mastery → career/identity presentation.
- Yearly ambitions remain compatible; future ambition types may target Callings.

## 13. Collection Expansion
Do not change the Guardian Expedition 100-slot archive threshold during the initial Raising Depth implementation. Guardian Evolution remains stable at the already-verified 75/99/100 thresholds.

Raising Depth adds a separate **Raising Identity Collection** summary first rather than immediately moving the main archive goalposts again:
- Callings discovered: 4
- Traits purchased: 16
- Bond scenes: 10
- Signature abilities: 8
- Personality archetypes witnessed: 5 (persistent witnessed list added only if needed by later scope)

The main Growth Archive can absorb these in a later deliberate expansion after power/UX validation, avoiding threshold churn during this update.

## 14. Balance Constraints
- Trait bonuses stay in the +1–5% range except clearly one-time first-action bonuses.
- No trait multiplies a total result by more than 1.10 alone.
- Preference affection bonus is +2 maximum.
- Growth Points cannot be purchased.
- Calling switching costs only gold and is monthly limited.
- Player can eventually unlock all traits; no permanent build trap.

## 15. Testing Strategy
TDD required for every subsystem.

Minimum coverage:
- personality tie/balance rules
- Calling rank gate, free initial selection, monthly switch restriction, 300G switch cost
- trait prerequisite/cost checks and no duplicate purchase
- monthly/S/boss Growth Point income idempotency
- trait effects apply only with matching active Calling
- signature unlock derivation and first-action semantics
- bond scene unlock and reward idempotency
- favorite activity/gift derivation and bounded bonuses
- Calling mastery gains/preservation
- legacy save hydration
- RESET behavior and NEXT_MONTH persistence
- existing monthly loop remains green
- Guardian Expedition remains green
- 100-slot archive remains exactly 100 and Guardian Evolution thresholds do not regress

## 16. Delivery Sequence
1. Personality archetype and preferences
2. Calling domain + selection rules
3. Growth Points + Trait Board
4. Calling mastery + signature abilities
5. GameState/hydration/reducer integration
6. Bond scenes + one-time rewards
7. Monthly/gift/expedition cross-system bonuses
8. Calling/Trait/Bond UI
9. Full monthly + Guardian Expedition regression
10. CI + Vercel verification

## Non-Goals
- No new character-form artwork without an asset pass.
- No wardrobe rendering without dedicated outfit images.
- No PvP, leaderboards, or multiplayer.
- No gacha or premium trait currency.
- No unrestricted respec economy.
- No merge to main or PR merge.
