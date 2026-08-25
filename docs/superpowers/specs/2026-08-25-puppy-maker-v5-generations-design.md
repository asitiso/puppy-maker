# Puppy Maker V5 Generations Design

## Status
Approved 2026-08-25. Tracking: #189.

## Goal
Extend V4 Living Year into a long-form life simulation where one character can live across multiple in-game years and, after a completed life, an explicitly chosen next generation can begin with bounded narrative heritage rather than inherited raw power.

## Product principles
- Preserve the V4 week → month → year loop. Do not duplicate settlement logic.
- Keep NG+ and lineage as different concepts. `NEW_RUN` remains NG+ only.
- Make later years feel different through derived life stage and deterministic content variation.
- Make ancestry matter through identity, dialogue, world reactions, and event availability—not stat inflation.
- Every generation transition is explicit and deterministic.
- Old saves remain playable through defensive hydration.

## Time model
The existing canonical date remains `year`, `month`, `week`.

Life stage is derived, never stored:
- Year 1: `growing`
- Year 2: `young_guardian`
- Year 3+: `seasoned_guardian`

This avoids save divergence between `year` and a redundant stage field.

## Lineage domain
Add `LineageState` to the top-level game state:

```ts
export type HeritageTraitId =
  | 'warm_heart'
  | 'trail_memory'
  | 'steadfast_guardian'
  | 'arcane_echo'
  | 'world_witness'
  | 'true_echo'
  | 'hollow_echo';

export type AncestorRecord = {
  generation: number;
  yearsLived: number;
  route: string | null;
  ending: string | null;
  guardianRank: GuardianRankId;
  personalityKey: keyof Personality;
  majorWorldFacts: WorldFactId[];
  heritageTraits: HeritageTraitId[];
};

export type LineageState = {
  generation: number;
  heritageTraits: HeritageTraitId[];
  ancestors: AncestorRecord[];
};
```

Hydration rules:
- `generation` is a finite positive integer, minimum 1.
- trait ids are canonical, unique, and ordered by registry order.
- ancestor generations are positive and unique.
- malformed route/ending values become `null` rather than poisoning the save.
- world facts are canonical and deduped.
- ancestors are sorted by generation and bounded to the latest 8.
- current heritage is bounded to 2 traits.

## Heritage derivation
Heritage is deterministic from the completed life snapshot. No randomness and no reload reroll.

Candidate evidence:
- dominant personality → `warm_heart` / `steadfast_guardian` / `trail_memory` / `arcane_echo`
- strong world-history footprint → `world_witness`
- completed True route → `true_echo`
- accepted Hollow route → `hollow_echo`

Selection rules:
1. Build candidates in stable registry order.
2. Select at most 2.
3. Route-specific echo may occupy one slot, but never adds raw stats.
4. If evidence is sparse, one deterministic personality trait is still allowed.

## Completed-life eligibility
Generation transition is not available during an unfinished first-year life.

A life is eligible when:
- at least 3 in-game years have been reached, and
- there is durable completion evidence: resolved ending or completed Campaign handoff.

This keeps lineage as a meaningful long-form action rather than a shortcut around campaign progression.

## Generation transition
Add a separate action:

```ts
{ type: 'START_NEXT_GENERATION' }
```

On success:
1. Snapshot the completed life into `AncestorRecord`.
2. Derive up to two heritage traits deterministically.
3. Append ancestor record and bound history to latest 8.
4. Reset active life to `initialState` raw economy/growth state.
5. Set lineage generation +1 and apply heritage traits only as identity metadata.
6. Do not inherit stats, gold, gems, inventory, mastery, tactical records, expedition power, weekly current progress, or current-run danger.
7. Preserve only explicitly permitted lineage heritage; NG+ legacy remains a separate system.

On ineligible transition: return original state unchanged.

## NG+ separation
`NEW_RUN` keeps its current semantics and must not increment lineage generation.
`START_NEXT_GENERATION` must not masquerade as NG+ and must not use `prepareNewPossibilityV3State` as its transition engine.

Existing NG+ inherited world echoes continue to work inside a life. A lineage transition records a bounded summary of that life but does not copy the NG+ raw runtime state into the child.

## Multi-year variation hooks
V5 should make age visible without building an entirely separate content engine.

Add pure selectors for:
- `lifeStageForYear(year)`
- `lifeStageLabel(year)`
- `lineageSummary(state)`

Weekly deterministic events may use life stage and heritage as stable inputs for variant copy/event ids, but the V4 resolution key remains deterministic and reload-safe.

## UI
Hub shows compact identity metadata:
- `N세대 · X년차`
- life-stage label
- up to two heritage trait labels

Add a Lineage Chronicle panel showing latest ancestors (max 8):
- generation
- years lived
- guardian rank
- route/ending summary
- heritage traits

The panel is informational until generation transition becomes eligible; then it presents one explicit `다음 세대 시작` action with confirmation-level copy. It must not replace the authoritative `hubNextAction` primary CTA.

## Save compatibility
No save wipe.
Old saves lacking lineage hydrate to:

```ts
{ generation: 1, heritageTraits: [], ancestors: [] }
```

Malformed lineage data is sanitized. Serialization includes lineage automatically through `GameState`.

## Test gates
### Domain RED/GREEN
- life stage boundaries
- malformed lineage hydration
- ancestor/trait dedupe and bounds
- deterministic heritage selection

### Reducer RED/GREEN
- ineligible transition is no-op
- eligible transition increments generation
- raw stats/economy/inventory/mastery/tactical/expedition/weekly current progress do not inherit
- ancestor snapshot is correct and bounded
- repeated dispatch cannot duplicate the same ancestor
- `NEW_RUN` never increments generation

### Compatibility
- save/reload preserves valid lineage
- malformed saves recover
- True/Hollow heritage produces narrative traits only
- V4 week/month/year settlement remains unchanged

### Soak
Simulate at least three generations with multi-year progress, save/reload between years and generations, inject malformed lineage once, and assert:
- finite numbers only
- bounded ancestors <= 8
- heritage <= 2
- no duplicate ancestor generation
- no raw-power inheritance
- NG+ and lineage counters remain independent

### Final gate
Targeted tests → full suite → audit → TypeScript/build → preview → integration → main → production root/API/log verification.