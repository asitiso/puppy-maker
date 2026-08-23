# V3 Hollow Path Systems Design

## Context

Hollow Macro B (#172) owns the authoritative Hollow system layer on `work/v3-hollow-systems`, based on `integration/v3@62e5afe30f3fdbe8232a285b3d97af9a9ba5892d`. Macro A consumes semantic outputs but never owns danger, route, reward, persistence, or Tactical authority.

The existing V3 model already has `CampaignRoute = 'normal' | 'hollow'` and a legacy `dangerState:{score,behaviors}` field. The current raw score is not sufficient as the authoritative Hollow contract because duplicate dispatch, reload/re-entry, and inherited history could otherwise farm or accidentally re-trigger Hollow.

## Goals

- Derive Hollow eligibility from canonical, sanitized current-run danger evidence.
- Make repeated identical actions/reloads idempotent.
- Keep inherited dangerous history flavor-only; it may alter presentation context but never satisfy current-run authority and never auto-select Hollow.
- Candidate status only exposes a final dangerous choice opportunity. It never mutates route.
- Explicit refusal resolves the opportunity while preserving the current route.
- Explicit acceptance alone commits `activeRoute='hollow'` exactly once.
- Reuse existing World, Expedition, 3v3 Tactical, Season claim, Bond, ending, Legacy, save/load, and NG+ systems.
- Make victory/costly victory/defeat all fail-forward through the Hollow arc.
- Preserve normal and True Path correctness.

## Authoritative danger model

### Canonical evidence

Add a typed evidence registry with these semantic IDs:

- `ally_sacrifice`
- `instrumental_bond`
- `civilian_tradeoff`
- `forbidden_relic`
- `rift_dependence`
- `veyr_power`

Each evidence item is exactly-once within the current run. The authoritative state is a unique evidence set, never an additive numeric score.

The existing `dangerState.score` remains only for backward-compatible hydration. Hollow derivation does not trust it. Existing `dangerState.behaviors` may be mapped into canonical evidence during hydration/derivation when the mapping is unambiguous, but repeated behaviors cannot create duplicate evidence.

### Semantic tier

Expose only semantic tier/evidence to Macro A:

- `stable`: fewer than two distinct current-run evidence IDs
- `fractured`: at least two distinct current-run evidence IDs, but candidate conditions are not satisfied
- `hollow_candidate`: at least three distinct current-run evidence IDs and at least one severe evidence

Severe evidence:

- `ally_sacrifice`
- `forbidden_relic`
- `veyr_power`

The threshold is internal system logic and must never be surfaced as a raw UI score or meter.

### Inherited history

Legacy may retain compact Hollow echoes after a completed run, but these are structurally separate from current-run evidence. Inherited evidence can only be surfaced as semantic history/flavor context. It is never counted toward current-run `hollow_candidate` derivation.

## Evidence application

Dangerous choices enter the system through canonical adapters that return one evidence ID and a short-term gameplay benefit. Applying the same evidence twice returns `already_recorded` and leaves state unchanged.

Existing behavior mapping:

- `sacrificed_ally_for_victory` -> `ally_sacrifice`
- `exploited_bond` -> `instrumental_bond`
- `ignored_civilians` -> `civilian_tradeoff`
- `used_forbidden_relic` -> `forbidden_relic`
- `accepted_veyr_power` -> `veyr_power`

`rift_dependence` is produced by Hollow-specific World/Tactical adapters rather than inferred from a raw score.

## Final dangerous-choice opportunity

Add a current-run resolved-opportunity marker so an accept/refuse opportunity cannot replay after reload.

Rules:

- Opportunity is available only while derived tier is `hollow_candidate`.
- Candidate status does not mutate `activeRoute`.
- `refuse` preserves the current route (`normal` or existing valid route) and records the opportunity as resolved.
- `accept` records the opportunity as resolved and sets `activeRoute='hollow'`.
- Repeated accept/refuse after resolution returns `already_resolved` with no mutation.
- Acceptance is rejected when candidate conditions are absent.

## Hollow runtime

Hollow runtime is an adapter over existing systems, not a replacement stack.

### Season objectives

Use the existing campaign seasonal claim ledger with Hollow route-aware objective IDs for Summer, Autumn, and Winter. Claims are exactly-once and season-sequenced.

### World facts

Register stable Hollow world facts that distinguish current-run consequences from inherited echoes. Current Hollow facts are stored in `worldHistory.currentFacts`; intended NG+ echoes are promoted through existing Legacy mechanisms only at completed-run handoff.

### Tactical

Reuse the existing 3v3 engine and existing stages/regions. Hollow scenarios are typed adapters that select existing stage IDs and translate terminal battle results into Hollow semantic results. Defeat remains fail-forward.

### Short-term utility

Every canonical dangerous adapter must carry a real gameplay benefit through an existing system, such as an extra Tactical resource, favorable objective resolution, or short-term reward modifier. No new economy or chore stack is introduced.

## Bond consequences

Use `CharacterBondState` only. Register Veyr Hollow conflicts/promises/memories plus affected-character memories/conflicts needed by the runtime. No raw trust threshold controls Hollow eligibility.

## Hollow outcomes and ending

Hollow terminal result supports:

- `victory`
- `costly_victory`
- `defeat`

All three advance to ending; defeat is explicitly fail-forward.

Outcome commit is exactly-once and writes:

- terminal major outcome
- Hollow world fact
- reward-once campaign ledger entry
- Veyr/affected Bond memory
- final Hollow milestone

Ending commit uses existing modular ending semantics with a Hollow campaign/route dimension contract. It archives a single run summary and single ending/career collection entry.

## Persistence and sanitation

Hydration must:

- dedupe canonical current-run evidence
- drop unknown evidence IDs
- ignore malformed/non-finite legacy score for authoritative derivation
- sanitize final-choice resolved markers
- sanitize Hollow seasonal claim keys and world facts
- sanitize Hollow Bond IDs
- reject duplicate/forged ending handoffs

Save -> load -> save is idempotent.

## NG+ reset and Legacy

After a completed Hollow ending, `NEW_RUN` must:

- increment run number exactly once
- reset `activeRoute` to `normal`
- clear current danger evidence and final-choice resolution
- clear current Hollow Season/World/Tactical runtime state
- preserve only intended compact Legacy/history echoes
- never carry raw danger score/evidence forward as current authority
- never auto-enter Hollow on the next run
- make an immediate second `NEW_RUN` a no-op

## Macro B -> Macro A interface

Macro B outputs:

- semantic danger tier
- sanitized canonical evidence IDs
- inherited-danger flavor context separately
- final-choice availability
- authoritative accept/refuse result
- authoritative `activeRoute`
- typed Hollow objective/scenario/result/ending DTOs

Macro A inputs only explicit player choice IDs and semantic presentation/ending dimensions.

## Testing strategy

TDD order:

1. Canonical danger evidence and tier derivation.
2. Explicit accept/refuse state transition and replay blocking.
3. Hollow Season/World/Tactical adapters and short-term utility.
4. Fail-forward outcome/reward/Bond/ending persistence.
5. Save/load/malformed sanitation.
6. NG+ clean reset and compact echo preservation.
7. Connected Macro B E2E from dangerous choices through next clean Spring.
8. Full regression including normal campaigns, Fifth Path, Tactical stability/AUTO 10/50/100, Expedition stress, Season/meta, `tsc -b`, and Vite production build.

## Non-goals

- No Hollow UI or narrative presentation implementation.
- No raw danger meter or visible threshold.
- No replacement Tactical/Expedition/Season engine.
- No direct merge to `integration/v3`, `main`, or production.
