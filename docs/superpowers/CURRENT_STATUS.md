# Puppy Maker Current Development Status

> This file is the handoff baseline for scheduled or agentic continuation. Repository code, CI, and newer commits remain authoritative if they disagree with this snapshot.

## Active branch

- Branch: `work/v15-mobile-rpg-foundation`
- Pull request: #245 — V15 Mobile RPG foundation
- Last verified implementation baseline: `f5318baddf246127958bfefc290164cb84cc54db`
- Verification: GitHub Actions CI #2420 passed both tests and production build.

## Completed work

- Mobile RPG exploration foundation is implemented: deterministic movement/collision/camera runtime, mobile joystick, framed story overlay, forest exploration, progression guards, and authored exploration art.
- Village and lakeside have been moved onto the same exploration runtime.
- Outing destination selection menu has been replaced by a 2400×1600 walkable crossroads overworld.
- Crossroads contains physical portals for `forest`, `village`, and `lakeside` plus an in-world exit home.
- Region exit returns to the crossroads instead of a destination menu.
- Portal visual feedback respects `prefers-reduced-motion`.
- `src/exploration/outing-crossroads.test.ts` locks the crossroads world/portal/exit contract.

## Continuation rule

1. Start from the latest branch HEAD and inspect PR #245 plus current CI before changing code.
2. Do **not** repeat tasks in `2026-09-14-mobile-rpg-foundation.md` or `2026-09-14-outing-overworld.md`; those implementation scopes are complete even if an older historical checkbox remains unchecked.
3. If HEAD CI is failing, fix that exact failure first and avoid starting a new feature.
4. If HEAD CI is green and there is no newer approved implementation plan, stop at the verified baseline and report that a new design/plan is required rather than inventing scope.
5. Preserve the existing `onOuting(location)` mutation path and existing save/progression semantics unless a newer approved design explicitly changes them.

## Latest documentation update

The Outing Overworld plan is marked complete in commit `58750f7bbd342d8c1e45f91b1c031086088548b5`. CI for documentation-only commits should still be inspected before using them as the next verified baseline.
