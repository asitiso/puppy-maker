# World Progression UI Design

## Goal
Surface the already-implemented world progression systems in the existing home and Guardian Expedition experience without adding a new navigation mode or replacing existing art.

## Constraints
- Preserve the existing hub → schedule → training → dialogue → result → next month → hub flow.
- Do not merge PR #2.
- Do not replace decorative image assets with CSS-drawn artwork.
- Reuse existing UI frame/effect assets for visual chrome; render text, numbers, progress, and layout in React/CSS.
- Keep world progression additive to existing expedition rewards and Calling systems.
- Keep mobile readability as the primary layout constraint.

## Architecture
Use a small pure presentation model in `world-ui.ts` so labels, percentages, season tier state, regional renown summaries, contract status, and last-result feedback are deterministic and unit-testable. React components consume that model rather than reimplementing progression math.

`WorldProgressOverlay.tsx` will be an independent overlay rendered by `Root.tsx`. Its closed state is a compact home card using the existing `info_card_frame.png`. Its open state is a scrollable world-status panel using existing frames and no new illustrated CSS artwork.

`GuardianExpeditionOverlay.tsx` will receive world context directly from `GameState`: the current monthly world event will appear at the top of the map, regional cards will show renown levels, and the result screen will show renown/season/contract/event bonuses from `lastWorldProgress`.

## Home World Panel
Closed card:
- `WORLD PROGRESS`
- current monthly event title
- current season score and next tier threshold
- completed monthly contracts count

Open panel sections:
1. Monthly world event: title, description, featured region, bonus summary.
2. Expedition season: score, current tier progress, 4 reward tiers with claimed/earned/locked state.
3. Regional renown: all 3 regions, level, raw renown, next-level progress.
4. Monthly contracts: progress/target and completed/rewarded state.

Season rewards remain auto-claimed during normal play. The panel is informational and does not add another claim callback.

## Guardian Expedition Integration
Map:
- Add a world-event strip beneath the expedition header.
- Mark the event-featured region in addition to the existing next-stage recommendation.
- Show region renown level in each region heading.

Result:
- Keep the existing expedition reward grid.
- Add a compact world-progress block when `lastWorldProgress` exists.
- Display renown gained, season points, event bonus, automatically claimed season tiers, and newly completed contracts.

## Error and Legacy Behavior
If old saves contain no world fields, `hydrateGameState` already creates safe defaults. UI helpers must clamp invalid percentages and tolerate no next reward tier. If `lastWorldProgress` is null, the result UI simply omits the extra block.

## Testing
- Unit-test pure world UI summaries for default state, tier progression, maxed renown, contracts, and result feedback.
- Existing reducer tests continue covering reward correctness/dedupe.
- CI must pass all tests and production build after each integration stage.
- Vercel preview readiness is checked after the final GREEN commit; Vercel READY is not treated as a replacement for GitHub test CI.
