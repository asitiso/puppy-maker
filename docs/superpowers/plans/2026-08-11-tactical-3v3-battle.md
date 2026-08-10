# Tactical 3v3 Battle v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete reusable 3v3 card/timeline battle system where Runa leads two lightweight Bond-based companions and Expedition battle nodes launch the dedicated tactical battle UI.

**Architecture:** Keep combat as focused pure modules outside the large raising engine, then add a thin integration wrapper/action boundary similar to existing Live Ops layering. Persist only party preference, Bond, and clear records; battle sessions remain transient. UI is a standalone portrait battle screen using existing art assets and code-rendered combat information.

**Tech Stack:** TypeScript, React, Vitest, existing Puppy Maker reducer/state architecture and CSS/assets.

## Global Constraints
- Preserve the existing hub → schedule → training → dialogue → result → next month → hub loop.
- Runa is permanent leader; select exactly two companions from bear/owl/wolf/cat.
- Companion base power derives from existing Runa/guardian progression; only Bond Lv1-5 is separately progressed.
- No companion equipment, stat allocation, or independent XP grind.
- Use Front/Back only; include recommended formation.
- Use 4-card hand, AP/MP, agility timeline, deterministic/seedable draw and AI.
- Provide 1x/2x/AUTO.
- First integration is Expedition Battle Node; reuse engine later for tournaments/defense.
- Decorative fantasy artwork must use assets rather than fake CSS art.
- TDD: RED → implementation → GREEN, then full test and production build verification.
- PR #2 remains draft/open/unmerged.

---

### Task 1: Combat domain and timeline

**Files:**
- Create: `src/tactical-battle.ts`
- Create: `src/tactical-battle.test.ts`

**Interfaces:**
- Produces: `TacticalUnit`, `BattleSide`, `BattlePosition`, `BattleSession`, `createBattleSession()`, `orderedTimeline()`, `isBattleFinished()`.

- [ ] Write failing Vitest cases for 3 allies/3 enemies, agility ordering, deterministic tie-break by stable unit id, Front/Back placement, and victory/defeat termination.
- [ ] Run `npm test -- src/tactical-battle.test.ts` and confirm RED because the module/API is absent.
- [ ] Implement immutable battle-domain types and deterministic timeline helpers with no React/game-state dependencies.
- [ ] Run the focused test and confirm GREEN.
- [ ] Commit `feat: add tactical battle domain`.

### Task 2: Cards, AP/MP and seeded hand

**Files:**
- Create: `src/tactical-cards.ts`
- Create: `src/tactical-cards.test.ts`
- Modify: `src/tactical-battle.ts`

**Interfaces:**
- Produces: `TacticalCard`, `CardKind`, `drawBattleHand(seed, deck, count)`, `canPlayCard(session, card)`, `resolveCard(session, cardId, targetId)`.

- [ ] Write failing cases proving a 4-card hand is deterministic for a seed, AP/MP affordability is enforced, resources are deducted once, illegal targets are no-ops, damage/heal/shield resolve correctly, and Runa scaling consumes existing derived STR/MAG/SEN/MOR inputs.
- [ ] Run focused tests and confirm RED.
- [ ] Implement a deliberately small v1 deck with Attack/Skill/Support/Special families and pure resolution functions.
- [ ] Run focused tests and confirm GREEN.
- [ ] Commit `feat: add tactical cards and resources`.

### Task 3: Companions, formation and Bond

**Files:**
- Create: `src/tactical-companions.ts`
- Create: `src/tactical-companions.test.ts`
- Modify: `src/tactical-battle.ts`

**Interfaces:**
- Produces: `CompanionId = 'bear'|'owl'|'wolf'|'cat'`, `CompanionBondState`, `recommendedFormation()`, `deriveCompanionUnit()`, `bondLevelForXp()`, `grantBattleBond()`.

- [ ] Write failing tests for all four role identities, automatic stat scaling from leader progression, recommended Front/Back positions, Bond Lv1-5 thresholds, capped progression, and Lv2/Lv3/Lv4 unlock availability.
- [ ] Run focused tests and confirm RED.
- [ ] Implement companion definitions without equipment or separate character levels.
- [ ] Run focused tests and confirm GREEN.
- [ ] Commit `feat: add tactical companions and bond`.

### Task 4: Combination ultimates

**Files:**
- Create: `src/tactical-combos.ts`
- Create: `src/tactical-combos.test.ts`
- Modify: `src/tactical-cards.ts`

**Interfaces:**
- Produces: `comboForCompanion()`, `canUseCombo()`, `resolveCombo()` for bear/owl/wolf/cat combinations.

- [ ] Write failing tests requiring Bond Lv5, sufficient MP, living Runa + companion, correct target rules, single resource deduction, and one resolution for Starlight Guardian Formation, Moonlight Prayer, Twin Moon Assault, and Phantom Dance.
- [ ] Run focused tests and confirm RED.
- [ ] Implement the four combination identities as Special actions using existing battle primitives.
- [ ] Run focused tests and confirm GREEN.
- [ ] Commit `feat: add bond combination ultimates`.

### Task 5: Enemy archetypes and AUTO

**Files:**
- Create: `src/tactical-ai.ts`
- Create: `src/tactical-ai.test.ts`
- Create: `src/tactical-auto.test.ts`

**Interfaces:**
- Produces: `EnemyArchetype`, `chooseEnemyAction(session, unitId, seed)`, `chooseAutoAction(session, unitId, seed)`, `advanceAutoBattle(session, seed, maxActions)`.

- [ ] Write failing deterministic tests for bruiser/guardian/caster/support/assassin priorities and for AUTO choosing only legal cards/targets.
- [ ] Add a termination test with an action safety cap so malformed balance cannot create an infinite AUTO loop.
- [ ] Run focused tests and confirm RED.
- [ ] Implement weighted deterministic choices and AUTO using the same public resolution functions as manual play.
- [ ] Run focused tests and confirm GREEN.
- [ ] Commit `feat: add tactical battle ai and auto`.

### Task 6: Persistent tactical progression and hydration

**Files:**
- Create: `src/tactical-state.ts`
- Create: `src/tactical-state.test.ts`
- Modify the existing outer game-state/hydration layer that currently owns additive feature state; do not move unrelated fields.

**Interfaces:**
- Persist: `tacticalParty`, `companionBonds`, `tacticalBattleRecords`.
- Produces: `emptyTacticalState()`, `hydrateTacticalState(value)`.

- [ ] Write failing tests for legacy saves with missing fields, invalid companion ids, duplicate companion selection, malformed/negative Bond values, invalid clear records, and valid-state round trip.
- [ ] Run focused tests and confirm RED.
- [ ] Implement sanitization and merge it into existing game hydration/Save Schema v2 without persisting transient hands/timeline/animations.
- [ ] Run tactical-state plus save-schema/save-resilience suites and confirm GREEN.
- [ ] Commit `feat: persist tactical progression`.

### Task 7: Expedition Battle Node and reducer integration

**Files:**
- Create: `src/tactical-integration.test.ts`
- Modify: the current Expedition domain file that defines region/stage nodes.
- Modify: the current thin outer reducer/wrapper rather than expanding `game-base.ts` unless unavoidable.

**Interfaces:**
- Add actions for party selection, tactical battle start/result, and Bond/reward settlement using exact names chosen in implementation and documented in the tests.

- [ ] Write failing integration tests: a battle node starts a session descriptor, victory records the clear and intended repeat reward, one-time reward keys cannot duplicate, defeat does not grant victory rewards, Bond grows only for participating companions, and Live Ops/Expedition rewards are not accidentally double-paid.
- [ ] Run focused integration tests and confirm RED.
- [ ] Implement the thin reducer integration and first Expedition Battle Node.
- [ ] Run Expedition/world/Live Ops regression suites and confirm GREEN.
- [ ] Commit `feat: integrate tactical battles with expedition`.

### Task 8: Dedicated TacticalBattleScreen

**Files:**
- Create: `src/components/TacticalBattleScreen.tsx`
- Create: `src/components/TacticalBattleScreen.css`
- Create: `src/components/TacticalBattleScreen.test.tsx` if the repository's current test stack supports component tests; otherwise test extracted view-model helpers in `src/tactical-battle-view.test.ts`.
- Modify: the current root/overlay routing component to open/close the standalone battle screen.

**Interfaces:**
- Props consume a battle session/view model and callbacks for card, target, AUTO, speed, and exit/result.

- [ ] Write failing UI/view-model tests for timeline ordering, six unit slots, active unit, 4-card hand, AP/MP display, target eligibility, AUTO toggle and 1x/2x toggle.
- [ ] Run focused tests and confirm RED.
- [ ] Implement portrait 9:16 layout: timeline top, battlefield center, hand lower, resource/speed controls bottom. Reuse existing image assets where suitable; CSS only handles layout/state/readability.
- [ ] Wire the Expedition node to open this screen and return results to Expedition.
- [ ] Run focused tests and confirm GREEN.
- [ ] Commit `feat: add tactical battle screen`.

### Task 9: Battle feedback, rewards and complete regression

**Files:**
- Modify: tactical modules/tests created above.
- Modify: existing reward/result UI only where necessary for tactical result presentation.

**Interfaces:**
- Result payload includes winner, grade/summary, rewards, Bond gains, and newly unlocked Bond feature labels.

- [ ] Add failing regression cases for reward dedupe, Bond threshold crossing, combo unlock feedback, AUTO victory settlement once, save/load persistence, and old-save hydration.
- [ ] Implement minimal result feedback using existing panel/result conventions; do not introduce a new notification framework.
- [ ] Run all tactical tests and relevant Expedition/Live Ops/save suites.
- [ ] Run `npm test` and require full GREEN.
- [ ] Run `npm run build` and require production build GREEN.
- [ ] Commit `test: complete tactical battle regression coverage`.

### Task 10: CI, deployment and PR documentation

**Files:**
- Modify: PR #2 description only after code verification.

**Interfaces:**
- Verification evidence is the exact final commit SHA, GitHub Actions result, production build result, and Vercel deployment SHA/READY state.

- [ ] Push/advance `feat/v2-core-growth` only with fast-forward commits; do not merge PR #2.
- [ ] Inspect GitHub Actions for the final tactical commit and require tests/build success before saying GREEN.
- [ ] Verify the latest Vercel deployment is READY and `meta.githubCommitSha` equals the verified final commit; READY alone is insufficient.
- [ ] Update Draft PR #2 body with Tactical 3v3 Battle v1, companion/Bond model, Expedition Battle Node, AUTO, persistence, and exact latest test/build verification numbers.
- [ ] Reconfirm PR #2 is open, draft, and unmerged.
