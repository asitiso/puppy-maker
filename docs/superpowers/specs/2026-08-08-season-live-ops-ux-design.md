# Season Live Ops UX Expansion Design

## Goal
Turn the already-implemented Season Journey and Weekly Directives systems into a complete player-facing long-term loop with a token sink, season history, and a compact home overlay.

## Scope

### Season Shop
- Spend the current season's token balance only.
- Four deterministic offers per season: gold pouch, recovery gift bundle, expedition material bundle, and one seasonal commemorative collectible.
- Each offer has a fixed token cost and a per-season purchase limit.
- Purchases are persisted with season-keyed purchase IDs so save/reload cannot duplicate limited rewards.
- Failed purchases return the same state object and never consume tokens.

### Season Archive
- Reuse `seasonJourneyHistory` as the source of truth.
- Expose compact derived records: season label, final score, completed tiers, tokens earned, and a rank derived from score.
- Do not duplicate historical state in a new store.

### Live Ops Overlay
- Independent React overlay rendered from Root, not embedded deeply into `LayeredHome`.
- Show current season, Journey score, next tier, current token balance, three deterministic weekly directives, shop offers, and historical seasons.
- Existing UI frame image assets are reused; CSS is only layout, typography, spacing, progress bars, and functional buttons.
- No new decorative art is approximated in CSS.

## Architecture
- `season-shop.ts`: pure catalog/purchase validation/reward resolution.
- `season-shop.test.ts`: unit contracts.
- `season-archive.ts`: derived history presentation model.
- `season-archive.test.ts`: rank/history contracts.
- `live-ops-ui.ts`: pure UI summary for current season/directives/shop/archive.
- `live-ops-ui.test.ts`: presentation-model contracts.
- `game.ts`: thin outer wrapper adding `PURCHASE_SEASON_OFFER` while delegating all existing behavior to the current game layer.
- `SeasonLiveOpsOverlay.tsx` + `season-live-ops.css`: player-facing overlay.
- `App.tsx` / `Root.tsx`: expose purchase callback and render/open the overlay.

## Balancing
- Gold pouch: 20 tokens -> 300 gold, limit 2/season.
- Recovery bundle: 25 tokens -> +1 herb tea and +1 star cookie, limit 1/season.
- Expedition cache: 30 tokens -> +2 of each expedition material, limit 1/season.
- Seasonal keepsake: 40 tokens -> persistent commemorative purchase record, limit 1/season; no stat power.

## Failure Handling
- Insufficient token balance: no-op, same object.
- Purchase limit reached: no-op, same object.
- Invalid save purchase keys: discarded during hydration.
- Current season changes: old purchase records remain for history/dedupe, current token balance uses the new season key.

## Verification
- RED/GREEN TDD for pure shop, archive, and reducer integration.
- Existing regression suite must remain green.
- Production TypeScript/Vite build must pass before claiming completion.
- Draft PR remains unmerged.
