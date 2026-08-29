# V14 Detail Completion R2 — Guided Play & Tactical/Result Readability

Date: 2026-08-29
Baseline: integration/v3@96f30977482bbab01179f105158241a77c5abeaf
Branch: work/v14-detail-completion-r2

## Goal

Finish the highest-value remaining guided-play and tactical result readability gaps without changing combat rules, rewards, expedition progression, save schema, or introducing new UI frameworks.

## Architecture

Keep `TacticalBattleScreen` as the presentation/input boundary and preserve the existing tactical engine, AI, ultimate resolver, session callbacks, and `ActionResultSummary` ownership. Improvements are semantic/presentation-only: expose selected/current state to assistive technology, make battle-result actions readable in the Korean UI, and preserve the existing exit/retry callback priority. Use existing mobile tokens and compact-height/reduced-motion rules rather than adding a parallel layout system.

## Files

- Create: `src/v14-detail-completion-r2-regression.test.ts`
- Modify: `src/TacticalBattleScreen.tsx`
- Modify only if evidence requires: `src/tactical-battle.css`

## Task 1 — RED: tactical state and result contracts

1. Add a source regression test requiring:
   - current timeline actor exposes `aria-current`
   - selected tactical cards and bond ultimates expose `aria-pressed`
   - AUTO exposes `aria-pressed={auto}`
   - result overlay is modal via `aria-modal="true"`
   - result actions use Korean labels (`홈으로 돌아가기`, `다시 도전`) instead of literal `EXIT` / `RETRY`
   - callback behavior remains `onExit ?? onRetry` for the primary continuation and `onRetry` for the optional second action
2. Open a draft PR so GitHub Actions runs the test.
3. Verify the new contract fails before production code changes.

## Task 2 — GREEN: minimal tactical presentation implementation

1. Add `aria-pressed={auto}` to AUTO.
2. Mark the active timeline item with `aria-current="true"`.
3. Add `aria-pressed` to bond ultimate buttons and tactical hand cards based on existing selected state.
4. Add `aria-modal="true"` to the result dialog.
5. Keep callback ordering unchanged while replacing English result CTA labels with Korean:
   - primary when exit exists: `홈으로 돌아가기`
   - primary when only retry exists: `다시 도전`
   - secondary retry when both exist: `다시 도전`
6. Keep result/combat progression logic untouched.
7. Re-run CI and confirm the RED contract turns GREEN.

## Task 3 — Mobile/readability verification

1. Inspect compact-height and <=430px tactical CSS for overlap or unreachable result actions.
2. Modify CSS only if source evidence shows a concrete regression.
3. Preserve reduced-motion behavior and existing intentional arena/feed scrolling zones.

## Task 4 — Release gate

1. Full `npm run test` and `npm run build` through GitHub Actions.
2. Verify Vercel preview status when available.
3. Merge the feature PR into `integration/v3` only after GREEN.
4. Open integration→main release PR and verify release-gate CI.
5. Merge to main, then freshly verify main CI and production Vercel deployment.
6. Compare `integration/v3` and `main`; expected code-tree difference after release is zero, with main ahead only by the release merge commit.

## Non-goals

- No tactical balance changes.
- No AP/MP/card/AI/ultimate rule changes.
- No reward or expedition progression changes.
- No save schema changes.
- No new animation framework.
- No speculative Outing/Story edits without a source-backed defect.
