# V3 NG+ Replay Experience — Macro A Design

Baseline: `integration/v3@ff6a8fe55b1b2df5d8cf1434bb9b607af4bda264`
Tracking: #142
Lead: 05 Hub/UI
Work branches: `work/v3-ngplus-raising`, `work/v3-ngplus-world`, `work/v3-ngplus-hub`
Verify: `verify/v3-ngplus-replay-experience`

## Goal

Deliver one complete player-facing NG+ replay experience after a completed Winter ending:

`new possibility entry`
→ `past-life / reunion / world echoes`
→ `fresh Spring replay`
→ `ordinary affinity and qualitative tendencies`
→ `Path Convergence with at least two normal campaigns`
→ `optional additive fifth_path_candidate hint`
→ `Home / Journey / Path UI on 360 / 390 / 430`

Macro A consumes authoritative NG+ runtime state from Macro B. It does not own archive, run-number increment, reset/persist split, shared save wiring, or authoritative new-run state transitions.

## Existing frozen room contracts

### 01 Raising
Candidate: `work/v3-ngplus-raising@5130d28bab8ace114adc1f67ec39697f37889061`

05 consumes only qualitative replay presentation semantics from 01:
- past-life context
- representative and shared reunion context
- legacy reasons
- current-run Spring Path Convergence candidates
- optional `fifth_path_candidate` eligibility/hint

Current-run `pathConvergence` remains authoritative for normal candidate tendency and ordering. Prior-run context must never overwrite current-run affinity or reduce normal campaign access below two candidates.

### 02 World
Candidate: `work/v3-ngplus-world@88d30ce9b7a6c4c3c81209b95dab818cf93f3898`

05 consumes `buildNgPlusWorldEchoPresentation` output only.

World echo constraints:
- inherited entries remain `source: 'inherited'`
- `currentFacts` remain current-run evidence only
- same canonical fact may exist in both current and inherited channels without collapsing
- inherited echoes may change flavor, starting events, hidden quest hints, rationale, or qualitative rewards
- inherited echoes cannot remove or replace the ordinary four-campaign replay path

## 05 Player-Facing Architecture

05 adds a dedicated NG+ replay presentation surface rather than teaching Spring domain modules about NG+ state.

### 1. New Possibility Entry

A compact transition shell presented after a completed ending when Macro B exposes an active NG+ replay state.

It shows:
- previous run as a completed memory
- current state as a new possibility
- one primary action to enter the fresh Spring replay

It never performs the authoritative reset itself and never renders run archive internals or numeric carry-over values.

### 2. Replay Home

The Spring replay home remains compressed. It distinguishes three concepts explicitly:
- current run
- inherited memory/echo
- ordinary current-run campaign direction

The home may surface at most a small qualitative echo summary. It must not become a history dashboard.

### 3. Replay Journey

Journey is the detailed replay-memory surface. It may display:
- past-life dialogue
- representative reunion memory for Mira / Kael / Rex / Selene
- shared reunion hooks for Noa / Eiden
- Lyra repetition / possibility hint when provided
- inherited World Echo entries
- current-run Spring events separately from inherited material

Inherited and current-run sections use distinct labels and data channels.

### 4. Replay Path Convergence

05 reuses existing qualitative campaign presentation rules:
- never show raw affinity numbers
- normal Path Convergence must retain at least two main campaigns
- prior-run evidence may appear only as qualitative rationale
- `fifth_path_candidate` may render as an additional special candidate only when upstream semantic eligibility says it is available
- no Fifth Path campaign commit, route content, battle content, World content, Ending, or Hollow content is implemented in this Wave

The special candidate must visually read as a possibility/hook rather than a replacement for the ordinary candidates.

### 5. Composition Adapter

Macro verify owns a thin adapter that combines:
- 01 NG+ Raising presentation semantics
- 02 NG+ World Echo presentation
- 05 replay UI view model

The adapter must not:
- calculate affinity
- calculate Legacy eligibility
- calculate World echo eligibility
- merge inherited and current World Facts
- mutate Character Bond state
- own NG+ reset/save state

## Presentation Boundary

The UI must never expose:
- raw affinity values
- numeric trust
- raw career score
- hidden requirement totals
- optimization thresholds
- raw Legacy power values

Past-life evidence is intentionally qualitative and must remain weaker than current-run player choice authority.

## Mobile and Accessibility Contract

The replay experience preserves the established 05 guarantees:
- 360px, 390px, 430px widths
- `100dvh` with viewport fallback where needed
- top and bottom safe areas
- minimum 44px interactive targets
- Korean long-text wrapping
- dialog focus containment
- ESC/back close semantics
- focus return to opener
- reduced-motion support
- no empty image `src` warnings

## Failure and Malformed Input Behavior

If replay presentation input is stale or malformed:
- current-run normal Spring candidate access stays authoritative
- unknown inherited echo IDs are ignored by upstream typed contracts rather than rendered as free-form history
- missing replay-memory presentation produces an ordinary Spring replay UI, not a broken or blocked screen
- invalid special candidate input cannot create playable Fifth Path content

## TDD and Composition Sequence

1. 05 RED: NG+ replay UI tests import missing production module(s).
2. 05 GREEN: implement the minimum New Possibility / Replay Home / Journey / Path presentation and mobile/accessibility contracts.
3. Freeze exact 05 candidate after targeted + full + `tsc -b` + production build.
4. Compose exact 01, 02, and 05 frozen candidate SHAs on `verify/v3-ngplus-replay-experience`.
5. Macro RED: add one end-to-end replay experience test that fails only because the composition adapter is absent.
6. Macro GREEN: add the minimum adapter with no shared-state ownership.
7. Verify:
   - completed prior run can be represented as `new possibility`
   - past-life/reunion/world echoes remain inherited context
   - fresh Spring current-run state remains distinct
   - Path Convergence retains >=2 normal campaigns
   - optional `fifth_path_candidate` is additive only
   - raw optimization values never reach UI
   - 360/390/430 accessibility contracts remain GREEN
   - full test suite, `tsc -b`, production build GREEN
8. Freeze Macro A Draft PR and hand exact head SHA to #144 / 06.

## Authority and Scope Rules

- `integration/v3` remains frozen during Macro A development.
- 05 never merges directly to `integration/v3`, `main`, or production.
- Macro A uses exact room candidate SHAs; 06 must not reconstruct room candidates one-by-one for the final gate.
- Macro B owns authoritative NG+ state transition/reset/save behavior.
- Fifth Path main campaign content remains CLOSED.
- Hollow remains CLOSED.
