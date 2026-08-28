# V14 Living World / Scene System Design

Date: 2026-08-27
Repository: `asitiso/puppy-maker`
Baseline: `main@57c4b7975c5ae1936802c66a1a7446a82bf10f14`
Status: validated design, awaiting written-spec review

## 1. Purpose

V14 transforms puppy-maker from a mostly button/result-driven interface into a scene-driven raising RPG experience inspired by the presentation rhythm of classic raising games such as Princess Maker, while preserving the existing raising, story, expedition, tactical, persistence, NG+, bond, equipment, and world-state logic.

The key player-facing change is:

`menu -> button -> text result`

becomes:

`living location -> visible object/NPC -> character approaches -> action/animation -> story/minigame/battle -> canonical game result -> changed world scene`

V14 is not a rewrite of the game rules. It adds a new presentation and interaction layer that turns existing rules into visible places, actors, movement, interactions, and changing scenes.

## 2. Product decisions already fixed

The following decisions are authoritative for V14:

1. Major flows covered by the first V14 program are Home, Training, Outing, Story, and Expedition.
2. Tactical combat remains the existing Tactical engine and is entered from / returned to Scene Runtime rather than rewritten as a new scene combat system.
3. Character presentation uses a hybrid model:
   - ordinary life and dialogue: layered pose/expression art plus lightweight motion;
   - training, battle-adjacent actions, and special actions: sprite animation where worthwhile.
4. Ordinary actions use short scene presentation; important training, special outings, major story moments, and boss/special situations may use short minigames.
5. Routine scheduled actions may transition directly to their scene. Outing, Story, special activities, and Expedition use a world-map/location-selection flow where appropriate.
6. Locations change not only visually but also functionally with time, season, weather, story progression, world facts, and selected relationship/progression state.
7. Characters have state-reactive autonomous behavior when no higher-priority directed action is active.
8. Scene movement is anchor-based point-and-click, not free joystick movement and not arbitrary pathfinding.
9. The world itself is the primary interface, but a compact mobile quick menu remains as a secondary accessibility/convenience path.
10. Canonical gameplay state remains reducer-authoritative. Scene animation state is never authoritative game state.

## 3. Goals

### 3.1 Player experience goals

V14 must make the player feel that Runa lives in a world rather than inside a collection of menus.

The player should be able to:

- see Runa and companions behave differently according to condition, mood/personality, bond, activity, and story state;
- enter visibly different places for training, outings, story, and expedition;
- tap scene objects and NPCs instead of relying only on menu buttons;
- watch Runa approach and interact before the canonical result occurs;
- experience the same location differently by season, time of day, weather, and world changes;
- see important previous choices reflected physically in scenes;
- move between Expedition exploration scenes and the existing Tactical 3v3 system without losing run state;
- reload safely without duplicate rewards or broken scene progression.

### 3.2 Engineering goals

V14 must:

- preserve the current reducer/domain systems as the sole authority for rewards, stats, progression, records, and durable state;
- isolate scene composition from domain calculations;
- keep scene definitions data-driven enough that locations and events can expand without cloning large React screens;
- make malformed/old scene metadata recover safely;
- provide deterministic enough world variation that repeated visits in the same game week do not feel random or contradictory;
- maintain mobile-first interaction, reduced-motion support, keyboard/focus accessibility, and current save compatibility.

## 4. Non-goals

V14 does not add:

- free-roaming joystick controls;
- collision physics or arbitrary pathfinding;
- a tile-map engine;
- a replacement Tactical battle engine;
- full Live2D/Spine character animation;
- separate authoritative state for scene coordinates, camera frames, particles, animation frames, or pose transitions;
- hundreds of hand-authored background variants for every season/time/weather combination;
- gameplay rewards calculated inside React components or Scene Runtime.

## 5. Existing systems to preserve and extend

The design intentionally builds around current structures rather than replacing them.

### 5.1 Existing visual layer

`MobileSceneBackground` and `MobileCharacterArt` already render visual slots with fallbacks. `mobile-visual-assets.ts` provides a low-level asset registry. These remain useful as low-level render/fallback mechanisms, but V14 adds higher-level concepts for location, variant, actors, props, and choreography.

### 5.2 Existing Runa presentation

`runa-presentation.ts` already exposes Runa poses such as `idle`, `talk`, `surprised`, `training-ready`, and `tired`. V14 treats these as the starting pose set for the Runa actor rather than discarding them.

### 5.3 Existing Story logic

`game/events.ts` already separates Story eligibility, choices, and results from presentation. `StoryEvent.tsx` currently provides a two-character presentation shell. V14 replaces the shell with scene choreography while continuing to dispatch canonical Story actions such as `EVENT_CHOICE`.

### 5.4 Existing Outing logic

`adventure.ts` already defines the canonical Outing locations:

- `forest` -> 별빛 숲
- `village` -> 마법 마을
- `lakeside` -> 바람 호숫가

It also defines location-specific events and discoveries such as `glowing_tracks`, `ancient_tree`, `street_performance`, `wand_repair`, `silver_fish`, `quiet_breeze`, `moon_feather`, `star_mushroom`, `tiny_bell`, `old_spellbook`, `glass_shell`, and `wind_crystal`.

V14 turns those outcomes into scene objects and scene events rather than replacing their canonical resolution logic.

### 5.5 Existing Tactical / companion systems

The existing Tactical engine remains authoritative. The current companion identities remain meaningful outside combat as presentation behavior:

- Bear: guard/protective, stable, slower movement;
- Owl: insight/analysis, elevated or observational placement;
- Wolf: momentum/scouting, fast entry and path/foe awareness;
- Cat: trick/trickster, prop curiosity and hidden-item behavior.

Existing Bond levels remain canonical; scene behavior may derive from them but must not invent a second relationship value.

### 5.6 Existing time/state hydration

`weekly-calendar.ts` already normalizes `year`, `month`, and `week`. Existing game hydration sanitizes malformed state. V14 follows the same rule for any new durable checkpoint/state additions.

## 6. Architecture overview

The recommended architecture is:

```text
GameState / Domain State
        |
        v
Scene Resolver
        |
        v
Resolved Scene
        |
        v
Scene Director
   |          |
   v          v
Actors     Interactive Objects
   \          /
    \        /
     v      v
   Activity Adapter
        |
        v
 Existing Action / Domain API
        |
        v
 Existing reducer
        |
        v
 New authoritative GameState
        |
        v
 Re-resolve scene
```

The major units are:

1. Scene Types — stable data contracts.
2. Scene Registry — location/scene definitions.
3. Scene Resolver — derives a resolved scene from canonical game state + requested activity.
4. Scene Director — executes scene beats and interaction phases.
5. Scene Stage — renders background layers, actors, props, effects, and hit areas.
6. Character Actor — renders pose/sprite and controlled/autonomous movement.
7. Interactive Object — exposes scene interactions and anchor destinations.
8. Activity Adapters — bridge scene interactions to existing domain actions/resolvers.
9. Activity Checkpoint — minimal semantic persistence for long-running flows.
10. Asset Registry / Fallback — resolves layered background and actor assets safely.

Each unit must be independently testable and have a narrow responsibility.

## 7. Core data model

Names below are design-level contracts. Exact file/export names may be adjusted in the implementation plan only if responsibilities stay unchanged.

```ts
type SceneId = string;
type LocationId =
  | 'home'
  | 'training_ground'
  | 'magic_classroom'
  | 'herb_garden'
  | 'forest'
  | 'village'
  | 'lakeside'
  | 'old_shrine'
  | 'expedition_field';

type TimeOfDay = 'dawn' | 'day' | 'sunset' | 'night';
type Season = 'spring' | 'summer' | 'autumn' | 'winter';
type Weather = 'clear' | 'cloudy' | 'rain' | 'snow' | 'mist';

type InteractionMode =
  | 'dialogue'
  | 'inspect'
  | 'collect'
  | 'travel'
  | 'rest'
  | 'shop'
  | 'training'
  | 'choice'
  | 'minigame'
  | 'explore'
  | 'battle'
  | 'reward';

type SceneDefinition = {
  id: SceneId;
  location: LocationId;
  defaultTime: TimeOfDay;
  cast: SceneActorDefinition[];
  anchors: SceneAnchor[];
  interactions: SceneInteractionDefinition[];
  beats?: SceneBeat[];
};

type ResolvedScene = {
  id: SceneId;
  location: LocationId;
  season: Season;
  timeOfDay: TimeOfDay;
  weather: Weather;
  backgroundLayers: SceneVisualLayer[];
  cast: ResolvedSceneActor[];
  interactions: ResolvedSceneInteraction[];
  beats: SceneBeat[];
};
```

Scene definitions are declarative. Domain results are not encoded as direct stat mutations inside scene definitions.

## 8. Scene Resolver

The Scene Resolver is a pure or near-pure selector that receives canonical state and a requested scene/activity context and returns a `ResolvedScene`.

Inputs include only durable or deterministic values such as:

- `year`, `month`, `week`;
- current requested location/activity;
- story/event state;
- world facts and campaign markers;
- Runa condition/personality/calling as needed for presentation;
- companion Bond/progression as needed for presentation;
- known unlocks/discoveries;
- semantic activity checkpoint for resumable content.

It must not depend on current DOM layout, animation frames, wall-clock time, or random calls that change every render.

Resolution priority for variant overrides is:

1. Story override
2. Campaign / World Fact override
3. Location special condition
4. Weekly deterministic weather
5. Default location state

This priority is mandatory to avoid contradictory scene composition.

## 9. World-map and location model

V14 uses nine core scene spaces.

### 9.1 Home / 루나의 방

Primary interactions:

- Runa -> bond/interaction
- bed -> rest
- desk -> schedule/study
- wardrobe -> outfit
- bag -> inventory/equipment
- door -> outing/world-map entry
- map/window -> world map
- companion -> dialogue/Bond interaction

Home is the baseline living scene. Runa performs low-priority autonomous behavior when no directed scene beat is active.

### 9.2 Training Ground / 훈련장

Used for physical/hunt/combat-oriented raising activities.

Primary objects:

- training dummy
- weapon rack
- instructor
- companion
- exit

Normal sessions use short presentation. Eligible special sessions may launch a bounded minigame before committing the canonical training result.

### 9.3 Magic Classroom / 마법 교실

Used for magic-oriented raising activities.

Primary objects:

- magic circle
- books
- instructor
- practice target
- exit

Important training may use a timing/casting minigame. Mastery progression may unlock visual effects/props without changing the authoritative mastery model.

### 9.4 Herb Garden / 약초 정원·연금 작업대

Used for herb/crafting-flavored raising activities.

Primary objects:

- herb patches
- pots
- workbench
- ingredient rack
- instructor/companion when applicable

Important sessions may use a short ingredient-selection or combination minigame.

### 9.5 Forest / 별빛 숲

Canonical mapping: existing Outing `forest`.

V14 visualizes current forest exploration outcomes through tappable props and event staging. Existing exploration XP, discoveries, and Outing effects remain authoritative.

### 9.6 Village / 마법 마을

Canonical mapping: existing Outing `village`.

Primary objects may include:

- shop
- square/fountain
- notice board
- performance/NPC spot
- alley
- companion

Time, weather, and Story/World Fact state may change NPCs and available interactions.

### 9.7 Lakeside / 바람 호숫가

Canonical mapping: existing Outing `lakeside`.

Primary objects may include:

- water edge
- fishing/observation point
- stone/rest spot
- wind-crystal point
- companion

### 9.8 Old Shrine / 오래된 제단·유적

A Story/Expedition bridge location unlocked through progression. It supports inspect/choice/story interaction and may hand off to Tactical when an encounter occurs.

### 9.9 Expedition Field / 원정 지역

A scene family, not one flat map. It presents semantic nodes such as camp, path, crossroads, ruin, rift, treasure, encounter, and return. Existing Expedition/Tactical domain state stays authoritative.

## 10. World variation

### 10.1 Season

Season is derived from canonical month, never persisted as a separate counter.

The mapping is fixed for V14:

- months 1-3 -> `spring`
- months 4-6 -> `summer`
- months 7-9 -> `autumn`
- months 10-12 -> `winter`

All V14 scene code must derive season through one shared helper so save/load and NG+ cannot drift from the canonical calendar.

### 10.2 Time of day

V14 uses:

- dawn
- day
- sunset
- night

Time of day is an activity presentation context, not a real-world clock. Activity/story definitions determine default time and may override it.

### 10.3 Weather

V14 uses:

- clear
- cloudy
- rain
- snow
- mist

Weekly base weather is deterministic from canonical `weekKey(year, month, week)` through one shared weather resolver. Re-entering a location in the same week must resolve the same base weather. Location presentation may transform that base weather (for example rain -> rain+mist in Forest), but may not reroll it independently on every visit or render.

### 10.4 World facts and progression

Important World Facts must visibly alter scene composition when relevant. Examples include:

- an opened ancient route adds a real path/prop/interaction;
- a saved festival produces restored decorations/NPC behavior;
- heavy losses may show damage/repair state and alter available interactions.

NG+ inherited echoes may appear as non-authoritative visual traces or special interactions, but must not be confused with current-run facts.

## 11. Layered scene visuals

V14 must not produce a separate painted background for every combinatorial variant.

Scene visuals are composed from layers:

```text
Base Location Background
+ Season Layer
+ Time Lighting
+ Weather FX
+ World Fact Overlay / Prop
+ Interactive Props
+ Actors
+ Foreground FX
```

This keeps asset growth manageable while allowing visibly different visits.

Fallback order for a missing visual is:

1. specific variant asset
2. less-specific season/location asset
3. base location asset
4. generic V14 scene fallback

A missing optional visual must never block canonical gameplay.

## 12. Character Actor system

### 12.1 Actor state

An actor may resolve presentation fields such as:

- character id
- outfit
- pose
- expression
- anchor
- facing
- scale/depth
- motion
- activity
- mood

These are presentation values unless an existing domain system already owns the underlying concept (for example outfit selection).

### 12.2 Motion model

Ordinary presentation uses layered pose art plus lightweight transforms/effects:

- translate
- scale
- flip
- breathing
- bob
- shake
- fade
- small jump
- enter/exit motion

Special presentation may use sprites for:

- walk/run where needed
- training
- magic cast
- attack/battle-adjacent action
- hurt
- signature/special actions

The system must support pose fallback when sprite assets are unavailable.

### 12.3 Runa initial expanded presentation target

Existing poses are preserved. The first V14 actor target should cover the equivalent of:

- idle
- talk
- happy
- surprised
- tired
- worried
- sit
- training-ready

plus a limited sprite/action set for walk, train, magic, and special action where assets exist.

### 12.4 Companion presentation behavior

Companion presentation derives from existing companion identity and Bond.

Examples:

- Bear prefers protective/proximate placement and slower stable motion.
- Owl prefers observation, elevated/back positions, and inspect reactions.
- Wolf prefers faster movement and path/enemy reactions.
- Cat prefers prop curiosity, playful motion, and hidden-item reactions.

Higher Bond may allow closer default placement, proactive greeting, or extra non-blocking interactions. Bond must never be duplicated into a second scene-only progression value.

### 12.5 Personality presentation

Runa personality may alter choreography or reaction style without duplicating or silently changing canonical stats.

Examples:

- high courage: approach a suspicious trace more directly;
- high calmness: pause/observe before interacting;
- high curiosity: quicker/excited reaction to discoveries.

## 13. Actor anchors and movement

V14 deliberately avoids arbitrary free movement and pathfinding.

Every location defines semantic anchors such as:

Home:

- bed
- desk
- wardrobe
- window/map
- door
- center
- Runa idle
- companion corner

Village:

- entrance
- square
- shop
- notice board
- alley
- fountain
- NPC left/right
- exit

An interactive object references an approach anchor. The flow is:

`tap object -> lock interaction -> actor moves to anchor -> face/act -> domain adapter -> canonical commit -> result presentation`

This provides the appearance of purposeful movement while keeping mobile layout deterministic and testable.

## 14. Actor behavior priority

Character behavior priority is fixed as:

1. directed Story choreography
2. player-initiated interaction
3. current Training/Outing/Expedition activity
4. condition/state reaction
5. autonomous living behavior
6. idle

Lower-priority behavior must immediately yield when a higher-priority behavior starts.

## 15. Scene Interaction system

A scene interaction definition contains presentation and routing information, not direct game-state mutation.

Conceptual contract:

```ts
type SceneInteractionDefinition = {
  id: string;
  objectId: string;
  anchorId: string;
  mode: InteractionMode;
  availability?: SceneCondition;
  approachMotion?: string;
  actionMotion?: string;
  adapter: ActivityAdapterId;
  command: SceneCommand;
};
```

The normal interaction lifecycle is:

```text
idle
 -> approaching
 -> acting
 -> committing
 -> presenting
 -> idle
```

After `approaching` begins, the same interaction cannot be started again until the lifecycle returns to `idle` or is safely cancelled before commit.

UI locking is not sufficient protection: domain actions/resolvers must remain idempotent or validate already-completed outcomes where duplicate rewards are possible.

## 16. Interaction modes

V14 standardizes common interaction modes rather than creating a new subsystem per location:

- dialogue
- inspect
- collect
- travel
- rest
- shop
- training
- choice
- minigame
- explore
- battle
- reward

Examples:

- Forest = explore + inspect + collect + dialogue
- Magic Classroom = training + dialogue + minigame
- Village = shop + dialogue + inspect
- Expedition = explore + choice + battle + reward

## 17. Story choreography

Story is a directed scene mode. During mandatory Story beats, unrelated scene objects are not interactable.

A Story scene may define beats such as:

```ts
type SceneBeat =
  | { type: 'enter'; actor: string; anchor: string }
  | { type: 'move'; actor: string; anchor: string; motion?: string }
  | { type: 'pose'; actor: string; pose: string; expression?: string }
  | { type: 'dialogue'; speaker: string; text: string }
  | { type: 'effect'; effect: string }
  | { type: 'highlight'; objectId: string }
  | { type: 'waitForInteraction'; interactionId: string }
  | { type: 'choice'; choiceSetId: string }
  | { type: 'handoff'; activity: 'training' | 'explore' | 'battle' | 'reward' };
```

Story choice results continue to use the existing canonical Story action path. Post-choice scene beats must be selected from the already-committed game result; they must not commit rewards a second time.

## 18. Training interaction and minigames

Training is scene-first but domain-authoritative.

Normal training flow:

```text
enter training scene
 -> tap/use training object
 -> short action animation
 -> Training Adapter
 -> existing training resolution/action
 -> canonical GrowthReport/state update
 -> success/failure/result presentation
 -> return/next scene
```

Special training may insert a 10-30 second minigame before canonical commit.

For V14, minigame performance is presentation-only: it may choose animation, dialogue, feedback grade, camera/effect intensity, or other non-durable presentation, but it does not change stats, rewards, mastery, or canonical training quality. Existing training resolution remains fully authoritative.

Any future design that makes minigame performance modify canonical growth must be separately designed and tested against the existing Raising balance/API before implementation. Direct stat mutation from minigame UI is forbidden.

## 19. Outing interaction

Existing Outing state remains canonical.

Example Forest flow:

```text
enter forest scene
 -> discover/tap visible trace
 -> Runa approaches trace anchor
 -> inspect animation
 -> Outing Adapter calls existing exploration outcome logic
 -> canonical event/discovery chosen
 -> matching scene/event presentation
 -> existing effects/records committed through domain path
 -> scene re-resolves if world state changed
```

The same principle applies to Village and Lakeside.

## 20. Expedition and Tactical handoff

Expedition becomes a chain of semantic scenes and domain nodes rather than a direct battle menu.

Example:

```text
world map
 -> expedition entry
 -> camp scene
 -> path scene
 -> inspect/branch
 -> encounter
 -> Tactical handoff
 -> existing Tactical 3v3
 -> COMPLETE_TACTICAL_BATTLE
 -> canonical battle/Bond/reward state updated
 -> return to Expedition semantic checkpoint
 -> next scene / reward / boss / return
```

Scene Runtime must never reconstruct Tactical battle results itself.

Companion exploration advantages may reveal safer options, hints, or bonus rewards, but absence of a specific companion must not permanently hard-lock main progression unless the existing canonical design already requires it.

## 21. Activity Adapters

V14 defines thin adapters for:

- Raising
- Story
- Outing
- Expedition
- Tactical

Adapters convert scene commands into existing domain API calls or reducer actions and convert the committed result back into presentation context.

Adapters must not become large alternative reducers.

Each adapter must expose a narrow interface equivalent to:

```text
validate scene command
 -> perform/dispatch canonical domain operation
 -> return committed presentation result
```

## 22. Commit-before-presentation rule

Any gameplay result that changes durable state uses:

`gameplay commit -> persistence -> result presentation`

not:

`result presentation -> later commit`.

Example:

```text
minigame finishes
 -> Adapter dispatches canonical action
 -> new GameState becomes authoritative and saveable
 -> success animation plays
```

If the app closes during the success animation, the player must retain the committed result and must not be able to collect it again on reload.

## 23. Persistence and checkpoints

### 23.1 Ephemeral scene runtime

The following are not persisted as authoritative save data:

- actor screen coordinates
- animation frame
- camera zoom/pan
- particles
- breathing/bob state
- transient highlight/glow state
- CSS transition progress
- temporary pose tween

Reload resolves a safe scene from canonical state.

### 23.2 Semantic Activity Checkpoint

Long activities may persist a minimal semantic checkpoint. Checkpoint phases are adapter-owned literal unions, not arbitrary strings.

Conceptual structure:

```ts
type ActivityCheckpoint =
  | {
      activity: 'story';
      activityId: string;
      phase: 'intro' | 'choice' | 'post_choice';
      committedKey: string | null;
    }
  | {
      activity: 'training';
      activityId: string;
      phase: 'intro' | 'pre_commit' | 'post_commit';
      committedKey: string | null;
    }
  | {
      activity: 'expedition';
      activityId: string;
      phase: 'entry' | 'node' | 'post_encounter' | 'post_reward';
      semanticNodeId: string;
      committedKey: string | null;
    };
```

These phases represent game-meaningful boundaries, never animation frames. The persisted schema must be versioned/sanitized using the same defensive style as existing game hydration.

### 23.3 Reload behavior

If a Story choice has not committed, reload may resume from a safe pre-choice/choice checkpoint.

If the Story choice has committed, reload must not show a claimable choice again; it resolves to the result/next safe scene from canonical event history/state.

If an Expedition battle reward has committed, reload resumes after that encounter, not before it.

## 24. Error recovery and malformed state

V14 must be fail-soft.

Examples:

- unknown location id -> recover to the nearest safe canonical location, normally Home unless an active domain flow provides a safer checkpoint;
- invalid anchor -> use scene default actor anchor;
- missing actor pose -> fall back to actor idle/default pose;
- missing sprite -> fall back to still pose + lightweight motion;
- missing background variant -> layered fallback chain;
- invalid/old checkpoint -> discard/sanitize it and derive a safe scene from authoritative game state;
- invalid duplicate interaction command -> reject without duplicate domain commit.

An optional presentation asset failure must never corrupt canonical game state.

## 25. Mobile UX and accessibility

V14 remains mobile-first.

Required target viewports include at minimum:

- 360x640
- 390x844
- 430px-class widths

Requirements:

- interactive hit targets are at least 44px even when the visible prop is smaller;
- actor and interaction hit areas do not cover critical quick-menu actions;
- safe-area insets are respected;
- long Korean labels/dialogue wrap without hiding choices;
- focus-visible states exist for keyboard navigation;
- mandatory interactions have accessible labels, not only visual glow;
- `prefers-reduced-motion` reduces/removes walk interpolation, camera zoom, shake, and repeated motion while preserving semantic order and gameplay outcomes;
- reduced-motion may snap actors between anchors while keeping dialogue/interaction state intact;
- the world-object interface has a secondary quick-menu route for important core functions.

## 26. Interaction hint policy

V14 does not make every interactive prop pulse continuously.

Hints may appear when:

- a mandatory Story target needs attention;
- a newly available interaction appears;
- the player is idle for a short period;
- an accessibility setting/interaction mode requests stronger cues.

Hints should use restrained glow/outline/bounce and must not create permanent visual noise.

## 27. Proposed source boundaries

Tentative source layout:

```text
src/scene/
  scene-types.ts
  scene-registry.ts
  scene-resolver.ts
  SceneDirector.tsx
  SceneStage.tsx
  CharacterActor.tsx
  InteractiveObject.tsx
  scene-asset-registry.ts
  scene-weather.ts
  scene-calendar.ts
  activity-checkpoint.ts
  adapters/
    raising-adapter.ts
    story-adapter.ts
    outing-adapter.ts
    expedition-adapter.ts
    tactical-adapter.ts
```

Existing components such as `MobileSceneBackground`, `MobileCharacterArt`, and `runa-presentation.ts` should be reused or wrapped where that avoids needless migration. They should not absorb Scene Director responsibilities.

`LayeredHome.tsx` must not become the scene engine. Home should consume the new Scene system rather than expanding into a larger monolith.

## 28. Implementation program / decomposition

V14 is one product update but should be implemented in ordered PR-sized slices under a shared design.

### Slice A — Scene Foundation

- scene types
- location registry
- deterministic calendar/season/weather helpers
- layered asset resolution/fallback
- Scene Resolver
- Scene Director state machine
- Scene Stage
- Character Actor anchor movement
- Interaction lifecycle/locking
- reduced-motion behavior
- unit tests for pure resolution and state machine logic

### Slice B — Living Home + navigation

- Home scene conversion
- Runa state-reactive autonomous behavior
- clickable bed/desk/wardrobe/bag/door/map/companion affordances
- quick menu compatibility
- world-map shell and location unlock presentation

### Slice C — Training scenes

- Training Ground
- Magic Classroom
- Herb Garden
- normal short training presentation
- one bounded special-training minigame whose performance affects presentation only in V14
- result presentation from committed GrowthReport/state

### Slice D — Outing scenes

- Forest
- Village
- Lakeside
- map selection
- existing Outing event/discovery integration
- season/time/weather variants
- companion reactions

### Slice E — Story choreography

- StoryEvent shell migration to Scene beats
- convert the existing Story event set to scene metadata/choreography
- directed interaction/choice flow
- commit-safe reload behavior

### Slice F — Expedition/Tactical bridge

- Expedition semantic scene nodes
- encounter handoff to existing Tactical
- return-to-scene flow after battle
- semantic checkpoints
- duplicate reward/idempotence coverage

### Slice G — World consequences and polish

- visible World Fact overlays/props/interactions
- NG+ echo presentation
- broader actor personality/Bond reactions
- mobile/short-phone polish
- performance/accessibility regression

No slice may redefine canonical reward/stat logic in Scene Runtime.

## 29. Testing strategy

### 29.1 Pure unit tests

Cover at minimum:

- month -> season derivation using the fixed V14 mapping;
- week -> deterministic weather;
- Story override priority over weather/location defaults;
- World Fact variant selection;
- unknown location fallback;
- missing asset fallback order;
- actor pose fallback;
- actor behavior priority;
- interaction lifecycle and duplicate-tap lock;
- checkpoint sanitization including invalid literal phases;
- committed vs uncommitted reload resolution.

### 29.2 Adapter tests

For each Activity Adapter:

- valid scene command produces the intended existing canonical action/result;
- invalid/locked command is rejected;
- repeated command cannot duplicate reward/progression;
- result presentation is derived from committed state, not guessed before reducer result.

### 29.3 Integration tests

Required playable flows include:

1. Home -> Training -> committed result -> Home
2. Home -> World Map -> Forest -> exploration event/discovery -> return
3. Story scene -> choice -> committed result -> reload -> no duplicate choice/reward
4. Expedition scene -> Tactical -> battle completion -> return to post-battle scene
5. reload during a presentation after commit -> committed state retained, no duplicate reward
6. malformed/legacy checkpoint -> safe recovery
7. reduced-motion flow preserves interaction order and gameplay result

### 29.4 Mobile/accessibility tests

Cover narrow/short layouts for:

- no critical overlap between actors, interaction targets, dialogue, and quick menu;
- 44px target minimum;
- Korean wrapping;
- focus-visible interaction;
- reduced motion.

### 29.5 Regression gate

Each slice must run its targeted suite, relevant feature suites, full regression, typecheck, and production build before promotion according to the existing single-room project workflow.

## 30. Performance constraints

The design should avoid unnecessary rerenders and asset churn.

Requirements:

- Scene Resolver should be deterministic and memoizable from meaningful state inputs;
- weather/season should not reroll on component render;
- off-screen/unneeded heavy sprite assets should not all load eagerly;
- particle/weather effects should degrade gracefully on constrained devices and under reduced motion;
- background layering should prefer lightweight compositing over duplicate full-size variants when possible.

No hard numeric performance target is introduced in this spec. V14 must preserve responsive interaction on the existing supported mobile viewport/device class; any measurable regression discovered during implementation must be treated as a release blocker for the affected slice.

## 31. Acceptance criteria

V14 is considered product-complete only when all of the following are true:

1. Home, Training, Outing, Story, and Expedition all enter through the shared Scene architecture rather than five unrelated one-off visual implementations.
2. Tactical remains the existing battle engine and can be entered from and returned to Expedition scenes safely.
3. The player can interact with meaningful scene objects/NPCs using point-and-click behavior with visible actor approach/action presentation.
4. Core interactions still have a compact quick-menu/secondary route where required for mobile usability.
5. Runa presentation reacts to at least condition/context and supports the hybrid pose/sprite model with fallback.
6. Companion presentation can derive behavior from existing role/Bond state without creating duplicate progression state.
7. Forest, Village, and Lakeside reuse the existing canonical Outing logic and visibly stage their exploration/events/discoveries.
8. Story choices continue through canonical Story actions, and resolved choices cannot be repeated after reload.
9. Expedition battle completion cannot be duplicated by reload or rapid repeated interaction.
10. Season is derived from canonical calendar state using the fixed V14 month mapping, not separately persisted.
11. Weekly weather is deterministic for a canonical game week and supports Story/World Fact override priority.
12. At least representative World Facts can visibly add/change scene props or interactions.
13. Missing visual assets fall back without blocking gameplay.
14. Unknown/malformed scene checkpoint data recovers safely.
15. Reduced-motion mode preserves all gameplay outcomes while reducing movement/camera effects.
16. Supported narrow/short mobile viewports remain usable with minimum 44px interaction targets and no critical action overlap.
17. Existing domain regression suites remain green, plus new Scene/Adapter/reload/idempotence tests are green.
18. Typecheck and production build are green before merge/promotion.

## 32. Design invariants

The following invariants are not negotiable during implementation unless this design is explicitly revised:

- reducer/domain logic is authoritative;
- Scene Runtime cannot directly award stats, items, currency, Bond, discoveries, progression, or battle results;
- V14 minigames do not modify canonical growth/rewards;
- gameplay commit occurs before result-only presentation;
- animation frames/actor pixel coordinates are not durable game state;
- long-flow persistence uses sanitized semantic checkpoints with adapter-owned literal phases only;
- free joystick movement/pathfinding is outside V14 scope;
- scene assets are layered/fallback-capable rather than combinatorially pre-rendered;
- Home does not become a new monolithic scene engine;
- the same Scene architecture must serve all five V14 product areas;
- optional presentation failure cannot corrupt or block canonical game progression.

## 33. Expected player-facing outcome

After V14, a representative play sequence should feel like:

```text
Runa is visible in her room
 -> player taps the door
 -> Runa walks to the door
 -> world map appears
 -> player selects Starry Forest
 -> forest scene resolves for current season/time/weather/world state
 -> Runa enters and companion reacts
 -> player taps a visible trace
 -> Runa approaches and investigates
 -> existing exploration logic selects the canonical outcome
 -> a staged Story/event scene plays
 -> canonical choice/result commits
 -> the forest scene re-resolves to reflect any world change
 -> later an Expedition encounter hands off to Tactical
 -> battle resolves in the existing engine
 -> player returns to the correct post-battle Expedition scene
 -> save/reload cannot duplicate committed rewards
```

The target feeling is not merely “the old screens have nicer backgrounds.” The target is a coherent living-world presentation layer in which places, characters, interactions, and consequences visually express the game systems that already exist.
