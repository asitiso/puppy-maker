# Major Gameplay Expansion Implementation Plan

**Goal:** Deliver Tactical Battle v1 as a complete new playable game mode while preserving and leveraging the completed endgame expansion.

**Project boundary:** This is one project, not a sequence of file-sized deliverables. Completion requires engine + content + persistence + Expedition integration + dedicated UI + automation + regression/build/CI.

## Phase A — Combat foundation (TDD)
- Deterministic seeded RNG and agility timeline with stable ties.
- Combat unit model derived from Runa raising stats and lightweight companion templates.
- Front/Back targeting and protection rules.
- AP/MP economy, card affordability, deterministic 4-card hand, damage/heal/shield/status/timeline effects.
- Victory/defeat termination and serializable result summary.

## Phase B — Party and content (TDD)
- Runa permanent leader plus Bear/Owl/Wolf/Cat companion definitions.
- Recommended one-tap formation and optional preferred pair.
- Companion signature kits: Bear tank, Owl support, Wolf striker, Cat trickster.
- Five deterministic enemy archetypes: bruiser, guardian, caster, support, assassin.
- Encounter templates suitable for Expedition battle nodes and later event reuse.

## Phase C — Bond and combination layer (TDD)
- Bond Lv1-5 thresholds and battle-earned progress; no separate companion XP/equipment economy.
- Lv2 passive, Lv3 unique card/upgrade, Lv4 team passive, Lv5 Runa+companion ultimate.
- Four combination ultimates with eligibility, MP cost and one-resolution safeguards.
- Safe hydration/sanitization of preferred party, formation, bond and clear records.

## Phase D — AUTO, speed and battle orchestration (TDD)
- Legal-action selector shared by manual and AUTO so automation cannot use privileged transitions.
- 1x/2x presentation speed state; speed must not alter simulation results.
- AUTO deterministic under seed and guaranteed to terminate or hit a defensive turn cap.
- First-clear/manual challenge remains meaningful; ordinary cleared encounters are replay-friendly.

## Phase E — Expedition integration (TDD)
- Add Battle Node to Expedition without replacing existing exploration progression.
- Enter battle from eligible node, resolve result, return to Expedition context.
- Rewards reuse gold/gems/items/Season Journey/Live Ops boundaries; no new currency.
- First-clear keys prevent duplicate one-time rewards; repeat rewards remain intentional.
- Bond gain applies only to participating companions after resolved victory.

## Phase F — Dedicated 9:16 battle UI
- Standalone TacticalBattleScreen, not LayeredHome expansion.
- Timeline top; enemy/allied Front/Back battlefield center; active status + four-card hand lower; AP/MP and 1x/2x/AUTO bottom.
- Recommended Formation is one tap. Card -> target interaction has no redundant confirmation dialog.
- Code-render text/numbers/gauges/target states. Reuse existing assets; do not synthesize decorative fantasy art in CSS.
- Clear mobile touch targets and readable combat feedback.

## Phase G — Whole-project verification
- Focused RED/GREEN cycles per subsystem, then full Vitest suite.
- Production `tsc -b && vite build`.
- Inspect exact latest GitHub Actions run and fix failures until GREEN.
- Review branch diff for save-field regressions, duplicate currencies, accidental navigation bloat, and unrelated destructive changes.
- Keep PR #2 draft/open/unmerged.

## Acceptance
A player can select two companions, accept recommended formation, enter an Expedition Battle Node, manually play or enable AUTO at 1x/2x, finish a deterministic 3v3 battle, receive existing-economy rewards and Bond progress, unlock companion/combination features over time, and return to Expedition. Old saves hydrate safely. Full tests/build/CI pass on the exact delivery HEAD.
