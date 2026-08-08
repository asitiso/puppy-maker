# Runa Raising Game 1.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the current Puppy Maker vertical slice into a stable 12-month, Runa-centered raising game with meaningful planning, training, personality, memories, events, endings, replay value, and a polished mobile-first presentation.

**Architecture:** Preserve the existing React/Vite web implementation and `GameState`/reducer flow. Extend progression through focused domain modules instead of replacing `game.ts`; keep decorative presentation in reusable assets/components and dynamic information in code. Every wave must leave the branch playable and independently reversible.

**Tech Stack:** React, TypeScript, Vite, Vitest, existing CSS/image asset system, GitHub Actions, Vercel Preview.

## Global Constraints

- Work only on `feat/vertical-slice` / PR #1 unless explicitly instructed otherwise.
- Never merge PR #1 or `main` without explicit user instruction.
- Preserve the current web implementation; do not restart in Flutter.
- Preserve existing gameplay/data wherever practical and migrate saves instead of discarding them.
- Use TDD for game logic and regressions: failing test -> RED -> minimal implementation -> GREEN -> related suite -> build.
- Never report test/build/push/deploy/Preview success without observing it.
- Mobile portrait is the primary UX target.
- Runa character identity, costume, proportions, ears, tails, face, and palette must remain consistent.
- Decorative fantasy UI belongs in assets where appropriate; dynamic text/numbers/progress remain code-rendered.
- Prefer changes with clear player-visible benefit; reject low-impact systems with disproportionate implementation or maintenance cost.
- Keep commits scoped and reversible.

---

## File Structure

Existing files to preserve and evolve:
- `src/game.ts` — core reducer/state compatibility layer.
- `src/game.test.ts` — core regression and long-run tests.
- `src/App.tsx` / `src/App.test.tsx` — non-home gameplay screens and integration behavior.
- `src/Root.tsx` — screen composition and Layered Home routing.
- `src/LayeredHome.tsx` — Runa-centered home presentation.
- `src/layered-home.css` — home responsive scene/layout.
- `src/home-panels.ts` / `src/home-panels.test.ts` / `src/home-panels.css` — secondary home information.

Focused modules to introduce only as their wave needs them:
- `src/game/save.ts` — save versioning, migration, normalization.
- `src/game/progression.ts` — month/year/season helpers and long-run progression.
- `src/game/personality.ts` — personality deltas and dominant-trait derivation.
- `src/game/memories.ts` — unique memory catalog/unlock helpers.
- `src/game/events.ts` — event definitions, eligibility, deterministic selection/application.
- `src/game/endings.ts` — ending seeds, ending resolution, ending collection types.
- `src/runa-presentation.ts` — presentation-only Runa pose/state selection.
- `src/components/GrowthReport.tsx` — monthly payoff presentation.
- `src/components/StoryEvent.tsx` — event choice presentation.

Do not create these modules pre-emptively. Create each only when its task starts.

---

# Wave 1 — Foundation and Long-Run Safety

### Task 1: Lock the canonical monthly loop

**Files:** Modify `src/game.test.ts`; modify `src/game.ts` only if RED exposes a defect.

**Interfaces:** Preserve `reducer(state, action): GameState`, `hydrateGameState(raw): GameState`.

- [ ] Add a scenario test that starts at hub, enters schedule, completes all four scheduled weeks, chooses dialogue, reaches result, advances month, and returns to hub with `week === 1`.
- [ ] Run `npm run test -- src/game.test.ts` and record RED/GREEN truthfully.
- [ ] Fix only defects exposed by the scenario.
- [ ] Run the complete test suite and `npm run build`.
- [ ] Commit as `test: lock canonical monthly raising loop` or `fix: stabilize canonical monthly raising loop` depending on whether implementation changed.

### Task 2: Add 12-month simulation invariants

**Files:** Modify `src/game.test.ts`; create `src/game/progression.ts` if calendar helpers are needed.

**Interfaces:** Produce pure helpers `advanceCalendar(year:number, month:number): {year:number; month:number}` and `seasonForMonth(month:number): 'spring'|'summer'|'autumn'|'winter'` if extracted.

- [ ] Add a deterministic test that runs 12 complete months through the reducer.
- [ ] Assert month remains 1-12, week remains 1-4, gold/gems are finite and non-negative, all stats/personality remain 0-100, mastery XP is finite/non-negative, and unique memories never duplicate.
- [ ] Assert December advances to January of the next year.
- [ ] Run targeted test to establish RED if any invariant fails.
- [ ] Implement the smallest calendar/state fixes needed.
- [ ] Run full tests and build.
- [ ] Commit `test: add long-run raising simulation`.

### Task 3: Version and normalize saves

**Files:** Create `src/game/save.ts`; modify `src/game.ts`; add `src/game/save.test.ts`.

**Interfaces:** `CURRENT_SAVE_VERSION:number`; `serializeGameState(state:GameState):string`; `hydrateSave(raw:string|null):GameState`.

- [ ] Write tests for null save, malformed JSON, current save round-trip, legacy save missing V2 fields, invalid schedule, invalid week/month, duplicate memories, NaN-like/non-finite numeric data where representable.
- [ ] Run tests and verify expected failures.
- [ ] Move normalization/migration responsibility from the large core file into `save.ts` while retaining `hydrateGameState` as a compatibility wrapper.
- [ ] Ensure unknown future fields do not crash hydration.
- [ ] Run all tests and build.
- [ ] Commit `refactor: version and normalize game saves`.

---

# Wave 2 — Layered Home 2.0 and Runa Presence

### Task 4: Make the next action unmistakable

**Files:** Modify `src/LayeredHome.tsx`, `src/layered-home.css`; add/update relevant component tests.

**Interfaces:** Existing `onSchedule():void` remains the primary navigation callback.

- [ ] Add a test that the home exposes one primary schedule/start action and secondary panels do not compete as primary CTAs.
- [ ] Implement a visually dominant but compact primary action using the existing fantasy asset language.
- [ ] Keep Runa unobstructed in the central scene.
- [ ] Verify keyboard/touch accessible button semantics.
- [ ] Run tests/build.
- [ ] Commit `feat: clarify layered home primary action`.

### Task 5: Add presentation-only Runa state selection

**Files:** Create `src/runa-presentation.ts`, `src/runa-presentation.test.ts`; modify `src/LayeredHome.tsx`.

**Interfaces:** `type RunaPose='idle'|'talk'|'surprised'|'training-ready'|'tired'`; `selectRunaPose(state:GameState, context?:string):RunaPose`; `runaPoseAsset(pose:RunaPose):string` with safe fallback to existing idle/talk assets.

- [ ] Test tired condition -> tired pose, active bonding -> talk pose, default hub -> idle.
- [ ] Test missing optional pose asset mapping falls back safely instead of breaking the character.
- [ ] Implement pure presentation selection without adding pose fields to persisted `GameState`.
- [ ] Connect Layered Home to the selector.
- [ ] Run tests/build.
- [ ] Commit `feat: add Runa presentation state layer`.

### Task 6: Home information hierarchy and panel cleanup

**Files:** Modify `src/LayeredHome.tsx`, `src/home-panels.ts`, tests, CSS.

- [ ] Test that home surfaces date/week, condition/stamina, progression level, and primary action without opening a panel.
- [ ] Move lower-value detail into panels instead of adding more permanent cards.
- [ ] Ensure locked/unimplemented destinations communicate state rather than behaving like broken buttons.
- [ ] Keep existing panel interaction tests passing.
- [ ] Run tests/build.
- [ ] Commit `feat: streamline layered home hierarchy`.

---

# Wave 3 — Schedule and Training 2.0

### Task 7: Make schedule choices legible

**Files:** Modify schedule portion of `src/App.tsx`, tests, CSS; reuse `activities` data.

- [ ] Test that all four weeks are visible and editable and current condition is surfaced.
- [ ] Add concise code-rendered activity consequences: primary growth, fatigue/stress tendency, and a condition hint.
- [ ] Keep exact optimization math hidden; avoid turning the screen into a spreadsheet.
- [ ] Preserve auto-schedule and existing four-slot data shape.
- [ ] Run tests/build.
- [ ] Commit `feat: improve monthly schedule planning`.

### Task 8: Differentiate four training activities without four engines

**Files:** Modify training UI in `src/App.tsx`; optionally create a focused presentation config file; tests/CSS.

**Interfaces:** One training reducer path remains authoritative; presentation config maps each `ActivityId` to copy/icon/tempo cues.

- [ ] Test that the current week's scheduled activity determines training presentation.
- [ ] Give hunt, magic, herb, and rest distinct instructions/feedback while sharing mechanics.
- [ ] Keep `NORMAL/GOOD/GREAT/PERFECT` and combo feedback clearly visible.
- [ ] Surface condition modifier in plain language.
- [ ] Run tests/build.
- [ ] Commit `feat: differentiate training experiences`.

### Task 9: Connect Runa training poses

**Files:** Modify `src/App.tsx`, `src/runa-presentation.ts`, tests.

- [ ] Test training entry uses `training-ready` and post-training feedback can use `tired`/positive fallback based on result/condition.
- [ ] Do not duplicate game state to store visual pose.
- [ ] Use real assets when present and fallback assets otherwise.
- [ ] Run tests/build.
- [ ] Commit `feat: connect Runa reactions to training`.

---

# Wave 4 — Personality, Relationship, and Memories

### Task 10: Extract personality rules

**Files:** Create `src/game/personality.ts`, tests; modify `src/game.ts`.

**Interfaces:** `applyPersonalityDelta(personality, delta):Personality`; `dominantPersonality(personality):PersonalityKey`; `activityPersonalityDelta(id):Partial<Personality>`.

- [ ] Add boundary/tie/delta tests.
- [ ] Extract current rules without changing established outcomes first.
- [ ] Add only high-value differentiation between training/dialogue choices.
- [ ] Run regression suite/build.
- [ ] Commit `refactor: formalize personality progression`.

### Task 11: Formalize memory catalog

**Files:** Create `src/game/memories.ts`, tests; modify `src/game.ts`, home panel data.

**Interfaces:** `MEMORY_CATALOG`; `unlockMemory(state,id):GameState`; `hasMemory(state,id):boolean`.

- [ ] Test uniqueness and known memory metadata.
- [ ] Migrate existing first-training/perfect/hug/snack/S/month memories to catalog helpers without changing save IDs.
- [ ] Show human-readable unlocked memories in the home memory/record panel.
- [ ] Run tests/build.
- [ ] Commit `feat: formalize Runa memory collection`.

### Task 12: Improve dialogue consequence readability

**Files:** Modify dialogue/result UI in `src/App.tsx`; tests/CSS.

- [ ] Test unaffordable snack is visibly disabled with cost context.
- [ ] Present choices as emotional intentions, not raw stat formulas.
- [ ] After choice, ensure resulting monthly report can communicate personality/relationship changes.
- [ ] Run tests/build.
- [ ] Commit `feat: strengthen dialogue choices and feedback`.

---

# Wave 5 — Story Event Engine

### Task 13: Add deterministic event domain model

**Files:** Create `src/game/events.ts`, `src/game/events.test.ts`; minimally extend `GameState`/actions.

**Interfaces:** `StoryEventDefinition {id,title,body,choices,eligibility}`; `eligibleEvents(state):StoryEventDefinition[]`; `selectMonthlyEvent(state):StoryEventDefinition|null`; `applyEventChoice(state,eventId,choiceId):GameState`.

- [ ] Define 4-6 small events using existing stats/personality/memory conditions.
- [ ] Test eligibility, no-event case, deterministic selection, and bounded effects.
- [ ] Persist only stable IDs/state required to resume an active event.
- [ ] Run tests/build.
- [ ] Commit `feat: add conditional story event engine`.

### Task 14: Insert events into the monthly loop

**Files:** Modify `src/game.ts`, flow tests.

- [ ] Write a flow test for `training week 4 -> dialogue/event -> result` with and without an eligible event.
- [ ] Choose one unambiguous insertion point and preserve result/next-month behavior.
- [ ] Ensure refresh/hydration during an active event resumes safely.
- [ ] Run full suite/build.
- [ ] Commit `feat: connect story events to monthly progression`.

### Task 15: Build StoryEvent presentation

**Files:** Create `src/components/StoryEvent.tsx`, CSS/tests; connect from `App.tsx`.

- [ ] Test title/body/choices render and one choice dispatches once.
- [ ] Use dialogue-box visual language and Runa reaction where appropriate.
- [ ] Keep Korean copy readable on narrow portrait screens.
- [ ] Run tests/build.
- [ ] Commit `feat: present monthly story events`.

---

# Wave 6 — Growth Payoff and 12-Month Progression

### Task 16: Make monthly results the reward moment

**Files:** Create `src/components/GrowthReport.tsx`, tests/CSS; modify `src/App.tsx`.

- [ ] Test report renders quality/grade, most-improved stat, mastery gains, personality changes, new memory, reward, and next condition when present.
- [ ] Stage information visually from evaluation -> growth -> memory -> reward -> next month.
- [ ] Do not duplicate GrowthReport data into a second model.
- [ ] Run tests/build.
- [ ] Commit `feat: upgrade monthly growth report`.

### Task 17: Add season-aware progression

**Files:** Use/create `src/game/progression.ts`, tests; modify home presentation.

- [ ] Test months map to four seasons and year rollover remains correct.
- [ ] Expose season as presentation data without requiring 12 unique backgrounds.
- [ ] Apply lightweight seasonal lighting/decor hooks; use four-season assets only if suitable assets exist.
- [ ] Run tests/build.
- [ ] Commit `feat: add seasonal world progression`.

### Task 18: Add progression milestones without currency bloat

**Files:** `src/game/progression.ts`, tests, home/result UI.

- [ ] Define a small set of month milestones (e.g. 3, 6, 9, 12) that unlock narrative/progression feedback rather than new currencies.
- [ ] Test each milestone fires once.
- [ ] Surface milestone feedback in result/home panel.
- [ ] Run tests/build.
- [ ] Commit `feat: add long-term raising milestones`.

---

# Wave 7 — Ending Seeds, Endings, and Replay

### Task 19: Compute ending tendencies

**Files:** Create `src/game/endings.ts`, tests.

**Interfaces:** `EndingId` for six endings; `endingScores(state):Record<EndingId,number>`; `leadingEndingSeed(state):EndingId`.

- [ ] Define six endings based on combinations of personality, mastery, stats, memories, and meaningful choices.
- [ ] Test representative builds resolve toward expected tendencies.
- [ ] Keep exact score formula out of normal UI.
- [ ] Run tests/build.
- [ ] Commit `feat: add ending tendency model`.

### Task 20: Resolve the 12-month ending

**Files:** Modify `src/game.ts`, `src/game/endings.ts`, flow tests.

- [ ] Add test that completing the twelfth month resolves exactly one ending instead of silently starting month 13.
- [ ] Preserve the completed run state for presentation/replay.
- [ ] Add explicit new-run action separate from ordinary reset if needed.
- [ ] Run full tests/build.
- [ ] Commit `feat: resolve Runa ending after twelve months`.

### Task 21: Persist ending collection across runs

**Files:** Save/endings modules and tests; home panel UI.

- [ ] Test completed ending IDs survive starting a new run.
- [ ] Keep collection metadata separate from mutable current-run progression while using the same local save envelope.
- [ ] Present discovered vs undiscovered endings without exposing hidden formulas.
- [ ] Run tests/build.
- [ ] Commit `feat: add persistent ending collection`.

---

# Wave 8 — Mobile Polish, Accessibility, Performance, and Release Verification

### Task 22: Establish shared mobile layout constraints

**Files:** CSS files and component tests where useful.

- [ ] Define common safe-area spacing, minimum touch target, bottom-nav clearance, and portrait content width rules.
- [ ] Remove one-off overlap patches that become redundant.
- [ ] Verify no primary CTA sits behind bottom navigation.
- [ ] Run tests/build.
- [ ] Commit `fix: harden mobile layout constraints`.

### Task 23: Verify representative portrait sizes

**Files:** Fix only files implicated by observed issues.

- [ ] Browser-check at least a compact portrait, common Android portrait, and tall portrait viewport.
- [ ] Traverse Home -> Schedule -> Training x4 -> Dialogue/Event -> Result -> Next Month.
- [ ] Check Runa cropping, background crop, Korean wrapping, modal height, safe areas, touch targets, and scrollability.
- [ ] Add regression tests for any code-level defect discovered before fixing it.
- [ ] Commit fixes in scoped commits.

### Task 24: Long-run manual smoke and save recovery

- [ ] Load a legacy save fixture and confirm it reaches Layered Home.
- [ ] Complete at least one full month manually.
- [ ] Exercise December -> January and the twelfth-month ending path using deterministic/test setup where practical.
- [ ] Refresh at hub, schedule, event/dialogue, and result states to verify recovery.
- [ ] Fix observed regressions with tests first.

### Task 25: Final branch verification

- [ ] Run the full test suite.
- [ ] Run TypeScript/build via `npm run build`.
- [ ] Confirm GitHub Actions for final HEAD is successful.
- [ ] Confirm PR #1 remains open and unmerged.
- [ ] Confirm the branch HEAD pushed to GitHub matches the tested commit.
- [ ] Inspect Vercel deployment for that exact HEAD; if rate-limited or failed, report it as such and do not claim Preview success.
- [ ] If READY, manually smoke the Preview on mobile-sized viewport before calling the wave complete.

---

## Definition of Done

Runa Raising Game 1.0 is complete when a player can start from the Layered Home, plan and play four weeks, experience Runa reactions and meaningful dialogue/events, receive a readable monthly growth payoff, continue safely across a 12-month run with save/recovery support, reach one of six endings, retain an ending collection for replay, and complete the entire flow on representative mobile portrait sizes without critical overlap/cropping/navigation defects. The final exact HEAD must have observed passing tests/build; Preview success is claimed only when the exact deployment is observed READY and manually smoke-tested.
