# Puppy Maker V4 — Living Year Design

Status: Approved
Date: 2026-08-25
Repository: `asitiso/puppy-maker`
Baseline: `main` / `integration/v3` at `9b8715caa12e0f9cc5c989fc9f2c714bc4f0b6ce`
Tracking: #186

## 1. Goal

V4 makes the existing one-year campaign feel alive between major chapters. V3 already has strong Spring/Summer/Autumn/Winter, NG+, True, Hollow, World, Tactical, Season, and Bond systems. V4 adds a real weekly decision cadence above those systems instead of replacing them.

The normal player-facing loop becomes:

`Home -> choose weekly focus -> use existing activities/content -> resolve the week -> next week -> every fourth week settle the month`

Legacy monthly actions remain supported for old tests/internal compatibility, but the production Home makes weekly progression the normal path.

## 2. Weekly Calendar

A month has four playable weeks. The canonical clock is the existing `year/month/week` state.

- Week 1 -> 2 -> 3 -> 4 stays in the same month.
- Completing week 4 advances to week 1 of the next month.
- December week 4 advances to January week 1 of the next year.
- Month-boundary systems fire exactly once.
- Weekly Directive, Astral Rift weekly, and Convergence weekly consumers use the real week key rather than an effectively frozen week.

V4 does not remove `NEXT_MONTH`. It remains a compatibility action. The normal V4 UI does not use it for ordinary progression.

## 3. Weekly Life State

Add a small additive persistent state, hydrated safely from old saves:

- current focus and its week key
- last completed week key
- bounded resolved weekly-event keys
- last weekly event

No full calendar history or duplicated domain state is stored. Invalid IDs, malformed keys, duplicates, NaN-like values, and stale data are sanitized. NEW_RUN resets current weekly-life state while inherited V3 echoes remain in their existing Legacy/World History slices.

## 4. Weekly Planner

Before ending a week, the player may select one semantic focus:

- training
- rest
- outing
- bond
- world
- tactical
- season

The focus is intentionally not a second quest system. It expresses what Runa prioritizes this week and influences Home guidance, the weekly event, and a bounded weekly consequence. The player can revise the focus before resolving the week; after resolution it is locked for that week.

The existing four-slot monthly schedule remains useful: a training-focused week reads the activity in the matching week slot. This preserves the meaning of the existing monthly plan while making each row correspond to an actual week.

## 5. Living NPCs

Weekly NPC availability is derived rather than persisted. It uses:

- active campaign
- active route
- calendar week/season
- run number / NG+ status
- current and inherited World facts where relevant

Campaign representative characters are favored in their campaign. Shared-world characters rotate across weeks. Lyra appears more strongly in NG+/True contexts. Veyr appears in Hollow contexts. The UI shows names and qualitative context, never raw trust/danger thresholds.

NPC availability must never hard-block mandatory campaign progression.

## 6. Dynamic Weekly Events

Weekly events are deterministic for a given semantic week state and focus. Re-entering/reloading the same unresolved week therefore cannot reroll for advantage.

Events are short atmosphere/consequence beats, not new major story chapters. Examples include quiet weather, market activity, patrol requests, campfire invitations, inherited echoes, and Rift disturbances.

Each week event resolves at most once. Effects are deliberately bounded: small condition/stat/economy changes or flavor, never a replacement progression economy. Main campaign access cannot be lost because of a weekly event.

## 7. Unified Hub Next Action

Introduce one authoritative `hubNextAction(state)` selector. LayeredHome consumes it rather than independently reimplementing priorities.

Priority:
1. immediately claimable reward
2. a completed week waiting to advance
3. no weekly focus selected
4. selected weekly focus / time-sensitive domain action
5. ordinary schedule fallback

The selector returns semantic domain, label, detail, route, and priority. Routes may target existing Home panels/overlays such as schedule, outing, bond, expedition/world, tactical, or season.

This closes the architectural gap recorded in #50.

## 8. Compatibility and Balance

- V3 Campaign/Tactical/World/Season engines remain authoritative.
- No new combat engine.
- No new raw-power NG+ inheritance.
- No save wipe.
- Existing `FINISH_TRAINING` and `NEXT_MONTH` semantics remain compatibility-safe unless a proven bug requires otherwise.
- Weekly focus consequences are small enough not to invalidate existing economy/balance assumptions.
- Existing monthly schedule, training minigame, outings, gifts, expeditions, Tactical, Season and story remain available.

## 9. UI

Home gains a compact Weekly Planner card showing:

- year/month/week
- selected focus or focus choices
- available NPC names
- current weekly event teaser
- clear resolve/advance state

Mobile requirements:
- 360x640, 390x844, 430x932
- 44px minimum controls
- safe-area aware
- long Korean wrapping
- no horizontal overflow
- keyboard/focus visibility
- reduced-motion safe

The primary Home CTA uses the unified selector and remains singular.

## 10. Failure / Recovery

Malformed weekly-life state hydrates to safe defaults. Duplicate event keys do not reapply effects. A reload during a week preserves focus and deterministic event identity. A resolved week cannot apply its event twice. If the player ignores optional weekly content, mandatory V3 campaign progression remains reachable.

## 11. Testing and Release Gate

Required new tests:
- week 1->2->3->4->next-month/year rollover
- focus selection, replacement, hydration and reset
- deterministic event selection and one-shot resolution
- living NPC derivation for normal/NG+/True/Hollow states
- unified Hub selector priority
- save/reload idempotency and malformed sanitation
- 12+ week soak and multi-run NG+/True/Hollow compatibility
- Weekly Directive/Astral/Convergence boundary behavior
- Weekly Planner rendering/mobile/a11y contracts

Final gate:
- all existing V3 tests GREEN
- `npm audit` no high/critical release blocker
- `tsc -b && vite build` GREEN
- Vercel preview root/API smoke GREEN
- exact tested tree promoted to integration and main
- production root + telemetry API 200 and no new error/fatal logs.
