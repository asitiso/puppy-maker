# Season Live Ops UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the Season Live Ops loop with a token shop, derived season archive, and player-facing overlay while preserving all existing game systems.

**Architecture:** Add pure domain modules first, then a thin reducer wrapper for season purchases, then pure UI presentation data, then an independent Root-level overlay. Existing `game-base.ts` / `game-live-base.ts` behavior is delegated unchanged.

**Tech Stack:** TypeScript, React, Vitest, Vite, existing image/CSS assets.

## Global Constraints
- Work only on `feat/v2-core-growth`.
- Do not merge PR #2 or main.
- Use TDD: failing test, verify RED, minimal implementation, verify GREEN.
- Do not approximate decorative game art with CSS.
- Preserve save compatibility and same-object no-op behavior for invalid purchases.

---

### Task 1: Season Shop Domain

**Files:**
- Create: `src/season-shop.test.ts`
- Create: `src/season-shop.ts`

**Interfaces:**
- Produces `seasonShopOffers(seasonKey)`, `seasonPurchaseKey(seasonKey, offerId, ordinal)`, `resolveSeasonPurchase(input)`.

- [ ] Write tests for the four offers, insufficient tokens, and per-season limits.
- [ ] Verify RED because `season-shop.ts` does not exist.
- [ ] Implement the fixed offer catalog and pure purchase resolution.
- [ ] Verify tests GREEN.
- [ ] Commit.

### Task 2: Season Shop Persistent State + Reducer

**Files:**
- Modify: `src/live-ops-state.ts`
- Modify: `src/live-ops-state.test.ts`
- Create: `src/season-shop-progression.test.ts`
- Modify: `src/game.ts` (or introduce one additional thin wrapper if safer).

**Interfaces:**
- Adds `seasonShopPurchases:string[]`.
- Adds action `{type:'PURCHASE_SEASON_OFFER'; offerId:SeasonShopOfferId}`.

- [ ] Write hydration and reducer tests first.
- [ ] Verify RED.
- [ ] Sanitize purchase keys during hydration.
- [ ] Apply token deduction and rewards only on valid purchases; invalid purchase returns the identical state object.
- [ ] Verify full suite GREEN.
- [ ] Commit.

### Task 3: Season Archive Presentation

**Files:**
- Create: `src/season-archive.test.ts`
- Create: `src/season-archive.ts`

**Interfaces:**
- Produces `seasonArchiveRecords(history)` with score-derived rank labels.

- [ ] Write tests for empty history, ordering, and rank boundaries.
- [ ] Verify RED.
- [ ] Implement pure derivation from `seasonJourneyHistory`.
- [ ] Verify GREEN.
- [ ] Commit.

### Task 4: Live Ops UI Summary

**Files:**
- Create: `src/live-ops-ui.test.ts`
- Create: `src/live-ops-ui.ts`

**Interfaces:**
- Produces `liveOpsUiSummary(state)` with current Journey score/tier, tokens, weekly directives, shop offer purchase state, and archive rows.

- [ ] Write presentation-model tests.
- [ ] Verify RED.
- [ ] Implement using existing pure domain functions only.
- [ ] Verify GREEN and production build.
- [ ] Commit.

### Task 5: Season Live Ops Overlay

**Files:**
- Create: `src/SeasonLiveOpsOverlay.tsx`
- Create: `src/season-live-ops.css`
- Modify: `src/App.tsx`
- Modify: `src/Root.tsx`

**Interfaces:**
- `SeasonLiveOpsOverlay({state,onClose,onPurchase})`.
- App exposes season-purchase dispatcher to Root.

- [ ] Add overlay component driven only by `liveOpsUiSummary`.
- [ ] Reuse existing panel image assets; CSS only for functional layout/progress/buttons.
- [ ] Add Root-level open/close state and compact home entry.
- [ ] Connect purchase callback.
- [ ] Run full tests + production build.
- [ ] Commit.

### Task 6: Final Regression / Deployment Metadata

**Files:**
- Modify PR #2 description only after a green code SHA.

- [ ] Freshly verify GitHub Actions test/build on latest SHA.
- [ ] Check Vercel deployment metadata for the exact latest SHA; claim READY only if exact SHA is READY.
- [ ] Update Draft PR #2 description with Save v2 + Season Live Ops + shop/archive/UI scope and verification.
- [ ] Keep PR draft/unmerged.
