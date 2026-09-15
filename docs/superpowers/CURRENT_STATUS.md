# Puppy Maker Current Development Status

> This file is the handoff baseline for scheduled or agentic continuation. Repository code, CI, and newer commits remain authoritative if they disagree with this snapshot.

## Active branch

- Branch: `work/v16-living-regions`
- Pull request: #246 — V16 living regions foundation
- Last verified implementation baseline: `b89fb16a487094ee80651524b67319708d72a596`
- Verification: GitHub Actions CI #2457 passed both the full test suite and production build.

## Completed work

- V15 direct-movement exploration runtime remains canonical for all outing traversal.
- The walkable crossroads now exposes six spatially distinct portals: `forest`, `village`, `lakeside`, `old_shrine`, `herb_hills`, and `expedition_outpost`.
- V16 persistent living-region state is additive, sanitised, save-compatible, and supports `unvisited → active → mainQuestInProgress → mainQuestResolved → postResolution` plus discoveries and completed interactions.
- Shared exploration can restore persisted interaction completion and report newly completed interactions without changing legacy `onOuting(location)` semantics.
- `old_shrine` is the first complete V16 living region and is playable directly from the crossroads.
- Old Shrine includes a 2400×1600 authored map, collisions, direct crossroads exit, three echo characters, three discoveries, a seal/rune/memory main quest, conditional dialogue, personality/world-fact sensitivity, resolution art changes, revisit dialogue, and persistent quest/discovery progress.
- Old Shrine quest-state changes do not reset the player back to the region entrance.
- Original Old Shrine SVG environment, landmark, NPC/echo, gate, rune, memory, and story-frame assets are committed under `public/assets/exploration/old-shrine/`.
- Old Shrine routing is intentionally narrow: `herb_hills` and `expedition_outpost` portals are visible in the crossroads but are not yet exposed as unfinished placeholder scenes.

## Continuation rule

1. Start from the latest `work/v16-living-regions` HEAD and inspect PR #246 plus current CI before changing code.
2. Do **not** repeat V15 foundation/overworld work, V16 foundation work, six-portal crossroads work, or the completed Old Shrine vertical slice.
3. Treat `docs/superpowers/specs/2026-09-15-v16-world-expansion-living-regions-design.md` as the approved V16 scope unless a newer approved spec supersedes it.
4. If HEAD CI is failing, fix that exact failure first and avoid starting another region until GREEN.
5. If HEAD CI is green, continue the approved rollout in order: Herb Hills full vertical slice, then Expedition Outpost, then the cross-region/full regression gate.
6. Preserve existing `onOuting(location)` progression behavior; living regions use their own additive persistence path.
7. A new living region is not complete until it satisfies the region completeness contract: 2–3 authored characters, one local main quest, two or more conditional events, 2–3 discoveries, persistent visible change, revisit dialogue, personality/bond/world-fact sensitivity, original art, direct crossroads exit, and mobile/keyboard accessibility.

## Next highest-priority work

Implement the complete `herb_hills` vertical slice from the approved V16 design: gathering-focused traversal, 2–3 local NPCs, a small herb request quest, meaningful gathering points, rare-plant discovery, conditional events, a visibly improved post-resolution gathering state, revisit dialogue, persistent progress, original authored art, and crossroads routing only after the slice is complete enough to play.
