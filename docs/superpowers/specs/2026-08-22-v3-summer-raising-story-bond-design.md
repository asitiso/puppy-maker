# V3 Summer Raising Story + Bond Design

## Context
Summer Wave is open on `integration/v3@9d5f6b711a806fd04af1497fb723d205019cfe92`. Lane A is #88 and combines room 01 Raising with room 05 Hub. Room 01 owns Campaign-specific Summer story/Bond domain logic; room 05 owns presentation. Shared game/save/App/Root wiring remains outside room 01.

## Goal
Complete the four activeCampaign-specific Summer story identities and representative Character Bond consequences so room 05 can render a presentation-ready Story/UI vertical slice without deriving raw campaign affinity or trust scores.

## Architecture
Use one pure Summer story/Bond domain module plus Campaign-specific registry data. The module consumes the existing Spring `activeCampaign`, the authoritative Guardian Festival `MajorOutcomeResult` produced by World/Tactical, and `CharacterBondsState`. It returns deterministic Summer chapter state, presentation-ready narrative data, and an idempotent Bond consequence.

Room 01 does not decide Guardian Festival combat/world results. It interprets the existing outcomes `exceptional_victory | victory | costly_victory | defeat` only after another lane has authored them.

## Campaign identities
- Caretaker / Mira: protection and sharing responsibility.
- Pathfinder / Kael: discovery and respecting boundaries.
- Vanguard / Rex: victory, defeat, and leadership.
- Arcanist / Selene: knowledge, power, and restraint.

Each Campaign provides:
- a stable Summer chapter id and title key;
- a Guardian Festival objective/framing key;
- a representative Character;
- a pre-festival narrative hook;
- four outcome-specific fail-forward story consequences;
- a stable Memory id for every completed Festival result;
- selected Promise/Conflict mutations where the outcome meaningfully warrants one;
- a presentation-ready relationship-change summary and next-action key.

## Outcome semantics
`exceptional_victory` is the strongest resolution, `victory` is a clean success, `costly_victory` preserves success with an explicit cost, and `defeat` advances the story through fail-forward consequences. No outcome blocks Summer story completion.

Bond mutations are once-only. Replaying or re-entering the same authoritative Guardian Festival outcome must not add trust twice, duplicate Memory/Promise/Conflict ids, or create a different story result.

## Character Bond rules
Use the existing `CharacterBondState { trust, conflicts, promises, memories }`. Add stable Summer ids to `characterBondIdRegistry` for Mira, Kael, Rex, and Selene only. No new stored rank field. Trust remains internal domain state; room 05 receives a qualitative relationship summary rather than a numeric trust gauge.

Outcome direction:
- exceptional victory: strong positive Memory, modest trust increase, may fulfill/add a positive Promise;
- victory: positive Memory and trust increase;
- costly victory: mixed Memory, smaller trust increase, and a Campaign-specific Conflict or Promise consequence;
- defeat: fail-forward Memory and a Campaign-specific Conflict; no negative trust arithmetic is required.

## 05 handoff contract
Export a presentation-ready selector DTO containing only:
- campaign;
- chapter id/title key;
- objective/framing key;
- representative character;
- phase/status;
- outcome label key when resolved;
- dialogue/story beat keys;
- qualitative relationship change;
- Memory/Promise/Conflict display ids;
- next-action key.

The DTO must not contain `campaignAffinities`, raw affinity numbers, numeric trust, or trust thresholds.

## Safety and malformed inputs
- invalid/non-main activeCampaign => not-ready result, no Bond mutation;
- invalid Guardian Festival outcome => unresolved Summer story, no Bond mutation;
- `true_path` is not a normal Summer Campaign here;
- existing Memory/Promise/Conflict ids are deduped through existing hydration registry semantics;
- authoritative replay of an already-applied outcome returns an idempotent no-op Bond state.

## Files
- Create `src/summer-campaign-story.ts`.
- Create `src/summer-campaign-story.test.ts`.
- Modify `src/character-bonds.ts` only to register stable Summer Memory/Promise/Conflict ids.

## Verification
TDD order:
1. four Campaign chapter identities and invalid campaign guard;
2. four Guardian Festival outcomes and fail-forward story completion;
3. representative Character mapping;
4. once-only Bond consequence and replay safety;
5. qualitative 05 handoff DTO with no raw trust/affinity fields;
6. malformed outcome/id safety and hydration retention.

Then run targeted Summer/Raising/Character Bond tests, full Vitest suite, `tsc -b`, production build, push candidate PR against `integration/v3`, and hand the exact candidate SHA/contract to room 05 / Lane A #88.

## Constraints
- Do not modify shared `src/game.ts`, save schema/resilience, `App.tsx`, or `Root.tsx`.
- Do not merge to `integration/v3`, `main`, or production.
- Do not open Autumn.
