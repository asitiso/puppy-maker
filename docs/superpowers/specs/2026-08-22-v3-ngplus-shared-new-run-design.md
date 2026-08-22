# V3 NG+ Shared NEW_RUN Runtime Design

Baseline: `integration/v3@ff6a8fe55b1b2df5d8cf1434bb9b607af4bda264`
Shared branch: `work/v3-ngplus-shared-state`
Tracking: #143 / final gate #144

## Goal

Make the real `game.ts` `NEW_RUN` action the single authoritative NG+ start boundary. It must consume the already-defined NG+ replay transition exactly once, produce a clean Spring replay state, preserve only intended long-term state, and remain save/reload/idempotency safe.

## Existing contracts to consume

- `prepareNewPossibilityV3State(current)` from 03 owns completed-ending eligibility, next `runNumber`, CampaignRun reset, Legacy echo promotion, Character Bond reset, and current/inherited World history separation.
- `resetTacticalForNgPlus(state)` from 04 owns Tactical reset semantics: records, first-clears, party and companion battle bonds reset; AUTO and battle-speed preferences preserved.
- Winter `commitWinterEnding` already archives the completed run. `NEW_RUN` must never increment `legacy.completedRuns` or append another `runSummary`.

## Authoritative NEW_RUN flow

1. On `NEW_RUN`, call `prepareNewPossibilityV3State(pickV3PersistentState(state))`.
2. If it returns `started:false`, return the original `GameState` by reference.
3. If it returns `started:true`, construct the next run from clean `initialState` run-local/core defaults.
4. Overlay the transition-owned V3 persistent state from step 1.
5. Overlay Tactical reset output from `resetTacticalForNgPlus(state)` so AUTO/speed preferences survive while all Tactical progression/runtime-facing persistent fields reset.
6. Preserve only explicitly long-term/meta/cosmetic preferences that are outside run-local growth/economy and are already part of the approved persistent contracts. Do not preserve raw growth, normal currencies, current Season/weekly state, current World state, current Character Bonds, Tactical first-clear/progression, or previous ending runtime markers.

## Reset/persist split

Reset to clean Spring defaults:
- raw/core growth (`stats`, `mastery`, run-local progression)
- normal currencies (`gold`, `gems`, and other run-local economy inherited from `initialState`)
- current Season/weekly progress, reward ledgers, scores and token balances
- current CampaignRun state except the transition-provided incremented run number
- current Character Bond state
- current World facts/progression
- Tactical records, first-clears, selected party and companion battle bonds
- current ending/event/runtime markers that belong to the completed run

Persist through approved contracts:
- `legacy`, compact run summaries and ending/career collections already represented by Legacy/persistent state
- promoted inherited World echoes and relationship echoes produced by the 03 transition
- semantic NG+ unlocks recalculated from canonical Legacy evidence
- Tactical AUTO and battle-speed preferences
- other explicitly long-term cosmetic/preferences already carried by the existing persistent contracts, if any

## Safety rules

- `NEW_RUN` is legal only when the 03 transition returns `started:true` from a committed Winter ending handoff.
- Repeating `NEW_RUN` after successful Spring re-entry is a strict no-op.
- Reloading the new Spring state and dispatching `NEW_RUN` again is also a no-op.
- `completedRuns` and `runSummaries` do not grow during `NEW_RUN`; Winter ending commit remains the archive authority.
- Current and inherited World facts remain structurally separate; inherited echoes cannot substitute for current-run evidence.
- No Fifth Path campaign content or Hollow content is introduced.
- No schema bump unless existing schema-v3 hydration demonstrably cannot represent the resulting state.

## Files

Expected production change:
- `src/game.ts`

Expected 06-owned verification:
- one focused NG+ shared-runtime regression test if additional coverage is needed beyond Macro B RED contracts

No App/Root/main/vercel changes are planned.

## Verification

RED evidence already exists on Macro B verify PR #149 and must become GREEN without weakening assertions:
- first `NEW_RUN`: `runNumber 1 -> 2`, phase `spring_exploration`, active campaign cleared
- no duplicate completed-run archive
- raw growth and normal currencies reset
- Season/weekly current state and reward ledgers reset
- Tactical progression reset while AUTO/speed preferences persist
- save/load/reload idempotent
- second `NEW_RUN` after clean Spring is no-op
- at least three ending -> NEW_RUN cycles stay stable with no duplicate history, state leakage or raw-power inflation

After the shared patch is independently GREEN, Macro B lead composes the exact shared head with the already-GREEN 03 and 04 heads and reruns Macro B full test/build. Only after Macro A and Macro B are both exact GREEN may 06 build `verify/v3-ngplus-composite` and run the final NG+ replay E2E before the single allowed `integration/v3` promotion.
