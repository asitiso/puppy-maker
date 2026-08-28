# V14 Deep Living World Expansion Design

Date: 2026-08-28
Repository: `asitiso/puppy-maker`
Branch baseline: `work/v14-living-world@d1d9781adb85c9a781845141fd4292f8edf80c96`
Parent design: `docs/superpowers/specs/2026-08-27-v14-living-world-scene-system-design.md`
Status: approved in chat; written-spec review pending

## 1. Purpose

This document extends the approved V14 Living World / Scene System from a technically connected presentation layer into the product experience originally intended by V14: a raising RPG where the player feels that Runa lives inside places, relationships, routines, expeditions, and visible world consequences rather than moving between unrelated menus.

The expansion does not replace the existing reducer, progression, battle, reward, save, Story, Outing, Bond, equipment, or campaign systems. It makes those systems visible through shared Scene Runtime behavior.

The target interaction rhythm is:

`enter place -> observe actors/objects -> tap meaningful target -> actor approaches -> activity/choreography/minigame -> canonical commit -> result presentation -> changed scene`

The expansion is successful only when Home, Training, Outing, Story, and Expedition all feel like parts of the same game world instead of separately themed screens.

## 2. Product principles

The following decisions are authoritative for this expansion.

1. Canonical game state remains reducer/domain authoritative.
2. Scene Runtime never directly awards stats, items, currency, Bond, mastery, discoveries, tactical outcomes, or campaign progression.
3. Existing V14 scene types, resolver, registry, SceneStage, SceneDirector, adapters, and semantic checkpoints are extended rather than replaced.
4. Home, Training, Outing, Story, and Expedition should consume the same scene interaction lifecycle.
5. Tactical combat remains the existing Tactical engine and is entered through a handoff from Expedition scenes.
6. Character movement remains semantic-anchor based. No joystick movement, collision physics, or arbitrary pathfinding is added.
7. Minigame performance remains presentation-only in V14. It may alter feedback, animation intensity, dialogue, or local presentation grade, but not canonical growth or rewards.
8. World variation must be deterministic from canonical state where replay consistency matters.
9. Scene expansion must improve mobile usability rather than trade usability for visual density.
10. Optional visual failures must degrade safely without blocking gameplay.

### 2.1 Relationship to the parent V14 design

This document preserves every parent-design invariant unless a requirement is explicitly expanded here.

The only material scope override is Training depth: the parent design's initial Slice C target of one representative bounded special-training minigame is superseded by this approved expansion. Hunt Training, Magic Class, and Herb Gathering are all first-class recurring minigame activities in the completed V14 product. Their performance still remains presentation-only and cannot directly modify canonical growth or rewards.

The parent design remains authoritative for reducer ownership, deterministic scene resolution, Scene/Tactical boundaries, semantic checkpoint safety, save compatibility, reduced-motion behavior, and layered asset fallback.

## 3. Expansion scope

The expansion is organized into seven player-facing systems and one shared QA program.

### 3.1 Living Home

Home becomes the strongest demonstration that Runa inhabits the world.

Required behaviors:

- Runa resolves a low-priority autonomous activity when no directed interaction is active.
- Autonomous home anchors include at minimum bed, desk, window/map, wardrobe/bag area, center idle, and companion-adjacent positions.
- Runa condition influences idle presentation: tired characters favor rest/sit states, healthy characters favor active idle behavior, and context may change expression/pose.
- Personality may change choreography style only, such as cautious observation versus direct approach.
- Companion placement and greeting behavior derive from existing companion identity and Bond.
- Bed, desk, wardrobe, bag, door/world map, Runa, and companion interactions all follow the standard interaction lifecycle instead of firing invisible navigation immediately where presentation is appropriate.
- Existing quick-menu routes remain available as a secondary path.
- Notifications, command rail, and quick controls stay outside the primary character/action lane and must not obscure interactions.

Autonomous behavior is presentation-only. It does not create a second schedule, energy, mood, or relationship system.

### 3.2 Training places and activity depth

The three recurring training activities become three genuinely different places and interaction styles.

#### Hunt Training / Training Ground

Scene objects:
- training dummy
- weapon rack
- instructor position
- companion position
- exit

Presentation loop:
- approach training target
- receive current prompt/threat state
- execute timing + decision interaction
- show hit/evade/focus reaction
- proceed through multiple rounds
- dispatch existing canonical `TRAIN` action(s)
- finish through the existing `FINISH_TRAINING` path

Depth rules:
- rounds vary target timing and required action
- repeated correct decisions build a presentation-only combo/streak
- errors produce visible recovery feedback rather than silent failure
- later rounds become faster or require more precise decisions
- companion role may add non-blocking reaction/hint presentation

#### Magic Class / Magic Classroom

Scene objects:
- magic circle
- rune/book source
- practice target
- instructor position
- exit

Presentation loop:
- observe a rune sequence
- reproduce the sequence
- sequence length/pattern complexity grows by round
- success animates stable casting; mistakes produce misfire/recovery presentation
- existing canonical training actions remain authoritative

Mastery may unlock richer visual casting effects or alternate presentation, but not a second mastery value.

#### Herb Gathering / Herb Garden

Scene objects:
- herb patches
- pots
- ingredient rack
- workbench
- instructor/companion position
- exit

Presentation loop:
- inspect clue/description
- compare visible herb choices
- select the matching herb/ingredient
- progress to more ambiguous clue combinations
- show correct/incorrect plant reaction and Runa response
- finish through the existing training commit path

The activity should reward observation and memory at the interaction level without introducing inventory rewards outside existing domain logic.

### 3.3 Outing exploration scenes

Forest, Village, and Lakeside become tappable exploration scenes that stage existing canonical Outing outcomes.

#### Forest

Representative visible targets:
- tracks
- ancient tree
- mushroom/herb point
- feather/light point
- hidden path marker
- companion reaction point

Existing forest outcomes/discoveries remain authoritative. Scene objects do not directly grant discoveries.

#### Village

Representative visible targets:
- shop frontage
- square/fountain
- notice board
- performance/NPC position
- alley
- companion reaction point

Time, weather, Story state, and World Facts may change which decorative or inspectable objects are present.

#### Lakeside

Representative visible targets:
- water edge
- observation/fishing point
- stone/rest point
- wind-crystal point
- shoreline discovery point
- companion reaction point

Normal outing flow is:

`enter scene -> inspect/tap visible target -> approach anchor -> Outing Adapter -> canonical outcome -> event/discovery presentation -> scene re-resolve`

The adapter continues to call existing exploration logic. Scene interaction only supplies presentation context and intent.

### 3.4 Story choreography

Existing Story events are upgraded from a dialogue-shell experience into directed SceneDirector choreography.

A story sequence may include:
- actor entrance
- movement between semantic anchors
- pose/expression change
- object highlight
- dialogue
- mandatory target interaction
- canonical choice
- post-choice scene reaction
- handoff to exploration/training/battle where the existing design requires it

During mandatory Story beats, unrelated scene interactions are disabled.

Choice safety rules:
- choices still dispatch existing canonical Story actions
- no choice result is predicted before reducer commit
- committed choices cannot reappear as claimable after reload
- post-choice presentation derives from canonical state/history

The existing Story event set should be migrated through metadata or thin choreography mappings rather than by building one bespoke React screen per event.

### 3.5 Expedition as a sequence of places

Guardian Expedition is expanded from setup/battle-oriented flow into a visible journey while preserving the existing Expedition and Tactical engines.

Supported semantic nodes:
- camp
- path
- crossroads
- ruin
- rift
- treasure
- encounter
- return

Representative flow:

`world map -> expedition setup -> camp -> path -> branch/inspect -> encounter -> Tactical -> post-encounter scene -> reward/next node -> return`

Requirements:
- companion selection remains usable on short phones with the Start CTA permanently reachable in the safe-area action footer
- semantic node checkpoints remain the only durable scene-progress state
- Tactical completion uses the existing canonical completion action and duplicate handoff protection
- post-battle reload resumes after a committed battle result rather than reopening the battle/reward
- no companion absence permanently blocks main progression unless the canonical game already requires that companion

### 3.6 Companion identity outside battle

Existing companion identities are expressed through presentation behavior.

- Bear: closer protective placement, stable/slower entry, danger-warning or shielding reactions.
- Owl: elevated/observational positioning, inspect hints, route/object analysis reactions.
- Wolf: faster approach, path/enemy awareness, forward/scouting reactions.
- Cat: curiosity around props, hidden-item reactions, playful or alternate-route presentation.

Bond may influence:
- default proximity
- proactive greeting
- number or warmth of non-blocking ambient reactions
- presentation intensity after success/failure

Bond never creates a separate scene-only relationship value and never directly changes reward calculations in this layer.

### 3.7 Visible world consequences

World Facts should stop being mostly abstract overlay tokens and become concrete scene composition changes where practical.

Representative mappings use canonical IDs only.

- `festival_saved`: restored decorations, brighter square activity, positive ambient NPC/prop state.
- `festival_heavy_losses`: damaged/repair props, reduced celebration presentation, subdued ambience.
- `ancient_route_opened`: visible path/marker and inspect/travel affordance where appropriate.
- `ancient_route_sealed` or `ancient_route_limited`: blocked/partial-route presentation.
- `regional_alliance`: allied banner/NPC/companion staging cues.
- `rift_unstable`: stronger rift lighting/effects and warning presentation.
- `rift_stabilized`: calmer rift visual state.
- `true_path_world_rewoven`: restored or harmonized world presentation where applicable.
- `hollow_rift_entrenched`: persistent damaged/rift-corrupted visual state.

Current-run facts and inherited NG+ echoes remain visually distinct. Inherited echoes may add subdued traces or optional inspect reactions but cannot masquerade as current-run world changes.

## 4. Shared SceneDirector behavior

The existing SceneDirector becomes the shared interaction/choreography coordinator rather than a utility used only by isolated examples.

The lifecycle remains:

`idle -> approaching -> acting -> committing -> presenting -> idle`

Required guarantees:
- one interaction owns the directed scene at a time
- duplicate taps during approach/act/commit cannot double-dispatch canonical actions
- higher-priority Story choreography interrupts autonomous behavior
- player-initiated interaction interrupts autonomous behavior
- activity presentation takes priority over ambient idle behavior
- reduced-motion can snap actor movement while preserving lifecycle order
- cancelled pre-commit presentation must not falsely show a committed result
- committed gameplay must remain committed if presentation is interrupted by reload or navigation

Autonomous behavior priority remains below directed Story, player interaction, and current activity.

## 5. Scene data and source boundaries

The expansion should prefer data-driven scene definitions and narrow helpers over increasing `App.tsx`, `Root.tsx`, or `LayeredHome.tsx` into new monoliths.

Expected source responsibilities:

- `scene-registry.ts`: anchors, objects, cast defaults, interaction metadata
- `scene-resolver.ts`: deterministic scene composition from canonical state
- `SceneDirector.tsx`: interaction/choreography lifecycle
- `SceneStage.tsx`: visual layers, actors, interactions, hit targets
- `CharacterActor.tsx`: actor pose/motion/anchor rendering
- `InteractiveObject.tsx`: accessible object interaction surface
- `training-scenes.ts`: training location resolution
- `outing-scenes.ts`: outing location resolution
- `story-scenes.ts`: story-to-scene choreography mapping
- `expedition-scenes.ts`: semantic expedition node scene resolution
- `adapters/*`: canonical action/result bridges only
- new focused helper modules may be added for autonomous behavior, choreography, or presentation grading if they remain pure and independently testable

Large page components should consume these units rather than absorbing their logic.

## 6. Minigame design constraints

The current three training minigames are expanded for interaction depth, not converted into a second progression engine.

All minigames must:
- complete comfortably on mobile in a short session
- have at least three meaningful rounds or equivalent progression
- vary challenge state between rounds
- provide immediate readable success/error feedback
- support keyboard/touch accessibility where practical
- preserve 44px minimum touch targets
- support reduced motion without changing correctness rules
- avoid wall-clock-only hidden failure conditions that make accessibility impossible
- dispatch only existing canonical training actions

Presentation-only outputs may include:
- local grade such as clean/good/recovered
- combo/streak display
- dialogue reaction
- animation intensity
- particle/effect intensity
- companion reaction

These outputs are not durable progression unless an existing domain system already owns the value.

## 7. Mobile and accessibility requirements

Target viewports remain at minimum:
- 360x640
- 390x844
- 430px-class widths

Release-blocking UX invariants:
- primary CTA is never unreachable below a scrolling content stack
- fixed/sticky elements respect `env(safe-area-inset-*)`
- interactive targets are at least 44px in both dimensions where they are meant to be tapped
- schedule/image-button text remains readable at small widths and may not regress to 8-10px labels
- Character Build / Party Loadout focused editing cannot be trapped behind persistent global Back/menu chrome
- home notification/command UI cannot cover the central character/action lane
- long Korean labels/dialogue wrap without clipping choices
- focused overlays have a clear local close/exit path
- `prefers-reduced-motion` removes unnecessary repeated motion but preserves semantic progression
- world interactions expose accessible labels and disabled state where visual appearance alone is insufficient

## 8. Persistence and reload safety

No new pixel-level or animation-frame persistence is introduced.

Persist only existing/canonical durable game state plus already-designed semantic activity checkpoints.

Reload rules:
- uncommitted Story choice resumes at a safe pre-choice/choice boundary
- committed Story choice resumes after the choice
- uncommitted training presentation may restart safely without a reward
- committed training state remains committed even if result animation was interrupted
- committed Tactical battle returns to post-encounter Expedition state
- malformed scene metadata falls back to a safe canonical location/activity
- current/inherited World Fact presentation is re-derived from canonical state

## 9. Testing strategy

### 9.1 Pure tests

Add or expand coverage for:
- autonomous Home behavior selection priority
- companion presentation derivation from role/Bond
- scene interaction lifecycle and duplicate-tap lock
- Story choreography gating
- World Fact concrete prop/interaction composition
- inherited echo distinction
- minigame round/challenge progression helpers
- reduced-motion lifecycle equivalence

### 9.2 Integration tests

Required flows:
1. Home object tap -> approach/act -> navigation/action -> safe return
2. weekly schedule containing Hunt/Magic/Herb -> all corresponding minigames in canonical schedule order -> one safe completion path
3. Forest/Village/Lakeside visible target -> canonical Outing outcome -> staged result -> return
4. Story scene -> directed beats -> choice -> committed result -> reload without duplicate choice/reward
5. Expedition camp/path/encounter -> Tactical -> canonical completion -> post-encounter scene
6. reload after commit but before result animation completes -> no duplicate gameplay commit
7. World Fact change -> re-resolved visible scene consequence

### 9.3 Mobile regression tests

Explicitly preserve regression coverage for:
- Guardian Expedition fixed safe-area CTA
- Character Build / Party Loadout overlay exit behavior
- Home notification rail position
- schedule button text/touch size
- 360x640 short-phone scroll boundaries
- dialogue/choice overlap
- reduced-motion behavior

### 9.4 Final gate

Every implementation slice runs:
- targeted tests
- relevant feature suites
- full regression
- TypeScript/build
- dependency audit evidence
- Vercel preview status when available

A slice is not considered GREEN if tests pass but a primary mobile action is visually unreachable.

## 10. Ordered implementation program

The expansion should be executed in this order to maximize visible gain while controlling regression risk.

### Wave 1 — Shared living interaction core
- strengthen SceneDirector lifecycle use
- autonomous actor behavior helper
- interaction approach/action presentation hooks
- duplicate-tap/interrupt/reduced-motion tests

### Wave 2 — Living Home
- autonomous Runa anchors/state reactions
- companion ambient placement/reactions
- object approach/interact presentation
- quick-menu compatibility and mobile safe zones

### Wave 3 — Training depth
- place-specific training scenes mounted through shared Scene structure
- deepen Hunt/Magic/Herb minigames
- feedback/combo/presentation grade
- schedule-order integration and mobile typography/touch regression

### Wave 4 — Outing exploration
- Forest/Village/Lakeside tappable objects
- canonical exploration outcomes staged in-scene
- companion reactions
- season/time/weather differentiation

### Wave 5 — Story choreography
- migrate existing Story event presentation to shared beats
- mandatory interaction lock
- post-choice choreography from committed state
- reload/idempotence coverage

### Wave 6 — Expedition journey
- camp/path/crossroads/ruin/rift/treasure/encounter/return scenes
- companion exploration personality
- Tactical handoff/return presentation
- checkpoint and short-phone CTA regression

### Wave 7 — World consequence pass
- canonical World Fact props/interactions
- NG+ inherited visual echoes
- Bond/personality ambient polish
- missing-asset and malformed-state fail-soft coverage

### Wave 8 — Full V14 product gate
- all representative E2E flows
- 360x640 / 390x844 / 430-class mobile QA
- accessibility/reduced motion
- full regression
- build/preview
- PR/integration review readiness

## 11. Acceptance criteria

The Deep Living World expansion is complete only when all are true.

1. Home, Training, Outing, Story, and Expedition visibly use the shared Scene architecture in actual player-facing flows.
2. Runa performs state-reactive autonomous Home behavior and yields correctly to directed interactions.
3. Companions visibly differ by role and existing Bond without duplicate progression state.
4. Bed/desk/wardrobe/bag/door/map/companion interactions use visible approach/action presentation where appropriate.
5. Hunt, Magic, and Herb training each have distinct multi-round interaction rules and remain presentation-only for scoring.
6. Weekly schedule launches the correct activity/minigame for every scheduled non-rest training in canonical order.
7. Forest, Village, and Lakeside stage existing Outing outcomes through visible scene objects.
8. Story events use shared choreography beats and canonical choices remain reload-safe.
9. Expedition is presented as semantic journey scenes around the existing Tactical engine.
10. Tactical completion and rewards cannot duplicate through rapid interaction or reload.
11. Representative canonical World Facts create concrete visible scene consequences.
12. Current-run World Facts and inherited NG+ echoes remain visually distinct.
13. Season/time/weather variation is deterministic and does not contradict Story/World Fact priority.
14. Missing optional visuals and malformed scene metadata fail soft.
15. 360x640 and larger supported mobile viewports retain reachable CTAs, 44px touch targets, readable Korean labels, and safe-area compliance.
16. Reduced-motion preserves gameplay order/outcomes.
17. Existing regression suites plus new Deep Living World tests are GREEN.
18. TypeScript and production build are GREEN before integration promotion.

## 12. Non-goals

This expansion still does not add:
- free-roaming joystick movement
- arbitrary pathfinding or collision physics
- a tile-map engine
- a replacement Tactical engine
- direct minigame-to-stat/reward scaling
- new Bond/mastery/progression currencies owned by Scene Runtime
- persistent animation frames or actor pixel coordinates
- combinatorial hand-painted assets for every weather/season/time combination

The intended result is a much richer game using the systems already built, not a second game engine layered on top of the first.