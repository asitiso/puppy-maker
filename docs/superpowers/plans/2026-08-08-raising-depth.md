# Runa Raising Depth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add personality identity, Guardian Callings, a 16-node Growth Trait Board, signature passives, bond scenes, preferences, and cross-system raising bonuses without replacing the existing monthly loop or Guardian Expedition.

**Architecture:** Keep all new rules in focused pure modules. `game.ts` owns only persistent state, hydration, reducer actions, and cross-system composition. UI is added as independent overlays/panel sections and reuses existing frame assets; no character illustrations are synthesized in CSS.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, existing reducer/localStorage architecture.

## Global Constraints

- Preserve hub → schedule → training → dialogue → result → next month → hub.
- Guardian Expedition remains optional but benefits from raising choices.
- Existing save key remains `puppy-maker-save`.
- No premium currency, gacha, paid respec, or external dependency.
- Decorative character forms/outfits require image assets and are not faked with CSS.
- Existing game art is reused for this logic/UI phase.
- Main/PR merge is out of scope.
- Trait bonuses stay in the +1–5% range except defined first-action signatures.
- Growth Points cannot be purchased.
- Calling switching costs 300G and is limited to once per game month after the free first selection.
- Existing 100-slot Growth Archive and Guardian Evolution thresholds remain unchanged.

---

### Task 1: Personality Archetype and Preferences

**Files:**
- Create: `src/runa-personality.ts`
- Create: `src/runa-personality.test.ts`

**Interfaces:**
- Consumes: existing `Personality`, `ActivityId`, `GiftItemId`.
- Produces: `personalityArchetype(personality)`, `runaPreferences(archetype, calling)`.

- [ ] Write failing tests for 5 archetypes, tie/balanced rule, 5-point lead rule, favorite activity/gift mapping.
- [ ] Run `npm test -- src/runa-personality.test.ts` and verify failure because module is missing.
- [ ] Implement `RunaPersonalityArchetype = 'brave'|'gentle'|'curious'|'serene'|'balanced'` and deterministic preference mapping.
- [ ] Run targeted test and full `npm test`; verify green.
- [ ] Commit `feat: add Runa personality identity and preferences`.

### Task 2: Guardian Calling Rules

**Files:**
- Create: `src/guardian-callings.ts`
- Create: `src/guardian-callings.test.ts`

**Interfaces:**
- Produces: `GuardianCallingId`, `guardianCallingDefinitions`, `callingSwitchKey(year,month)`, `canSelectCalling(input)`, `applyCallingSelection(input)`.

- [ ] Write failing tests for four Callings, Guardian rank gate, free first choice, 300G switch, insufficient gold, and once-per-month switch lock.
- [ ] Verify RED.
- [ ] Implement pure selection/switch logic and Calling-to-activity mapping.
- [ ] Verify targeted and full test suite green.
- [ ] Commit `feat: add guardian calling rules`.

### Task 3: Growth Trait Board

**Files:**
- Create: `src/growth-traits.ts`
- Create: `src/growth-traits.test.ts`

**Interfaces:**
- Produces: `GrowthTraitId`, 16 definitions, `purchasedTraitSet`, `canPurchaseGrowthTrait`, `purchaseGrowthTrait`, `activeCallingTraits`.

- [ ] Write failing tests asserting exactly 16 nodes, four ordered nodes per Calling, costs 1/1/2/2, prerequisite enforcement, point spending, duplicate prevention, and off-Calling ownership persistence.
- [ ] Verify RED.
- [ ] Implement data-driven trait board.
- [ ] Verify green.
- [ ] Commit `feat: add growth trait board`.

### Task 4: Signature Passives and Calling Mastery

**Files:**
- Create: `src/calling-signatures.ts`
- Create: `src/calling-signatures.test.ts`
- Create: `src/calling-mastery.ts`
- Create: `src/calling-mastery.test.ts`

**Interfaces:**
- Produces: 8 signature IDs, `callingSignatures(activeCalling,purchasedTraits)`, `callingMasteryLevel(xp)`, `emptyCallingMastery()`.

- [ ] Write RED tests for node-2/node-4 signature unlocks and mastery thresholds 0/3/7/12/18.
- [ ] Implement pure derivation modules.
- [ ] Verify green.
- [ ] Commit `feat: add calling mastery and signature abilities`.

### Task 5: Persistent Raising Depth State

**Files:**
- Create: `src/raising-depth-state.ts`
- Create: `src/raising-depth-progression.test.ts`
- Modify: `src/game.ts`

**Interfaces:**
- Persistent fields: `activeCalling`, `callingHistory`, `callingMastery`, `callingLastSwitchKey`, `growthPoints`, `purchasedTraits`, `unlockedBondScenes`, `rewardedBondScenes`, `growthPointBossRewards`.
- New actions: `SET_GUARDIAN_CALLING`, `PURCHASE_GROWTH_TRAIT`.

- [ ] Write failing hydration/RESET/NEXT_MONTH preservation tests and reducer tests for Calling selection and trait purchase.
- [ ] Verify RED while all prior tests remain green.
- [ ] Implement `emptyRaisingDepthState`, hydration sanitization, state preservation, reducer actions.
- [ ] Verify full tests and `npm run build` green.
- [ ] Commit `feat: persist calling and trait progression`.

### Task 6: Bond Scenes and One-Time Rewards

**Files:**
- Create: `src/bond-scenes.ts`
- Create: `src/bond-scenes.test.ts`
- Create: `src/bond-scene-progression.test.ts`
- Modify: `src/game.ts`

**Interfaces:**
- Produces 10 `BondSceneDefinition`s and `eligibleBondScenes(progress)`.
- `game.ts` reconciles unlocked/rewarded scenes idempotently after relevant actions.

- [ ] Write RED tests for all 10 scene gates, ordering, major milestones, and no duplicate rewards.
- [ ] Implement scene definitions and eligibility.
- [ ] Wire automatic reconciliation and one-time rewards in reducer.
- [ ] Verify full suite/build green.
- [ ] Commit `feat: add persistent bond scenes`.

### Task 7: Monthly, Gift, and Expedition Cross-System Bonuses

**Files:**
- Create: `src/raising-depth-bonuses.ts`
- Create: `src/raising-depth-bonuses.test.ts`
- Modify: `src/game.ts`
- Modify: `src/expedition-combat.ts`
- Modify: `src/expedition-rewards.ts`

**Interfaces:**
- `trainingRaisingDepthBonus`, `giftRaisingDepthBonus`, `expeditionRaisingDepthModifiers`.
- Existing reducer actions gain monthly/S/boss Growth Point income and Calling mastery.

- [ ] Write RED tests for monthly +1 point, S +1, boss first clear +1, favorite activity personality +1, favorite gift affection +2, Caretaker gift +1, matched Calling trait activation, signature first-action behavior, and no replay duplication.
- [ ] Implement bounded bonus helpers.
- [ ] Compose helpers into `FINISH_TRAINING`, `GIVE_GIFT`, `FINISH_EXPEDITION_STAGE`, `NEXT_MONTH` without changing unrelated systems.
- [ ] Verify monthly and expedition regression suites green.
- [ ] Commit `feat: connect raising identity to gameplay`.

### Task 8: Calling and Trait Board UI

**Files:**
- Create: `src/RaisingIdentityOverlay.tsx`
- Create: `src/raising-identity.css`
- Modify: `src/App.tsx`
- Modify: `src/Root.tsx`

**Interfaces:**
- App exposes callbacks for `SET_GUARDIAN_CALLING` and `PURCHASE_GROWTH_TRAIT`.
- Root owns overlay visibility and supplies current GameState.

- [ ] Add pure display-model tests if needed before UI wiring.
- [ ] Build one frame-based overlay with 4 Calling cards, Calling mastery, available Growth Points, 16 trait nodes, prerequisites/costs, and signature preview.
- [ ] Reuse `/ui/popup_panel_frame.png`; CSS only handles layout/progress/state styling.
- [ ] Wire reducer callbacks explicitly; no DOM-click bridge.
- [ ] Verify full test/build green.
- [ ] Commit `feat: add guardian calling and trait board UI`.

### Task 9: Bond and Identity UI Integration

**Files:**
- Modify: `src/LayeredHome.tsx`
- Modify: `src/home-panels.css` or create `src/raising-bond.css`
- Modify: `src/GuardianExpeditionOverlay.tsx`

**Interfaces:**
- Bond panel shows identity title, personality, Calling mastery, favorite activity/gift, Growth Points, and 10 bond scenes.
- Expedition header displays identity title/Calling.

- [ ] Add/extend pure display model tests before UI changes.
- [ ] Integrate raising identity and scene list into existing Bond panel using existing frame assets.
- [ ] Add a single explicit “성장 방향” entry to open RaisingIdentityOverlay.
- [ ] Add active Calling/identity copy to Guardian Expedition header.
- [ ] Verify full suite/build green.
- [ ] Commit `feat: surface Runa identity and bond scenes`.

### Task 10: Full Regression, Migration, and Deployment Verification

**Files:**
- Modify only files required by failures.

**Interfaces:**
- No new product behavior; verification and targeted fixes only.

- [ ] Run full Vitest suite and confirm all monthly, annual, archive, expedition, calling, trait, and bond tests pass.
- [ ] Run `npm run build` and confirm TypeScript/Vite production build success.
- [ ] Fetch PR #2 metadata and confirm Draft/Open/Unmerged, base `feat/vertical-slice`, head `feat/v2-core-growth`.
- [ ] Verify latest head SHA in GitHub Actions is success.
- [ ] Verify matching Vercel preview deployment is READY; do not claim it if Git deployment has not appeared.
- [ ] Self-review the final patch for balance, duplicated reward paths, hydration gaps, and accidental CSS artwork.
- [ ] Commit any verification-only fixes as focused reversible commits.
