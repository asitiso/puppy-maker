# V14 Living World / Scene System — Reviewed Implementation Plan

> Authoritative execution plan. This supersedes the earlier draft `2026-08-27-v14-living-world-scene-system.md` where the two differ.

**Goal:** Turn Home, Training, Outing, Story, and Expedition into one shared scene-driven living-world experience while keeping current domain/reducer systems authoritative for every durable gameplay result.

**Approved design:** `docs/superpowers/specs/2026-08-27-v14-living-world-scene-system-design.md`

**Implementation branch:** `work/v14-living-world`

**Starting point:** latest `main`, currently verified design baseline `57c4b7975c5ae1936802c66a1a7446a82bf10f14`. At execution start, create/rebase the implementation branch from the latest non-regressed `main` and bring the approved spec and this reviewed plan onto it before source changes.

## Fixed architecture and safety rules

1. `GameState`/existing domain modules remain the only authority for stats, currency, items, discoveries, Bond, Story results, World Facts, equipment, Tactical records, and progression.
2. Flow is `GameState -> Scene Resolver -> Scene Director -> Actor/Object -> Activity Adapter -> existing Action/domain API -> reducer -> committed GameState -> re-resolve`.
3. Gameplay commits before result presentation. Animation cannot be the source of truth.
4. V14 minigames are presentation-only. Their quality labels never alter `eventRoll`, stat gains, rewards, mastery, Bond, or any canonical calculation.
5. Movement is anchor-based point-and-click. No joystick, free pathfinding, collision physics, or tile-map engine.
6. Behavior priority is Story > player interaction > current activity > state reaction > autonomous > idle.
7. Interaction phase is `idle -> approaching -> acting -> committing -> presenting -> idle`; a second tap after approach begins is ignored for that interaction cycle.
8. Season is derived only from canonical month: 1-3 spring, 4-6 summer, 7-9 autumn, 10-12 winter.
9. Weekly base weather is deterministic from `weekKey(year,month,week)`; no `Math.random`, wall-clock time, or reroll on render/re-entry.
10. Variant priority is Story override > Campaign/World Fact > location special condition > weekly weather > default.
11. Durable Scene persistence is limited to semantic activity checkpoints. Never save actor pixels, animation frame, camera, particle, temporary pose, hover, or tween state.
12. Missing assets and malformed scene/checkpoint values fail soft to canonical fallbacks.
13. Tactical battle calculations remain in the current Tactical engine; V14 only bridges scene entry/return.
14. Home styling integration boundary is `src/layered-home.css`; shared new scene styling lives in `src/scene/scene.css`.
15. Mobile gate: 360x640, 390x844, ~430px width, >=44px targets, safe area, Korean wrapping, focus-visible, reduced-motion semantic parity.

## New module layout

Core:
- `src/scene/scene-types.ts`
- `src/scene/scene-calendar.ts`
- `src/scene/scene-weather.ts`
- `src/scene/scene-asset-registry.ts`
- `src/scene/scene-registry.ts`
- `src/scene/scene-resolver.ts`
- `src/scene/scene-runtime.ts`
- `src/scene/activity-checkpoint.ts`
- `src/scene/scene-consequences.ts`

Adapters:
- `src/scene/adapters/raising-adapter.ts`
- `src/scene/adapters/story-adapter.ts`
- `src/scene/adapters/outing-adapter.ts`
- `src/scene/adapters/expedition-adapter.ts`
- `src/scene/adapters/tactical-adapter.ts`

React/presentation:
- `src/scene/SceneDirector.tsx`
- `src/scene/SceneStage.tsx`
- `src/scene/CharacterActor.tsx`
- `src/scene/InteractiveObject.tsx`
- `src/scene/WorldMapScene.tsx`
- `src/scene/training-scenes.ts`
- `src/scene/outing-scenes.ts`
- `src/scene/story-scenes.ts`
- `src/scene/expedition-scenes.ts`
- `src/scene/scene.css`

Existing exact integration files include:
- Home/navigation: `src/LayeredHome.tsx`, `src/Root.tsx`, `src/layered-home.css`
- Training: `src/App.tsx`, existing `src/game-core.ts`
- Story: `src/components/StoryEvent.tsx`, `src/game/events.ts`
- Outing: `src/adventure.ts`
- Persistence: `src/v3-persistent-state.ts`, `src/game.ts`
- Expedition/Tactical bridge: `src/GuardianExpeditionOverlay.tsx`, `src/TacticalExpeditionFlow.tsx`, `src/Root.tsx`
- Tactical domain: existing Tactical modules including `src/tactical-battle.ts` remain calculation authority.

All tasks below use TDD: write RED -> run exact targeted test and observe failure -> minimal implementation -> targeted GREEN -> relevant regression -> commit.

---

## Task 1 — Scene contracts, season, deterministic weather

**Create:** `src/scene/scene-types.ts`, `scene-calendar.ts`, `scene-calendar.test.ts`, `scene-weather.ts`, `scene-weather.test.ts`.

- [ ] Define the nine exact `LocationId`s: `home`, `training_ground`, `magic_classroom`, `herb_garden`, `forest`, `village`, `lakeside`, `old_shrine`, `expedition_field` plus fixed unions for time, season, weather, interaction modes, actors, anchors, beats, visual layers, requests and resolved scenes. Do not include direct durable reward/stat mutation fields in Scene definitions.
- [ ] RED: `scene-calendar.test.ts` asserts month boundaries and malformed-month normalization.
- [ ] Run `npx vitest run src/scene/scene-calendar.test.ts`; confirm failure because implementation is absent.
- [ ] Implement `seasonForMonth` with the fixed mapping.
- [ ] GREEN: rerun the calendar test.
- [ ] RED: `scene-weather.test.ts` asserts same canonical week always returns the same member of `clear|cloudy|rain|snow|mist`.
- [ ] Run `npx vitest run src/scene/scene-weather.test.ts`; confirm RED.
- [ ] Implement a stable hash of existing `weekKey(year,month,week)`; do not use random/time APIs.
- [ ] GREEN: `npx vitest run src/scene/scene-calendar.test.ts src/scene/scene-weather.test.ts`.
- [ ] Commit: `feat(v14): add scene world contracts`.

## Task 2 — Layered asset registry and fail-soft fallback

**Create:** `src/scene/scene-asset-registry.ts`, `scene-asset-registry.test.ts`. **Modify only as required:** `src/mobile-visual-assets.ts`; reuse current `MobileSceneBackground`/`MobileCharacterArt` fallback behavior.

- [ ] RED: test that a Forest autumn/night/rain lookup always returns at least a base/generic layer and unavailable optional variants never throw.
- [ ] Run `npx vitest run src/scene/scene-asset-registry.test.ts`; confirm RED.
- [ ] Implement layered lookup: base location + season + lighting + weather + World Fact prop tokens. Optional layers may initially be CSS-only tokens.
- [ ] RED: missing Runa action visual falls back `requested sprite -> suitable current pose -> idle`; companion missing pose falls back to current companion visual/fallback.
- [ ] Implement actor fallback chain without changing domain state.
- [ ] GREEN: `npx vitest run src/scene/scene-asset-registry.test.ts src/v13-story-dialogue-stage.test.tsx`.
- [ ] Commit: `feat(v14): add layered scene asset fallback`.

## Task 3 — Nine-location registry and pure resolver

**Create:** `src/scene/scene-registry.ts`, `scene-registry.test.ts`, `scene-resolver.ts`, `scene-resolver.test.ts`.

- [ ] RED: registry test asserts exactly the nine approved IDs.
- [ ] Run registry test and confirm RED.
- [ ] Implement minimal definitions with percentage anchors. Home includes `runa`, `bed`, `desk`, `wardrobe`, `bag`, `door`, `world_map`; Training/Magic/Herb and three Outing locations include the approved core objects.
- [ ] RED: resolver tests assert `quiet_rain` Story forces rain ahead of weekly weather; malformed requested location safely resolves Home; equal meaningful inputs deep-equal.
- [ ] Run resolver test and confirm RED.
- [ ] Implement one deterministic pipeline: sanitize location -> derive season/weather -> location transform -> World Fact/campaign overlays -> Story override -> actor presentation -> interactions -> visual layers.
- [ ] GREEN: run both Task 3 tests.
- [ ] Commit: `feat(v14): resolve living world scenes`.

## Task 4 — Scene runtime and Scene Director shell

**Create:** `src/scene/scene-runtime.ts`, `scene-runtime.test.ts`, `SceneDirector.tsx`.

- [ ] RED: start `bed`, then attempt `desk`; second start must be ignored after phase becomes `approaching`.
- [ ] RED: lifecycle must reach `committing` before `presenting`.
- [ ] RED: behavior priority test returns Story ahead of player/activity/state/autonomous and autonomous ahead of idle when no higher source exists.
- [ ] Run `npx vitest run src/scene/scene-runtime.test.ts`; confirm RED.
- [ ] Implement the pure runtime reducer and priority selector.
- [ ] Add thin `SceneDirector`: it owns ephemeral runtime state and invokes an adapter commit callback only in `committing`; it cannot directly change stats/rewards.
- [ ] GREEN: rerun runtime test.
- [ ] Commit: `feat(v14): add scene director runtime`.

## Task 5 — Scene Stage, actors, objects, shared CSS

**Create:** `SceneStage.tsx`, `CharacterActor.tsx`, `InteractiveObject.tsx`, `scene.css`, `scene-stage.test.tsx`. **Modify:** `src/runa-presentation.ts` only for presentation extension/fallback.

- [ ] RED static-render test: Stage contains `v14-scene-stage`, actor anchor metadata, and accessible interaction buttons.
- [ ] RED CSS test: >=44px hit area, `env(safe-area-inset-bottom)`, `:focus-visible`, reduced-motion rule.
- [ ] Run `npx vitest run src/scene/scene-stage.test.tsx`; confirm RED.
- [ ] Implement percentage-anchor positioning via CSS variables; no durable pixels.
- [ ] Extend Runa presentation vocabulary to `happy`, `worried`, `sit` with fallback to existing art until dedicated assets exist.
- [ ] Implement hint policy: normal objects do not continuously pulse; only mandatory/new/idle-accessibility hints receive subtle highlight metadata.
- [ ] GREEN: `npx vitest run src/scene/scene-stage.test.tsx src/v13-story-dialogue-stage.test.tsx`.
- [ ] Commit: `feat(v14): render anchored living scenes`.

## Task 6 — Semantic checkpoints and hydration

**Create:** `src/scene/activity-checkpoint.ts`, `activity-checkpoint.test.ts`. **Modify:** `src/v3-persistent-state.ts`, and `src/game.ts` only as required to expose/thread the sanitized field.

Exact checkpoint phases:
- Story: `intro | dialogue | choice | post_choice`
- Training: `intro | activity | post_commit`
- Expedition: `node | encounter | post_encounter | reward | post_reward`

- [ ] RED: canonical Story checkpoint with `choice` is accepted; arbitrary `frame-27` is rejected.
- [ ] RED: malformed/empty Expedition semantic node is rejected.
- [ ] Run `npx vitest run src/scene/activity-checkpoint.test.ts`; confirm RED.
- [ ] Implement discriminated union + sanitizer + safe resume. Post-commit phase is trusted only when canonical state proves its commit; otherwise return the safe pre-commit semantic boundary.
- [ ] Add optional sanitized checkpoint to exact persistent owner `V3PersistentState`; never persist animation/camera/actor coordinates.
- [ ] RED/GREEN game hydration regression: malformed checkpoint becomes null/default while existing state still hydrates.
- [ ] Run checkpoint plus the concrete V3 persistence/save/hydration tests present in the repo; no silent zero-match glob acceptance.
- [ ] Commit: `feat(v14): persist semantic scene checkpoints`.

## Task 7 — Living Home and visual World Map

**Create:** `WorldMapScene.tsx`, `world-map.test.tsx`, `src/v14-living-home.test.tsx`. **Modify:** `src/LayeredHome.tsx`, `src/Root.tsx` only if route state requires it, `src/layered-home.css`; use `src/scene/scene.css` for shared scene layout.

- [ ] RED: static Home test proves living Stage renders `bed` and `door` while existing quick access such as schedule/bag remains present.
- [ ] RED: world-map test proves locked destinations are visibly represented but cannot activate.
- [ ] Run the two tests; confirm RED.
- [ ] Integrate Home as a Scene consumer. Keep scene logic in `src/scene/*`, not inside `LayeredHome.tsx`.
- [ ] Map Home objects to existing callbacks: desk/schedule, wardrobe, bag/equipment, door/world map, Runa/Bond, bed/rest where canonical support exists.
- [ ] Add tired-condition actor presentation and lower-priority autonomous idle choreography only.
- [ ] Implement World Map destination selection using canonical `LocationId` and resolved unlock state.
- [ ] GREEN: run V14 Home/world-map plus `src/v13-home-character-safe-zone.test.ts` and `src/v13-tactical-no-overlap.test.ts`.
- [ ] Commit: `feat(v14): turn home into a living scene`.

## Task 8 — Raising Adapter and three Training scenes

**Create:** `src/scene/adapters/raising-adapter.ts`, test, `src/scene/training-scenes.ts`, `src/v14-training-scenes.test.tsx`. **Modify:** exact current Training UI boundary `src/App.tsx`, plus `scene-registry.ts` as needed. Reuse canonical Training logic from `src/game-core.ts`.

Canonical completion action is `FINISH_TRAINING`. Existing `TRAIN`/training flow remains authoritative.

- [ ] RED: adapter test spies dispatch and proves the scene uses the same current canonical Training start/completion actions as `src/App.tsx`/`game-core.ts`; no returned presentation object contains `stats`, `gold`, `mastery`, or durable reward mutation.
- [ ] Run adapter test; confirm RED.
- [ ] Implement a thin mapping from scene training objects to existing Activity/Training IDs; no duplicate stat formulas.
- [ ] Add Training Ground objects: `training_dummy`, `weapon_rack`, `instructor`, `exit`.
- [ ] Add Magic Classroom objects: `magic_circle`, `books`, `practice_target`, `instructor`, `exit`.
- [ ] Add Herb Garden objects: `herb_patch`, `pots`, `workbench`, `ingredient_rack`, `exit`.
- [ ] RED: first bounded Magic timing minigame yields presentation labels such as `clean|close|miss`, but every label follows the identical canonical Training completion path. It must not set, derive, or modify `eventRoll`.
- [ ] Implement presentation-only minigame feedback.
- [ ] RED/GREEN: post-training Scene displays grade/improvement from committed `lastGrowthReport`, never from minigame label.
- [ ] Run V14 Training tests plus concrete existing training/raising tests.
- [ ] Commit: `feat(v14): stage training as playable scenes`.

## Task 9 — Outing Adapter and Forest/Village/Lakeside

**Create:** `outing-adapter.ts`, test, `outing-scenes.ts`, `src/v14-outing-scenes.test.tsx`. **Modify:** `scene-registry.ts`, `LayeredHome.tsx` only for route entry. Reuse `src/adventure.ts` exactly for canonical effects/outcomes.

- [ ] RED: fixed roll/state returns identical `pickExplorationOutcome` through adapter and direct domain call for `forest`, `village`, `lakeside`.
- [ ] Run adapter test; confirm RED.
- [ ] Implement adapter without copying reward/stat constants from `adventure.ts`.
- [ ] Scene objects: Forest trace/tree/herb/path; Village square/shop/performance/repair/alley; Lakeside water/fish/rest/wind-crystal.
- [ ] RED/GREEN: same week/location has stable weather; month crossing fixed season boundary changes season layer; companion identity/Bond may add hint/reaction but never remove base progression path.
- [ ] Static-render test proves Forest has visible tappable trace/staging rather than only result buttons.
- [ ] Run V14 Outing tests plus concrete adventure/outing regressions.
- [ ] Commit: `feat(v14): make outings scene driven`.

## Task 10 — Story Adapter and choreography migration

**Create:** `story-adapter.ts`, test, `story-scenes.ts`, `src/v14-story-scenes.test.tsx`. **Modify:** `src/components/StoryEvent.tsx`; adjust `src/story-dialogue-stage.css` only if still needed after scene CSS. Reuse `src/game/events.ts` for canonical choices/effects.

- [ ] RED exact canonical example: `commitStoryChoice('lost_bird','help',dispatch)` dispatches exactly once `{type:'EVENT_CHOICE',eventId:'lost_bird',choiceId:'help'}`.
- [ ] RED: unknown event or choice dispatches zero times.
- [ ] Run Story adapter test; confirm RED.
- [ ] Implement validation directly against `STORY_EVENTS`.
- [ ] Move current guest presentation mapping into `story-scenes.ts` and supply scene metadata/beats for every current Story event: location/time, Runa + guest staging, dialogue, canonical choice handoff.
- [ ] Replace fixed speaker-toggle implementation in `StoryEvent.tsx` with thin Scene consumer.
- [ ] RED/GREEN reload invariants: uncommitted `choice` may reappear; canonical committed event state/history cannot expose claimable choice again; post-choice presentation cannot redispatch `EVENT_CHOICE`.
- [ ] Run V14 Story tests, `src/v13-story-dialogue-stage.test.tsx`, and concrete Story/event regressions.
- [ ] Commit: `feat(v14): choreograph story events as scenes`.

## Task 11 — Expedition semantic nodes and Tactical handoff/return

**Create:** `expedition-adapter.ts`, test, `tactical-adapter.ts`, test, `expedition-scenes.ts`, `src/v14-expedition-tactical.test.ts`. **Modify exact bridge files:** `src/GuardianExpeditionOverlay.tsx`, `src/TacticalExpeditionFlow.tsx`, `src/Root.tsx`. Do not replace calculations in `src/tactical-battle.ts`.

Semantic node families: `camp`, `path`, `crossroads`, `ruin`, `rift`, `treasure`, `encounter`, `return`.

- [ ] RED: committed encounter checkpoint resumes after the encounter, not before it.
- [ ] RED: malformed semantic node falls to a safe canonical Expedition node.
- [ ] Run both adapter tests; confirm RED.
- [ ] Implement semantic routing/checkpoints only; no actor coordinates.
- [ ] Implement Tactical adapter as navigation/handoff. Existing Tactical completion remains `COMPLETE_TACTICAL_BATTLE` with encounter/result/rounds/survivors/damage/companions.
- [ ] RED/GREEN duplicate-completion test: rapid/repeated return cannot grant a second first-clear/reward/Bond result; canonical state/domain idempotence is final guard.
- [ ] Integration test: Expedition encounter request -> existing Tactical handoff -> one canonical completion -> post-battle checkpoint -> re-resolved Expedition Scene.
- [ ] Run V14 bridge test plus concrete Tactical/Expedition tests.
- [ ] Commit: `feat(v14): bridge expedition scenes to tactical`.

## Task 12 — Real World Fact consequences, NG+ echoes, Personality/Bond choreography

**Create:** `scene-consequences.ts`, test. **Modify:** `scene-resolver.ts`, `scene-registry.ts`, `CharacterActor.tsx`.

Use only canonical World Fact IDs from `src/world-history.ts`:
`festival_restored`, `festival_lost`, `shrine_unsealed`, `shrine_silent`, `village_alliance`, `guardian_accord`, `rift_scarred`, `rift_cleansed`.

- [ ] RED: `festival_restored` adds restored Village decoration/NPC/optional interaction; `festival_lost` gives damaged/quiet Village presentation.
- [ ] RED: `shrine_unsealed` and `shrine_silent` visibly differ at Old Shrine.
- [ ] RED: `rift_scarred` and `rift_cleansed` visibly differ in Expedition/Rift presentation.
- [ ] Run consequence test; confirm RED.
- [ ] Implement consequences as overlays/props/optional interactions only; do not mutate World Facts.
- [ ] RED/GREEN: inherited NG+ echo is tagged/presented as echo and cannot satisfy a current-run canonical World Fact gate unless existing domain logic already says it can.
- [ ] Add choreography-only reactions: high courage forward/direct, high calmness observe/pause, high curiosity excited/quick inspect, higher Bond closer/proactive companion. No stat/Bond writes.
- [ ] Run consequence plus concrete world-history/NG+/Bond tests.
- [ ] Commit: `feat(v14): reflect world choices in living scenes`.

## Task 13 — Mobile/accessibility/fallback/performance regression gate

**Create:** `src/v14-scene-mobile-accessibility.test.ts`, `src/v14-scene-fallback-regression.test.ts`. **Modify:** `src/scene/scene.css` and only scene components exposed by concrete failures.

- [ ] RED/source assertions for `@media(max-width:430px)`, short-phone handling around 640px height, safe-area inset, reduced-motion, visible focus, >=44px hit areas.
- [ ] Static render representative Home, Story, Expedition scenes and prove quick menu + critical interaction controls coexist without replacing each other.
- [ ] Run the two tests and confirm any missing requirement as RED.
- [ ] Implement only missing responsive/accessibility rules. Korean dialogue wraps/scrolls rather than covering choice/action regions.
- [ ] RED/GREEN: missing optional visual token does not throw; malformed location renders safe Home/generic usable fallback.
- [ ] RED/GREEN: reduced-motion leaves interaction IDs, commit order, and semantic checkpoint result identical to normal motion.
- [ ] Run V14 scene tests plus V13 Home/Story/Tactical overlap regressions.
- [ ] Run `npx tsc -b` and `npx vite build` at the end of Slice G.
- [ ] Commit: `test(v14): harden scene mobile accessibility`.

## Task 14 — End-to-end invariants and release gate

**Create:** `src/v14-living-world-invariants.test.ts`. Source fixes discovered here require a focused RED/GREEN commit before release; do not bury fixes in the release step.

- [ ] Add invariant test proving serialized Scene definitions do not contain direct durable mutation fields (`stats`, `gold`, `gems`, mastery/Bond/reward mutation payloads).
- [ ] Add deterministic weather/scene equality invariant.
- [ ] Add reduced-motion semantic-parity invariant.
- [ ] Add five required playable-flow tests: Home -> Training -> Home; Home -> Map -> Forest -> return; Story choice -> reload; Expedition -> Tactical -> post-battle; malformed checkpoint -> safe recovery.
- [ ] Targeted V14 gate: run all concrete `src/scene/*.test.ts(x)` and `src/v14-*.test.ts(x)` files. If shell expansion risks zero matches, enumerate the files explicitly.
- [ ] Relevant feature gate: run concrete current Raising/Training, adventure/Outing, Story/event, Expedition, Tactical, Bond, World History/World Fact, NG+, save/hydration, and Home/UI test files. Confirm each category actually executes.
- [ ] Full regression: `npx vitest run`; record exact file/test counts.
- [ ] Typecheck: `npx tsc -b`.
- [ ] Production build: `npx vite build`.
- [ ] Commit invariant test: `test(v14): lock living world invariants`.
- [ ] Push exact `work/v14-living-world` head and open PR to `integration/v3` with approved spec path, this reviewed plan path, exact SHA, Slice A-G summary, exact test counts, typecheck/build results, and explicit statement that existing Tactical/domain reward logic remains authoritative.
- [ ] Verify PR CI/review/preview on that exact head. Any blocker gets the smallest focused failing regression test + fix + full re-verification.
- [ ] Merge exact GREEN head to `integration/v3` without force. Verify remote integration SHA and rerun targeted V14, full test, `tsc -b`, `vite build` on the exact integration composition.
- [ ] Open release PR exact `integration/v3` -> `main`; require release CI GREEN at exact head; merge without force and verify remote `main` SHA.
- [ ] Production exact-main verification: deployment READY for exact main SHA; `https://puppy-maker-six.vercel.app/` HTTP 200; runtime/fatal errors none; smoke-check Home living scene loads and at least one scene interaction or quick-menu path is usable.
- [ ] V14 is complete only when implementation, integration, main, and production evidence all match their exact verified SHAs.

## Slice/review sequence

- Slice A: Tasks 1-6 — foundation + persistence.
- Slice B: Task 7 — Living Home + world map.
- Slice C: Task 8 — Training.
- Slice D: Task 9 — Outing.
- Slice E: Task 10 — Story.
- Slice F: Task 11 — Expedition/Tactical bridge.
- Slice G: Tasks 12-13 — consequences + polish.
- Final Gate: Task 14.

Keep task commits distinct. After each task, run its stated targeted/relevant tests and perform the review required by the selected execution skill before continuing. No task may bypass RED/GREEN because a later full regression exists.