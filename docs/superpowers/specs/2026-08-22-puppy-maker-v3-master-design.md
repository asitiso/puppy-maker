# Puppy Maker V3 Master Design Spec

Status: Approved design, implementation not started
Date: 2026-08-22
Repository: `asitiso/puppy-maker`
Authoritative baseline: `integration/v2@edd0ca99537ed92c7993969166b80c269f3aced8`
Target integration track: `integration/v3`

## 1. Purpose

V3 upgrades Puppy Maker from a collection of individually strong progression systems into one connected one-year RPG campaign where Raising, Personality, Calling, Character Bond, World, Tactical, Season, Career, Ending, and New Game+ affect one another.

The design must preserve the existing core web loop:

`hub -> schedule -> training -> dialogue -> result -> next month -> hub`

V3 is not a rewrite. Existing Raising, World, Season, Tactical, save, and Hub systems remain authoritative in their own domains. New campaign logic sits above them through adapters and interprets their outcomes.

Success is defined by stronger systemic consequence and replay identity, not by feature count.

## 2. Product Pillars

1. Player behavior should open paths rather than numeric build optimization alone.
2. Four main campaigns must feel substantially different in story, objectives, combat rules, relationships, and major choices.
3. Failure in major campaign events should create alternate consequences instead of only a retry screen.
4. Character relationships should alter available solutions, combat support, world outcomes, and endings.
5. A completed run should expand future possibilities rather than preserve raw power.
6. The same shared world should reveal different truths across multiple campaigns.
7. V3 must remain safe for old saves and premium mobile 9:16 play.

## 3. One-Year Campaign Structure

A run covers one in-game year.

### Spring: Identity and Path Selection

Spring begins as a shared free-play period. Training, dialogue, Bond, exploration, Tactical, Calling, Personality, and other normal actions contribute hidden campaign affinities.

At a deterministic mid-Spring Path Convergence checkpoint, the run evaluates those affinities and exposes campaign candidates before any Summer campaign content begins. The exact mapping onto the existing calendar is an implementation-plan detail, but the ordering is fixed: shared Spring play -> Path Convergence -> Commitment -> Summer.

The player makes the final choice from the unlocked candidates.

The UI never exposes raw affinity numbers. It describes tendencies in world language such as:

- faint tendency
- emerging possibility
- strongly opening path

After selection, the first campaign-specific Commitment chapter begins and campaign-specific seasonal, world, tactical, and story modifiers become active.

### Summer: Identity Tested

Summer establishes the chosen campaign's play identity and contains the first shared crossover event, Guardian Festival.

Each campaign sees the same festival from a different perspective and receives a different major objective and Tactical or World climax. Summer contains the first major fail-forward point.

### Autumn: Choice and Cost

Autumn contains the shared Great Expedition and one campaign-defining Major Choice.

Each campaign offers two base choices and one conditional third solution. The third solution is not a free best answer; it must be earned through prior World, Bond, Discovery, or political state.

Autumn outcomes materially change Winter modifiers and ending inputs.

### Winter: Consequence and Ending

Winter culminates in The Long Night. This is one shared global crisis viewed through four different campaign causes and objectives.

Each campaign receives a distinct final arc and final boss or scenario. The result resolves Campaign, Bond, World, and Career dimensions into an ending.

After ending, the player chooses either to continue endgame in the current world or start a New Game+ run called a new possibility.

## 4. Main Campaigns

### 4.1 Caretaker — "Things Worth Protecting"

Core question: How much responsibility can compassion carry before it becomes self-destruction?

Gameplay identity:
- rescue
- protection
- survival
- healing and cleansing
- civilian or NPC preservation
- resource allocation under pressure

Representative character: Mira.

Summer: Guardian Festival crisis and protection battle.

Autumn Major Choice: save one critical person, spread risk across many people, or use an earned team-based third solution.

Winter: large-scale protection crisis where success is judged by responsibility sharing and survival outcomes, not enemy defeat alone.

Best thematic resolution: Runa becomes a leader who distributes responsibility rather than trying to save everyone alone.

### 4.2 Pathfinder — "Beyond the Map"

Core question: What is the boundary between discovery and intrusion?

Gameplay identity:
- discovery
- hidden paths
- scouting
- shortcuts
- limited-action exploration
- escape and traversal objectives

Representative character: Kael.

Summer: forbidden map, hidden coordinates, and a living ruin or maze Guardian.

Autumn Major Choice: open an ancient route, seal it, or enable limited access through earned knowledge and relationships.

Winter: unstable routes alter the world map and battle conditions. Discovery and route knowledge can skip or weaken phases.

Best thematic resolution: a Pathfinder who understands that not every path must be opened.

### 4.3 Vanguard — "The Weight of Victory"

Core question: Is strength the ability to win, or the ability to endure defeat responsibly?

Gameplay identity:
- direct Tactical challenge
- tournament structure
- elite AI
- chained battles
- restricted recovery
- resource pressure
- command and cooperation

Representative character: Rex.

Summer: Guardian Grand Tournament with rival-specific AI and a fail-forward result whether the player wins or loses.

Autumn Major Choice: centralize authority under Eiden, preserve decentralized independence, or unlock an earned coalition command structure.

Winter: the hardest conventional 3v3 combat sequence, testing target priority, command, resource management, and ally composition.

Best thematic resolution: the strongest Vanguard makes other people stronger instead of merely dominating them.

### 4.4 Arcanist — "The Rift Beneath the Stars"

Core question: Is the ability to understand or use a power the same as permission to use it?

Gameplay identity:
- relics
- Astral systems
- Rift systems
- status effects
- rule shifts
- high-risk high-reward choices

Representative character: Selene.

Summer: a displayed ancient Relic resonates and reveals that the Rift may connect to deeper world history.

Autumn Major Choice: use a forbidden Relic, destroy it, or unlock controlled use through sufficient knowledge and trust.

Winter: multi-phase battle across Reality, Rift, and Memory Space. Dangerous power may simplify the fight while worsening route and ending consequences.

Best thematic resolution: an Arcanist capable of refusing knowledge or power that should not be used.

## 5. Shared World Events

Three major events cross campaign boundaries.

### Guardian Festival — Summer

Caretaker focuses on safety and rescue.
Pathfinder gathers exploration intelligence.
Vanguard enters competition.
Arcanist investigates ancient Relics.

The event introduces characters and conflicts from other campaigns so the shared world remains visible.

### Great Expedition — Autumn

All campaigns participate in one large shared expedition while pursuing distinct objectives. The resulting Major Choice writes authoritative World Facts used by Winter and NG+.

### The Long Night — Winter

All unresolved tensions surface together. The crisis is shared, but each campaign understands and resolves a different causal layer.

## 6. Hidden Routes

### 6.1 The Fifth Path — Hidden True Campaign

The Fifth Path reveals that four apparently different campaign problems are different views of one deeper world phenomenon.

Its eligibility is not simply "clear all four campaigns." It combines varied run history such as:

- multiple campaign types experienced
- True Clues from different domains
- meaningful World outcomes
- key Character Bond memories
- at least one significant fail-forward outcome
- relevant Sanctuary, Astral, Celestial, or Rift history
- sufficient NG+ history

The design rewards breadth of lived experience, including failure, instead of perfect optimization.

Lyra is the central relationship axis.

When Legacy eligibility is satisfied, The Fifth Path appears as a special Spring Path Convergence candidate in an NG+ run. Selecting it sets `activeCampaign = true_path` for that run instead of selecting one of the four normal campaigns. It is never silently forced and never replaces the minimum normal campaign choices unless the player explicitly selects it.

### 6.2 Hollow Path — Secret Bad Route

Hollow is not a low-performance ending. It emerges from repeated deliberate use of efficient but dangerous solutions.

Risk behavior may include:
- sacrificing allies for victory
- exploiting relationships as tools
- prioritizing reward or efficiency over civilians
- using forbidden Relics
- repeated dependence on Rift power
- accepting Veyr's power

Danger is hidden from the UI. The player instead sees increasingly altered dialogue, events, atmosphere, and choices.

Danger progresses conceptually through stable -> fractured -> hollow_candidate. These names are internal and are not shown directly.

Crossing thresholds only opens the final dangerous choice. Hollow begins only after the player explicitly accepts that choice. Refusal keeps the player on the normal route.

Hollow choices must be genuinely useful in the short term so the route is a meaningful temptation rather than an obviously incorrect red button.

## 7. Character Bond System

The existing BondScene system represents Runa's existing player/partner relationship and remains intact. V3 introduces a separate Character Bond system for main NPCs.

Main V3 characters:
- Mira — care, self-sacrifice, responsibility
- Kael — exploration, freedom, boundaries
- Rex — rivalry, victory, defeat
- Selene — knowledge, fear, forbidden research
- Noa — ordinary civilian perspective and world consequences
- Eiden — order, authority, political legitimacy
- Lyra — repetition, memory, True Campaign
- Veyr — rationalized dangerous choices and Hollow

Stable internal character IDs must not depend on localized display names.

Each Character Bond stores four dimensions:

`trust`
`conflicts[]`
`promises[]`
`memories[]`

Relationship rank is derived, not stored. UI status such as trusted, unresolved conflict, or deep bond is produced by selectors.

Important relationship resolutions require combinations of trust, resolved or unresolved conflict, promises, memories, and relevant World Facts. High trust alone must not guarantee the best outcome.

Representative examples:
- Mira can change rescue and protection outcomes.
- Kael can expose hidden routes or scouting advantages.
- Rex can enable Joint Ultimate or tactical support.
- Selene can suppress or interpret Rift rule changes.
- Noa can unlock civilian or negotiation solutions.
- Eiden can provide authority, logistics, or forces.
- Lyra changes NG+ and True outcomes.
- Veyr opens powerful dangerous shortcuts.

## 8. Tactical Design

The current 3v3 engine remains the combat foundation. V3 does not replace it with a new battle engine.

Campaign-specific behavior is introduced through Campaign Encounter Definitions that compile into Tactical Scenarios consumed by the existing engine.

The Tactical engine should continue to understand core battle concepts such as HP, resources, cards, targeting, AI, and Ultimate. It should not contain campaign story branching logic.

Required scenario objectives include:
- standard victory
- protect
- survive
- escape
- target elimination

Campaign modifiers:

Caretaker: escort, protection, healing, civilian pressure.

Pathfinder: scouting, hidden enemies, limited turns, escape paths.

Vanguard: elite AI, chained battles, restricted recovery, command pressure.

Arcanist: rule shifts, Relic resonance, status amplification.

General battles may be retried. Major campaign battles use fail-forward and write one authoritative historical result.

## 9. World Design

The world remains shared. Campaigns do not receive four entirely separate maps.

Existing Expedition regions and stages gain campaign objective overlays.

The same region may become:
- a rescue zone for Caretaker
- a hidden-route problem for Pathfinder
- an elite stronghold for Vanguard
- a Rift anomaly for Arcanist

This reuses established content while changing its meaning and objective structure.

World consequences are stored as typed World Facts, never arbitrary free-form strings.

Examples:
- `festival_saved`
- `festival_heavy_losses`
- `ancient_route_opened`
- `ancient_route_sealed`
- `ancient_route_limited`
- `eiden_central_command`
- `regional_alliance`
- `forbidden_relic_used`
- `forbidden_relic_destroyed`
- `rift_stabilized`
- `rift_unstable`

Current-run facts and inherited NG+ facts remain separate.

Inherited World State is medium-strength. It may change relationships, region flavor, starting events, hidden quests, candidate availability, and rewards, but normal four-campaign access must not be permanently blocked by old runs. Strong structural disappearance or replacement is reserved for True or Hollow situations.

## 10. Season Design

Season keeps its existing systems but receives campaign-specific Seasonal Objective sets.

The design must not add a second unrelated daily or weekly chore stack. Existing actions are interpreted through a campaign adapter.

Examples:

Caretaker:
- Bond events
- rescue decisions
- protection-oriented battle results

Pathfinder:
- new Discovery
- uncleared stages
- limited-action exploration

Vanguard:
- stronger opponent wins
- ally survival
- successful retry after defeat

Arcanist:
- Relic use
- Astral Trial
- status-based tactical resolution

Rewards should prefer access, story, memories, modifiers, routes, or new choices over raw currency.

## 11. Campaign Affinity and Path Convergence

Four hidden affinities exist during Spring:
- caretaker
- pathfinder
- vanguard
- arcanist

Affinity comes from multiple sources rather than repetitive action count alone.

Each campaign caps contribution by source so one repeatable activity cannot dominate the whole score. Exact tuning belongs to implementation planning and balancing, but the design requirement is that no single farmable source can determine a path by itself.

Normal Path Convergence must always present at least two selectable main-campaign candidates. The top two main-campaign affinities therefore remain selectable even in a low-engagement or unusual Spring; eligibility rules may influence the optional third candidate and special hidden candidates, but they may not reduce normal player choice below two main campaigns.

A third normal campaign candidate may appear when its affinity is sufficiently close to the leaders and its additional eligibility conditions are satisfied. A valid Fifth Path candidate may appear in addition to the normal candidates on eligible NG+ runs.

The player is shown concrete behavioral evidence for why each path opened, for example exploration, difficult battles, important dialogue choices, or relationship decisions.

After campaign selection, non-selected affinity values are retained as secondary style. These can unlock cross-campaign solutions later without changing the active campaign.

## 12. Major Choices

Autumn contains one campaign-defining Major Choice per main campaign.

Each choice has:
- two generally available base solutions
- one conditional third solution
- explicit historical resolution after selection

Conditional solutions depend on prior state such as Discovery, Character Bond, Eiden alignment, World Facts, or prior seasonal outcomes.

Locked alternatives may be partially hinted at to encourage NG+ exploration, but requirements must not become a raw checklist optimization UI.

Major Choices are idempotent. Reloading or re-entering a resolved choice cannot apply rewards, penalties, World Facts, or Bond changes again.

## 13. Fail-Forward

Major campaign events support results such as:
- exceptional victory
- victory
- costly victory
- defeat

All outcomes continue the story.

Different outcomes provide different content and consequences, not a strict total-value hierarchy that makes intentional failure optimal.

Once a major result is committed, it becomes authoritative history for that run and cannot be overwritten by replaying the same event.

Consequence application uses stable canonical keys so save/reload or duplicate event dispatch cannot reapply effects.

## 14. Ending System

Endings are modular instead of one giant branch table.

The resolver has four independent outputs:

1. Campaign Resolution
2. Character Bond Resolution
3. World Resolution
4. Career Resolution

An Ending Scene Composer combines these into the final epilogue.

This supports large variation without creating a unique hand-coded branch for every combination.

Example composition:

- Campaign: Vanguard — Alliance Commander
- Bond: Rex — Equal Rival
- World: Regional Alliance
- Career: Guardian Captain

The final screen presents these dimensions before the composed epilogue.

## 15. NG+ and Legacy

NG+ is called a new possibility in player-facing UI.

Its philosophy is possibility inheritance, not raw power inheritance.

### Reset on new run

- core growth and levels
- most normal currencies
- active Campaign and route
- current-run Character Bond state
- normal World progression
- Tactical run progression
- Season and weekly progression
- current danger state

### Persist or echo forward

- Ending and Career collections
- selected Discovery history
- Legacy progression
- major World History echoes
- relationship echoes
- True Clues
- hidden campaign or event unlock conditions
- cosmetic, title, or weak memory-of-past-life bonuses

Prior Bond or Calling is not directly retained at full strength. Previous records instead unlock dialogue, starting advantages, reunion events, or new choices.

### Run Summary

A completed run stores a compact summary rather than a copy of the full save:

- run number
- campaign
- route
- ending
- career
- major World outcomes
- key Bond memories
- True Clues

This prevents save size from growing linearly with full historical state.

## 16. Persistent State Architecture

Use nested persistent slices rather than continuing to flatten every new field directly into the top-level game state.

Required conceptual slices:

### CampaignRunState

- runNumber
- phase
- activeCampaign
- activeRoute
- campaignAffinities
- dangerState
- seasonMilestones
- majorChoices
- majorOutcomes
- failForwardOutcomes
- claimedCampaignRewards

Campaign phases:

`spring_exploration -> path_selection -> summer -> autumn -> winter -> ending`

Campaign IDs:

`caretaker | pathfinder | vanguard | arcanist | true_path | null`

Route is a separate dimension:

`normal | hollow`

This permits states such as an Arcanist campaign entering Hollow without conflating route and campaign identity.

### WorldHistoryState

- currentFacts
- inheritedFacts

Only registered `WorldFactId` values are accepted.

### CharacterBondState

Per character:
- trust
- conflicts
- promises
- memories

All collections use registered canonical IDs and deduplicate during hydration.

### LegacyState

- completedRuns
- completedCampaigns
- endingCollection
- careerCollection
- trueClues
- legacyWorldFacts
- relationshipEchoes
- ngPlusUnlocks
- runSummaries

## 17. Adapter Architecture

Existing domain systems must not directly depend on campaign story logic.

Target flow:

`Player Action`
`-> existing Raising / World / Tactical / Season result`
`-> Campaign Progression Adapter`
`-> affinity / Character Bond / World Fact / Major Outcome / danger updates`
`-> campaign selectors and story progression`

Examples:
- Tactical returns battle and scenario results; campaign adapters interpret them.
- World returns expedition and objective results; campaign adapters convert them into history.
- Season exposes normal action and objective progress; campaign adapters translate it into campaign seasonal progression.

This boundary is required to keep domain engines reusable and independently testable.

## 18. Save Schema V3

V3 upgrades the current save envelope from schema version 2 to schema version 3.

Migration behavior:

`v2 load -> existing state hydration -> V3 slices receive safe defaults -> next save serializes as v3`

V3 must preserve existing integrity checking and resilient backup rotation.

Hydration requirements:
- unknown IDs removed
- duplicate IDs deduplicated
- malformed nested objects replaced with safe defaults
- NaN and Infinity rejected or replaced
- negative counters clamped where invalid
- stale Campaign, Bond, World, Promise, Conflict, Memory, True Clue, and outcome IDs sanitized
- repeated load/save/load must be idempotent

`NEW_RUN` becomes the authoritative run-transition action.

Conceptual flow:

`Ending committed -> RunSummary generated -> Legacy updated -> current-run slices reset -> NG+ seed generated -> inherited echoes applied -> Spring starts`

Ending does not automatically destroy the current world. The player can continue endgame first and invoke a new possibility later.

## 19. UI and Information Architecture

V3 increases depth without increasing first-screen complexity.

### Home

Home prioritizes:
- current season/month
- active path or emerging tendency
- one primary next-action CTA
- one important relationship change
- one world change

Only one CTA receives strongest visual priority.

### Journey

Journey is a narrative record, not a raw quest checklist.

It shows:
- current campaign
- seasonal objective
- completed major events
- unresolved narrative question
- important changes left in the world

### Character Bonds

Character screens show relationship summaries, memories, promises, and unresolved conflicts. Raw trust numbers remain hidden.

### World

Regions expose meaningful state descriptions such as route opened, civilians evacuated, or Rift unstable instead of abstract world-state numbers.

### Path Convergence

Campaign candidate cards explain why each path opened using the player's actual history. Raw affinity scores are never shown.

### Major Choice

The UI warns that the choice changes the future world. Earned third choices show the player why they became available. Locked alternatives may be hinted at without exposing optimization formulas.

### Fail-Forward Result

Major defeat messaging communicates that the battle ended but the story continues, then summarizes new injuries, losses, unlocked events, or world changes.

### Story Presentation

Normal gameplay remains fast. Visual-novel presentation is reserved for:
- campaign selection
- seasonal transitions
- major Character Bond chapters
- major World events
- pre/post boss scenes
- fail-forward consequences
- autumn Major Choice
- winter final crisis
- endings
- True/Hollow key scenes

Story UI should support log, auto, fast-forward for previously seen content, and clear differentiation of NG+-changed dialogue.

### Ending and NG+

Ending summarizes Campaign, Bond, World, and Career resolutions before the epilogue.

Then offer:
- continue in this world
- start a new possibility

NG+ introduction summarizes key prior-run memories before starting Spring.

## 20. Mobile UX Requirements

Primary target remains premium mobile 9:16.

Required baseline:
- 360x640
- 390x844
- 430x932
- 100dvh behavior
- top and bottom Safe Area
- browser chrome resilience
- 44px minimum touch targets
- long Korean text wrapping
- no critical scroll traps
- controlled modal stacking
- back and ESC correctness where applicable
- reduced-motion support
- important story choices remain reachable with one-hand use

Campaign Journal, Character Bond, World History, and Legacy must not be compressed into one overloaded screen.

## 21. Development Track

V2 remains the stable reference. V3 development occurs on a separate `integration/v3` track created from the authoritative V2 baseline.

Feature workstreams:
- 01: Campaign Identity, Character Bond, story identity, career/ending identity
- 02: Campaign World objectives, World Facts, Great Expedition, world consequences
- 03: Campaign Season objectives, True Clues, Legacy/endgame hooks
- 04: Campaign Tactical scenarios, objective battles, bosses, combat fail-forward, Bond intervention hooks
- 05: V3 Hub, Journey, Character Bond UI, story presentation, choices, ending/NG+ presentation
- 06: shared foundation, save migration, integration, global QA, sole integration authority

01-05 may work in parallel only after shared foundation contracts are established. Only 06 integrates into `integration/v3`.

This Master Design is intentionally larger than one implementation plan. Implementation planning must be decomposed into separate plans for Foundation, Spring, Summer, Autumn, Winter, NG+, The Fifth Path, and Hollow. Each plan starts from the previous GREEN `integration/v3` checkpoint and must not silently include later-wave scope.

## 22. Vertical Slice Waves

### Wave 1 — Foundation

06 establishes:
- Save v3
- Campaign state contracts
- Legacy state
- World History state
- Character Bond state
- NEW_RUN skeleton

No campaign gameplay effects are enabled yet.

Gate: V2 save -> V3 hydrate -> save -> reload is stable, and existing gameplay behavior remains unchanged.

### Wave 2 — Spring / Path Convergence

Implement:
- behavior -> affinity
- partial-public tendency UI
- candidate selection
- campaign final choice

Gate: player can complete Spring and select at least two evidence-backed main campaign candidates, with an optional third normal candidate and any separately eligible hidden candidate.

### Wave 3 — Summer Vertical Slice

Create one complete Summer chapter for each main campaign:
- Caretaker: Guardian Festival rescue
- Pathfinder: forbidden map
- Vanguard: tournament
- Arcanist: Relic Resonance

Each slice must connect Story, World or Tactical objective, Season, Character Bond, fail-forward, UI, save, and Hub return.

Gate: all four Summer slices pass end-to-end before Autumn implementation expands.

### Wave 4 — Autumn

Implement Great Expedition, one Major Choice per campaign, two base choices, one earned conditional solution, and Winter consequences.

### Wave 5 — Winter and Ending

Implement The Long Night, four main final arcs, four final bosses or scenarios, modular ending resolution, and complete one-year campaigns.

### Wave 6 — NG+

Enable RunSummary, Legacy, World echoes, NEW_RUN transition, and second-run Spring behavior.

### Wave 7 — The Fifth Path

Build the True Campaign only after all normal campaigns and NG+ are stable.

### Wave 8 — Hollow Path

Danger tracking and subtle Veyr hints may exist earlier, but full Hollow content is built after normal routes are stable so it can deliberately transform established content.

## 23. Content Production Limits

The first complete main-campaign version prioritizes full-year completion over excessive side-content depth.

Per main campaign MVP:
- one Spring Commitment chapter
- one Summer main chapter
- one Autumn main chapter
- one Winter final chapter
- approximately one major character scene per season where relevant
- one Summer boss or climax
- one final boss or climax
- one Major Choice
- one or two essential World objectives per season
- one campaign Seasonal Objective set
- core ending variations

Character rollout priority:
1. Mira, Kael, Rex, Selene — deep representative content
2. Noa, Eiden — shared-world and decision content
3. Lyra, Veyr — hints first, expanded in True/Hollow phases

## 24. Balance Rules

Campaign identity should be driven more by player choices and behavior patterns than raw stat superiority.

No single repeatable activity may unlock Campaign, Character Bond, True, or Hollow progression by grinding alone.

Good-aligned choices are not always mechanically strongest. Dangerous choices may be stronger short-term while producing delayed costs.

Campaigns do not need identical DPS. They need comparable total problem-solving value in different domains.

Fail-forward outcomes should differ in content and consequences without making intentional defeat the universally optimal reward path.

## 25. Testing Strategy

### Domain Unit Tests

Required independent coverage:
- campaign affinity
- candidate selection
- campaign phase progression
- World Facts
- Character Bond
- Promise/Conflict/Memory sanitation
- Major Outcome idempotency
- danger and Hollow eligibility
- ending resolvers
- Legacy
- NG+ seed/reset

### Cross-Domain Contract Tests

Required contracts:
- Raising result -> campaign adapter
- World result -> campaign adapter
- Tactical result -> campaign adapter
- Season result -> campaign adapter
- Character Bond state -> Tactical intervention availability

### Vertical E2E

Each main campaign must cover:

`Spring -> Campaign selection -> Summer -> Autumn Major Choice -> Winter -> Ending -> save/load`

At least one critical-loss path must also cover:

`major defeat -> fail-forward consequence -> continued campaign -> Ending`

### Save QA

Release-blocking cases:
- new V3 save
- V2 -> V3
- V1/legacy hydration
- campaign mid-run save
- Major Choice before/after save
- major defeat immediately after save
- ending save
- NG+ transition before/after save
- stale IDs
- duplicate IDs
- malformed nested structures
- NaN
- Infinity
- negative invalid values
- future schema
- primary corruption -> backup recovery
- repeated load/save/load idempotency

### Long-Run Simulation

Simulate at minimum:
- 1 run
- 5 runs
- 10 runs

Check:
- save-size growth
- Legacy duplicates
- World Fact leakage
- campaign candidate lock-in
- repeated identical endings
- power creep
- currency inflation
- accidental Hollow unlock
- accidental True unlock
- successful fresh start after run 10

## 26. Release Gates

### Foundation Gate

Existing game behavior unchanged, save v3 compatible.

### Spring Gate

Four affinities, candidate evidence, minimum two main-campaign choices, and campaign selection stable.

### Summer Gate

All four campaign vertical slices complete end-to-end.

### Autumn Gate

Major Choice and conditional third solutions produce correct one-time consequences.

### Winter Gate

All four normal campaigns complete one full year and resolve endings.

### NG+ Gate

Ending -> Legacy -> new possibility -> second Spring works without current-run leakage.

### True Gate

The Fifth Path appears only from valid historical conditions and is entered only by explicit player selection.

### Hollow Gate

Risk accumulation alone never forces route entry; explicit final acceptance is mandatory.

## 27. Release Blockers

V3 cannot be declared complete if any of the following remain:
- V2 save loss or destructive migration
- duplicate rewards
- campaign choice changes after reload
- Major Choice double execution
- fail-forward consequence double application
- ending duplicate recording
- NG+ current-run state leakage
- accidental True or Hollow unlock
- NaN or Infinity propagation
- broken core hub/schedule/training/dialogue/month loop
- progression impossible at 360px width
- Tactical terminal-state leakage
- run-10 save/load failure

Room 06 has final authority for release gate decisions.

## 28. Milestones

### V3 Alpha

Spring Path Convergence plus all four Summer vertical slices. Purpose: validate whether the campaign identities are actually fun and distinct.

### V3 Beta

Full Spring-to-Winter normal campaigns and endings. Purpose: validate complete one-year replay structure.

### V3 RC

NG+, Legacy, long-run save QA, mobile polish, and release stability.

### Full V3 Major Update

RC foundation plus The Fifth Path and Hollow Path complete and verified.

## 29. Architectural Non-Goals

V3 does not:
- replace the existing 3v3 battle engine
- create four entirely separate world maps
- expose raw affinity, danger, or Character Bond optimization numbers
- retain raw combat power across NG+
- convert the whole game to event sourcing
- store dialogue or content text inside save files
- place campaign branching logic directly inside every domain engine
- add an unrelated second daily/weekly chore system
- rewrite V2 solely to fit V3

## 30. Final Architecture Summary

The new player loop is:

`Raising choices`
`-> Personality / Calling / Character Bond tendencies`
`-> Spring Path Convergence`
`-> one of four main campaigns or an explicitly selected eligible Fifth Path`
`-> campaign-specific World + Tactical + Season objectives`
`-> Character Bond interventions and Major Choices`
`-> fail-forward World History`
`-> Winter final arc`
`-> Campaign + Bond + World + Career ending`
`-> endgame or new possibility`
`-> Legacy and World echoes`
`-> alternate campaign history`
`-> The Fifth Path / Hollow Path`

The central architectural rule is:

**Keep existing domain engines authoritative and reusable; connect them through typed campaign adapters and persistent history so the systems gain shared meaning without becoming tightly coupled.**
