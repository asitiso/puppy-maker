# V3 Summer Tactical Climax Implementation Plan

1. RED: keep `src/summer-tactical-climax.test.ts` failing only because the production module is absent.
2. Minimal implementation: add `src/summer-tactical-climax.ts` using only existing `campaignEncounterToTacticalScenario`, objective, modifier, stage, and battle contracts.
3. Verify independent Tactical candidate: climax targeted tests, scenario tests, terminal handoff, Tactical stability including 10/50/100 AUTO checkpoints, full suite, `tsc -b`, production build.
4. Compose exact 02 Summer World candidate `31d5277d598640beb9f3a6660b22f3c6858721fd` with exact 04 GREEN candidate on `verify/v3-summer-world-tactical`.
5. RED/GREEN Lane E2E: all four routes World identity -> Tactical climax -> existing battle -> terminal result -> once-only handoff -> authoritative World outcome/fail-forward history.
6. Final Lane B gates: four-route E2E, Tactical stability/stress, full suite, TypeScript, production build. Keep Draft/unmerged; no integration/main/prod.
