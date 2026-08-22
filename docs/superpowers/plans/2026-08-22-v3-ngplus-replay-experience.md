# V3 NG+ Replay Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete player-facing NG+ `new possibility` replay experience, then compose exact 01 Raising + 02 World + 05 Hub candidates into Macro A and verify the replay E2E.

**Architecture:** 05 owns a dedicated `NgPlusReplayHub` presentation surface and no authoritative NG+ state transitions. The Macro verify branch owns one thin adapter that combines 01 qualitative replay semantics, 02 inherited World Echo presentation, and the 05 view model while keeping current-run Spring state authoritative.

**Tech Stack:** React, TypeScript, Vitest, React DOM server rendering, CSS, Vite.

**Spec:** `docs/superpowers/specs/2026-08-22-v3-ngplus-replay-experience-design.md`

## Global Constraints

- Baseline is exactly `integration/v3@ff6a8fe55b1b2df5d8cf1434bb9b607af4bda264`.
- 01 frozen candidate is exactly `5130d28bab8ace114adc1f67ec39697f37889061`.
- 02 frozen candidate is exactly `88d30ce9b7a6c4c3c81209b95dab818cf93f3898`.
- 05 never owns archive, runNumber, reset/persist split, shared save wiring, or authoritative new-run transition.
- No raw affinity, numeric trust, raw career score, hidden requirement total, optimization threshold, or raw Legacy power value may reach presentation.
- Normal Path Convergence keeps at least two main campaigns; `fifth_path_candidate` is additive only.
- Fifth Path main campaign content and Hollow remain closed.
- 360/390/430, safe areas, 44px targets, Korean wrapping, focus/back/ESC, focus return, reduced motion, and empty-image safety remain mandatory.
- No direct merge to `integration/v3`, `main`, or production.

---

### Task 1: NG+ Replay Hub contract

**Files:**
- Create: `src/NgPlusReplayHub.test.tsx`
- Create: `src/ngplus-replay-mobile.test.ts`
- Create: `src/NgPlusReplayHub.tsx`
- Create: `src/ngplus-replay.css`

**Interfaces:**
- Produces `NgPlusReplayViewModel` with `entry`, `home`, `journey`, `normalCandidates`, `specialCandidate`, and `vn` presentation fields.
- Produces default export `NgPlusReplayHub` with `{open, model, onOpen, onClose}`.

- [ ] **Step 1: Write the failing component contract**

```tsx
const model: NgPlusReplayViewModel = {
  entry:{title:'새로운 가능성',previousRun:'지난 삶은 하나의 기억으로 남았어요.',currentRun:'이번 봄은 새로운 선택으로 시작해요.',cta:'새로운 봄 시작'},
  home:{season:'봄 · 새로운 가능성',runLabel:'현재 회차',echoSummary:'익숙한 기억이 희미하게 따라와요.',primaryCta:'Journey 돌아보기'},
  journey:{pastLife:['지난 Caretaker의 삶이 희미하게 떠올라요.'],reunions:['미라와 다시 마주쳤어요.'],worldEchoes:['예전 세계의 흔적이 현재와 분리되어 보여요.'],currentRun:['이번 봄의 행동은 새로 기록돼요.']},
  normalCandidates:[
    {id:'caretaker',title:'Caretaker',tendency:'떠오르는 가능성',reasons:['이번 회차의 행동이 이 길을 열었어요.']},
    {id:'pathfinder',title:'Pathfinder',tendency:'희미하게 보이는 길',reasons:['현재 봄의 선택이 이 방향을 가리켜요.']},
  ],
  specialCandidate:{id:'fifth_path_candidate',title:'아직 이름 붙지 않은 가능성',reasons:['몇 번의 삶이 겹쳐 보여요.']},
  vn:{name:'미라',dialogue:'처음 만나는 것 같은데, 이상하게 익숙해.',choices:['다시 시작하자'],log:[],seen:false},
};
```

Assert closed Home shows exactly one CTA and current-vs-inherited wording. Assert open Journey renders past-life/reunion/world echo/current-run sections, >=2 normal candidates, optional special candidate, and never matches `/affinity|trust\s*[:=]|rawScore|legacyPower|\d+\s*\/\s*100/i`.

- [ ] **Step 2: Run full CI through Draft PR and verify RED**

Expected: all existing baseline tests GREEN; only new NG+ UI tests fail because `./NgPlusReplayHub` / `./ngplus-replay.css` do not exist.

- [ ] **Step 3: Implement minimal component**

```tsx
export type NgPlusReplayViewModel={
  entry:{title:string;previousRun:string;currentRun:string;cta:string};
  home:{season:string;runLabel:string;echoSummary:string;primaryCta:string};
  journey:{pastLife:string[];reunions:string[];worldEchoes:string[];currentRun:string[]};
  normalCandidates:Array<{id:string;title:string;tendency:string;reasons:string[]}>;
  specialCandidate:{id:'fifth_path_candidate';title:string;reasons:string[]}|null;
  vn:{portrait?:string;name:string;dialogue:string;choices:string[];log:string[];seen:boolean};
};
```

Closed mode renders compressed Replay Home. Open mode renders a `role="dialog" aria-modal="true"` Journey/Path/VN shell, shows inherited/current sections separately, renders normal candidates first, and renders the special candidate only when non-null. Empty portrait omits `<img>` entirely.

- [ ] **Step 4: Add mobile/accessibility CSS contract**

```css
.ngplus-replay-shell{min-height:100vh;min-height:100dvh;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}
.ngplus-replay-shell button{min-height:44px}
.ngplus-replay-shell{overflow-wrap:anywhere;word-break:keep-all}
@media (prefers-reduced-motion: reduce){.ngplus-replay-shell *{animation:none!important;transition:none!important}}
```

Tests must assert explicit `360px`, `390px`, and `430px` media contracts and the accessibility literals above.

- [ ] **Step 5: Run targeted, full, `tsc -b`, production build**

Expected: new Hub tests GREEN, mobile tests GREEN, full suite GREEN, `npm run build` GREEN.

- [ ] **Step 6: Freeze 05 Draft candidate**

Update the 05 Draft PR with exact head SHA, RED/GREEN CI evidence, file list, and hard presentation boundary.

---

### Task 2: Exact room-candidate composition

**Files:**
- No production file changes yet.
- Verify branch: `verify/v3-ngplus-replay-experience`.

**Interfaces:**
- Consumes exact 01 SHA `5130d28...`, exact 02 SHA `88d30ce...`, and exact frozen 05 SHA from Task 1.
- Produces one composition commit whose parents preserve exact room provenance.

- [ ] **Step 1: Confirm all three candidates are 0-behind baseline descendants and independently GREEN**

Expected: no candidate moved after freeze.

- [ ] **Step 2: Compose exact 01 + 02 + 05 trees on verify branch**

The resulting tree must contain only the union of those candidates over the baseline, with no shared `game/save/App/Root` edits introduced by 05.

- [ ] **Step 3: Open Draft Macro A verification PR against `integration/v3`**

Mark it verification-only and `DO NOT MERGE DIRECTLY`.

---

### Task 3: Macro A composition adapter E2E

**Files:**
- Create: `src/ngplus-replay-experience.integration.test.tsx`
- Create: `src/ngplus-replay-ui.ts`

**Interfaces:**
- Consumes `resolveNgPlusRaisingReplay(rawLegacy,evidence): NgPlusRaisingReplay` from 01.
- Consumes `buildNgPlusWorldEchoPresentation(worldHistory,unlocks): NgPlusWorldEchoPresentation` from 02.
- Produces `buildNgPlusReplayViewModel(inputs): NgPlusReplayViewModel`.

- [ ] **Step 1: Write failing Macro E2E**

Build a hydrated Legacy state with `past_life_dialogue`, `relationship_reunion`, `world_echo`, and optionally `fifth_path_candidate`; supply current-run Spring evidence that yields >=2 normal candidates; supply World history with distinct `currentFacts` and `inheritedFacts`. Call 01 and 02 domain selectors, then import missing `buildNgPlusReplayViewModel` and assert the rendered 05 UI distinguishes previous/inherited/current state.

- [ ] **Step 2: Run CI and verify RED**

Expected: exact 01+02+05 composition suite remains GREEN; only Macro E2E fails because `./ngplus-replay-ui` is absent.

- [ ] **Step 3: Implement minimal adapter**

```ts
export type NgPlusReplayUiInputs={
  raising:NgPlusRaisingReplay;
  world:NgPlusWorldEchoPresentation;
  currentRunEvents:readonly string[];
};

export function buildNgPlusReplayViewModel(input:NgPlusReplayUiInputs):NgPlusReplayViewModel
```

Mapping rules:
- `raising.pastLife` -> one qualitative previous-life sentence; never render `runNumber` as optimization/progression data.
- relationship hook `summaryKey` -> stable qualitative Korean copy by character/kind; no trust values.
- `world.inheritedEchoes` -> qualitative inherited-world copy keyed by `presentationKey`; `world.currentFacts` never enter the inherited list.
- `raising.normalCandidates` -> candidate title + existing qualitative tendency + current-run reasons; `legacyReasons` appended only as secondary qualitative rationale.
- `raising.specialCandidate` -> optional additive `fifth_path_candidate`; never replace/remove normal candidates and never produce a commit action.
- if memory/echo inputs are absent, produce ordinary Spring replay presentation rather than blocking entry.

- [ ] **Step 4: Verify invariants in E2E**

Assert:
- >=2 normal candidates remain visible.
- special candidate is additive when eligible and absent otherwise.
- same World Fact may exist current + inherited without collapse.
- inherited echo cannot alter normal campaign access.
- raw `campaignAffinities`, trust, score, threshold, raw Legacy power do not appear in serialized view model or rendered HTML.
- Mira/Kael/Rex/Selene plus Noa/Eiden hooks render qualitatively; Lyra appears only as possibility hint; Veyr does not appear in ordinary NG+ reunion.

- [ ] **Step 5: Run targeted, full, `tsc -b`, production build**

Expected: Macro A E2E GREEN, all room suites GREEN, full suite GREEN, TypeScript GREEN, Vite production build GREEN.

- [ ] **Step 6: Freeze Macro A handoff**

Update #142 and the Draft Macro PR with exact head, composition parent SHAs, CI run, full counts, diff isolation, and 06 handoff. Close #142 only after fresh final verification. Do not advance `integration/v3`.
