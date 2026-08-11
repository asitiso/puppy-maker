# Engineering notes

## Why full SCR-07 3v3 party battle was not built (2026-08-09)

GDD 3.5 / SCR-07 describes a full tactical battle: 3v3 grid formation, a 4-card skill deck drawn every turn, enemy AI, HP bars per unit, and a turn-order timeline driven by an AGI stat that doesn't exist anywhere else in this codebase.

Two paths were considered:

1. **Bolt a `'cards'` engine onto the existing guardian finale.** Rejected: `guardian_sanctum`'s 5-phase gauntlet (`src/game/adventure/guardian.ts`) deliberately covers the game's 5 existing `AdventureEngine` types exactly once each ("5가지 모험 감각을 연속으로 시험하는 마지막 시련"). Adding a 6th phase breaks that framing; replacing one of the 5 loses coverage of that sense. Both are worse than what's there.
2. **Register a brand-new destination + adventure stage for a boss fight.** Rejected for now: `adventureStages`, `destinations` (exploration.ts), and `MAP_POINTS` (map-layout.ts) are coupled 1:1 and exercised by a wide, currently-green test suite (TownMap rendering, wardrobe unlocks, monthly goals, achievements, campaign report, etc.). Wiring in a real HP-bar boss encounter properly — enemy data model, turn resolution, integrating it into the town map, ingredient/gold rewards consistent with the other 10 destinations — is realistically its own multi-session feature, not a single pass alongside five other backlog items.

**What exists instead:** the adventure "skill card" layer (`src/game/adventure/skill-cards.ts`, wired into `AdventureRunner`) already reuses the GDD's 4 card identities (파이어볼/치유의 빛/수호의 막/마력 집중) as a pre-round pick that leans the existing timing/tap/sequence/balance/choice minigames toward a playstyle. It is explicitly commented as not a real card battle.

**If this gets picked up later**, the honest next step is a dedicated destination (own `unlockMonth`, own map pin, own ingredient reward) whose engine is genuinely turn-based: player HP/enemy HP, a real turn loop, and the 4 cards as actual actions with cooldowns — not a reskin of the existing reflex/memory minigames. Budget it as its own feature, not a backlog line item.

## Update (2026-08-09, later same day): the boss battle was built as its own feature

Per the note above, this got its own dedicated pass instead of being squeezed into the earlier backlog:

- New destination `winter_battle` (겨울 마을 수호전, unlocks month 11, own map pin between `starlight_hill` and `guardian_sanctum`, own ingredient/gold reward in `exploration.ts`).
- New `AdventureEngine` value `'battle'`, with its own pure logic module `src/game/adventure/battle.ts`: real player HP (400) vs. a real enemy HP bar (겨울 그림자 늑대, 800 HP), a genuine turn loop (`createBattle`/`playCard`), and the 4 GDD skill cards (파이어볼/치유의 빛/수호의 막/마력 집중) as actual actions — fireball damages, heal restores, shield blocks ~75% of that turn's incoming hit, focus boosts the next card. 3 of the 4 cards are drawn each turn per the GDD's own "매 턴 3장의 카드가 랜덤 드로우". Fight ends on a knockout either way or a turn-limit draw.
- `AdventureRunner.tsx` gained a real `BattleView` (HP bars, turn counter, recent log, hand of 3 cards) parallel to the existing timing/tap/sequence/balance/choice engines, reusing `finalAdventureScore`/`gradeForScore` so it slots into the same reward pipeline (grade, first-clear, MASTER) as every other destination.
- This is still 1v1, not the GDD's literal 3v3 grid — that part of the scope reduction from the original note stands. What's no longer true is "not a real turn-based fight with HP bars"; that part is now real.
- 25 new tests (`battle.ts` pure logic + `AdventureRunner` battle-engine wiring). Existing "10 destinations" assumptions across ~10 other test files were updated to 11 rather than special-cased.
