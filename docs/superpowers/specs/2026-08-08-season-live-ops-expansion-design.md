# Season Live Ops Expansion Design

## Goal
Turn Season Journey from a passive reward counter into a useful recurring loop with a Season Shop, a lightweight home overlay, and a season history archive without disturbing the core hub → schedule → training → dialogue → result → next month → hub loop.

## Constraints
- Keep `game-base.ts` and the existing raising/expedition engine stable.
- Extend Live Ops through focused modules and the existing `game-live-base.ts` / `game.ts` wrapper boundary.
- Preserve Save Schema v2 and resilient backup behavior.
- No decorative CSS fake art; reuse existing panel/image assets for UI decoration.
- Code-render text, numbers, progress, and layout.
- Every economy reward/purchase must be deterministic and deduplicated.
- New state must hydrate safely from old/corrupt saves.
- PR #2 stays draft/open/unmerged.

## Architecture

### 1. Season Shop domain
Create `src/season-shop.ts` as a pure domain module. It defines a compact seasonal catalog, purchase limits, deterministic purchase keys, affordability/eligibility checks, and reward payloads. The first catalog should be deliberately small: a repeatable gold package plus limited gem, gift, recovery, and collectible-style offers. The shop consumes only `seasonTokenBalances`; it does not introduce another currency.

Persist purchase history as `seasonShopPurchases: string[]`. Keys include the season key, offer id, and purchase ordinal where needed. Hydration removes malformed keys and purchases that exceed an offer's limit.

### 2. Game integration
Add a `BUY_SEASON_SHOP_OFFER` action in the Live Ops layer. A purchase succeeds only when the offer exists, the current season has enough tokens, and the seasonal purchase limit is not exhausted. Successful purchase atomically deducts tokens, records the purchase key, and grants the offer reward. Rejected purchases return the same state object so callers can cheaply detect no-op behavior.

### 3. Home UI
Create a separate `SeasonJourneyOverlay` component and stylesheet instead of growing `LayeredHome.tsx`. The existing home gets one compact entry affordance. The overlay shows current season, Journey score and next-tier progress, token balance, three weekly directives, tier rewards, and the Season Shop. It reuses existing panel/frame assets where practical.

### 4. Season history
Extend the overlay with a history view backed by existing `seasonJourneyHistory`. Historical records remain read-only. Each row shows season key, final score, completed tiers, and earned tokens. No separate archive state is introduced unless existing history lacks a required derived value; prefer deriving display values from saved score/claims.

### 5. Reward feedback
Expose a small transient UI message for successful shop purchases and newly earned Journey tiers using existing state/feedback conventions. Do not add a global notification framework.

## Data flow
Player action → existing reducer → Live Ops progression → Journey/weekly rewards → persisted Live Ops state. Shop flow is Home overlay → `BUY_SEASON_SHOP_OFFER` → validation → token deduction + reward + purchase key → existing resilient save writer.

## Regression strategy
TDD coverage must include: insufficient tokens no-op, invalid offer no-op, purchase limit dedupe, correct token deduction, each reward type, hydration sanitization, save/load persistence, tier reward once only, weekly reward once only, hydration without duplicate reward, season transition isolation, old season history retention, and new season separate balances/purchases.

World/renown tests must explicitly isolate unrelated Live Ops rewards rather than weakening economy assertions.

## Delivery order
1. Confirm CI for the prior world-progression isolation commit is GREEN.
2. Season Shop pure domain tests and implementation.
3. Persistent state/hydration tests.
4. Reducer integration tests and implementation.
5. Season Journey overlay + shop + weekly directive UI.
6. Season history view.
7. Full regression tests and production build.
8. Verify Vercel latest deployment SHA/READY.
9. Update Draft PR #2 body; do not merge.
