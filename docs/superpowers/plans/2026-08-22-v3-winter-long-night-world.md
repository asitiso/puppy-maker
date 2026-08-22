# V3 Winter Long Night World Slice

Baseline: `integration/v3@ce2228cdced098da900e60e6eaafcf2242095b86`
Lane: Winter B (#126)
Room: 02 World
Branch: `work/v3-winter-world`

## Approved bounded design

02 exposes only the World-owned input/consequence contract for The Long Night.

- consume committed Autumn Major Choice and matching current-run typed World Fact
- inherited facts never substitute for current-run Autumn commitment evidence
- reuse existing Expedition stages/regions
- produce four campaign-specific World pressures and Tactical adjustment keys
- all `exceptional_victory | victory | costly_victory | defeat` outcomes resolve to a typed fail-forward Winter World consequence
- no persistence, shared game/save, App/Root, Tactical engine, Ending UI, or NG+ changes

## TDD

1. RED: `winter-long-night-world.test.ts` imports missing production module and defines the contract.
2. GREEN: add the smallest pure World adapter satisfying the tests.
3. Verify targeted, full suite, `tsc -b`, production build.
4. Keep Draft/unmerged and hand exact GREEN candidate to Lane B lead 04.
