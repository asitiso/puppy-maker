# Outing, Gifts, and Inventory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing static outing and bag home buttons into real outing, consumable gift, memory, and achievement systems.

**Architecture:** Keep the existing `GameState` reducer as the source of truth, but place outing/item definitions and pure effect rules in `src/adventure.ts`. `game.ts` adds persistent inventory/visited-outing state, hydration, reducer actions, memories, and achievements. `LayeredHome.tsx` reuses the current popup frame to render actionable outing and bag panels.

**Tech Stack:** React, TypeScript, Vite, Vitest.

## Global Constraints

- Keep `feat/v2-core-growth` isolated; do not merge PR #2 or main.
- Do not add a new screen route for outing or inventory.
- Reuse existing popup UI assets and code-render all Korean text.
- No shop, rarity, equipment, or new economy in this update.
- Preserve existing save compatibility.

---

### Task 1: Pure outing and gift rules

**Files:**
- Create: `src/adventure.ts`
- Create: `src/adventure.test.ts`

**Interfaces:**
- Produces: `OutingLocationId`, `GiftItemId`, `outingDefinitions`, `giftDefinitions`, `startingInventory()`, `applyOutingEffects()`, `applyGiftEffects()`.

- [ ] **Step 1: Write failing tests**

Cover the three outing definitions, the three gift definitions, starting quantities, bounded stat effects, and personality deltas.

- [ ] **Step 2: Run `npm run test`**

Expected: FAIL because `./adventure` does not exist.

- [ ] **Step 3: Implement `src/adventure.ts`**

Use stable IDs:

```ts
export type OutingLocationId = 'forest' | 'village' | 'lakeside';
export type GiftItemId = 'star_cookie' | 'herb_tea' | 'fox_charm';
```

Definitions:

```ts
forest: fatigue +8, curiosity +2, reward star_cookie
village: fatigue +6, kindness +2, reward fox_charm
lakeside: fatigue +4, stress -8, calmness +2, reward herb_tea
```

Gift effects:

```ts
star_cookie: affection +6, stress -4
herb_tea: fatigue -8, calmness +2
fox_charm: affection +3, courage +2
```

- [ ] **Step 4: Run tests**

Expected: adventure tests PASS.

- [ ] **Step 5: Commit**

`feat: add outing and gift rules`

---

### Task 2: Persist inventory, outings, memories, and achievements

**Files:**
- Modify: `src/game.ts`
- Create: `src/adventure-progression.test.ts`

**Interfaces:**
- Consumes: adventure IDs and definitions.
- Produces reducer actions `GO_OUTING`, `GIVE_GIFT` and state fields `inventory`, `visitedOutings`.

- [ ] **Step 1: Write failing progression tests**

Verify:

```ts
hydrateGameState(legacy).inventory === { star_cookie: 2, herb_tea: 1, fox_charm: 1 }
hydrateGameState(legacy).visitedOutings === []
```

Verify first forest outing:

```ts
const next = reducer(initialState, { type: 'GO_OUTING', location: 'forest' });
expect(next.visitedOutings).toEqual(['forest']);
expect(next.memories).toContain('first_outing');
expect(next.memories).toContain('forest_memory');
expect(next.inventory.star_cookie).toBe(initialState.inventory.star_cookie + 1);
```

Verify gift consumption and no-op at zero.

Verify achievement eligibility for `little_explorer` and `thoughtful_giver`.

- [ ] **Step 2: Run tests**

Expected: FAIL because state fields/actions/memories/achievements are absent.

- [ ] **Step 3: Implement state and hydration**

Add memory IDs:

```ts
'first_outing' | 'forest_memory' | 'village_memory' | 'lakeside_memory' | 'first_gift'
```

Add achievement IDs:

```ts
'little_explorer' | 'thoughtful_giver'
```

Add `inventory` and `visitedOutings` to `GameState`, clone, initial state, hydration, and validation.

- [ ] **Step 4: Implement reducer actions**

`GO_OUTING` must apply effects, add one deterministic location reward item, dedupe visits/memories, and derive condition.

`GIVE_GIFT` must return the original state unchanged when quantity is zero; otherwise decrement one, apply effects, add `first_gift`, and derive condition.

- [ ] **Step 5: Run `npm run test` and `npm run build`**

Expected: all pass.

- [ ] **Step 6: Commit**

`feat: add outing inventory and gift progression`

---

### Task 3: Connect bag and outing panels to live state

**Files:**
- Modify: `src/Root.tsx`
- Modify: `src/LayeredHome.tsx`
- Modify: `src/home-panels.ts` only if static fallback text must be removed.
- Modify: `src/home-panels.css` only for existing panel action states.

**Interfaces:**
- Root passes `onOuting(location)` and `onGift(item)` callbacks that dispatch reducer actions.
- LayeredHome renders live quantities and live action buttons.

- [ ] **Step 1: Add callbacks from `App`/`Root` without DOM querying**

Expose reducer-backed action callbacks using the existing explicit state/navigation bridge pattern.

- [ ] **Step 2: Replace static `outing` popup rows**

Render:

```text
별빛 숲 — 호기심 ↑ · 피로 +8
마법 마을 — 다정함 ↑ · 피로 +6
바람 호숫가 — 침착함 ↑ · 스트레스 ↓
```

Completed locations display `방문함`.

- [ ] **Step 3: Replace static `bag` popup rows**

Render each item with quantity and `선물하기` action. Disable when quantity is 0.

- [ ] **Step 4: Update bond collection summary**

Include `외출 기억 x/3` using `visitedOutings.length`.

- [ ] **Step 5: Run `npm run test` and `npm run build`**

Expected: all pass.

- [ ] **Step 6: Commit**

`feat: connect outings and gifts to layered home`

---

### Task 4: Regression and deployment verification

**Files:**
- Test files only if a regression gap is discovered.

- [ ] **Step 1: Run full CI**

Required evidence: all Vitest files pass and production build exits 0.

- [ ] **Step 2: Verify Vercel deployment**

Confirm latest deployment SHA equals the latest branch head and state is `READY`.

- [ ] **Step 3: Verify PR remains draft/open/unmerged**

PR #2 must remain based on `feat/vertical-slice`.

- [ ] **Step 4: Update PR description**

Add outing, inventory, gift, and exploration achievement scope.
