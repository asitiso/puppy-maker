# V14 Pass 4 Short-Height Play Flow Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans and superpowers:test-driven-development task-by-task.

**Goal:** Keep the next meaningful action visible on 360×640-class Story and Guardian Expedition screens without changing story choices, expedition combat rules, rewards, or navigation ownership.

**Architecture:** Preserve each existing screen and data flow. Story becomes a two-row dialogue panel: one bounded scrolling body plus a non-scrolling choice rail. Guardian Expedition keeps its current flex battle layout but removes the large minimum stage height only on short screens so the action row and finish CTA fit inside the routed viewport. Training and Tactical are explicitly out of this slice because their current CSS already has compact-height/safe-area/CTA contracts.

**Tech Stack:** React 19, TypeScript, CSS, Vitest source-contract regression, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-08-29-v14-polish-pass-4-design.md`

## Constraints

- No story text/choice/reward changes.
- No expedition combat, action-limit, score, fatigue/stress, material, or record changes.
- Preserve 44px minimum action targets, safe areas, keyboard focus-visible, and reduced motion.
- Do not modify Training or Tactical unless later evidence contradicts the current audit.

### Task 1: RED — lock short-height action visibility

**Files:**
- Modify: `src/v14-polish-pass-4-regression.test.ts`

- [ ] Require `StoryEvent.tsx` to split `.story-dialogue-body` from `.story-event-choices`.
- [ ] Require `story-dialogue-stage.css` to keep the panel itself overflow-hidden, make the body the only dialogue scroller, and preserve the choice rail as the non-scrolling final row.
- [ ] Require `expedition-ui.css` to define `@media(max-height:650px)` with `.expedition-battle{overflow:hidden}` and `.expedition-battle-stage{min-height:0}`.
- [ ] Run PR CI and observe failure on the exact RED head.

### Task 2: GREEN — Story single-scroller + safe choice rail

**Files:**
- Modify: `src/components/StoryEvent.tsx`
- Modify: `src/story-dialogue-stage.css`

- [ ] Wrap header/title/body/current-speaker/advance content in `.story-dialogue-body`.
- [ ] Keep `.story-event-choices` as a sibling final row so story decisions remain visible while prose scrolls.
- [ ] Set `.story-dialogue-panel` to `overflow:hidden` and `grid-template-rows:minmax(0,1fr) auto`.
- [ ] Set `.story-dialogue-body` to `min-height:0; overflow-y:auto; overscroll-behavior:contain; -webkit-overflow-scrolling:touch`.
- [ ] Preserve 44px controls and explicitly allow Korean choice labels to wrap safely.
- [ ] Preserve reduced-motion behavior.

### Task 3: GREEN — Guardian Expedition compact-height battle fit

**Files:**
- Modify: `src/expedition-ui.css`

- [ ] Under `@media(max-height:650px)`, keep `.expedition-battle` inside the viewport with `overflow:hidden`.
- [ ] Remove only the battle-stage minimum height there (`min-height:0`) so flex can shrink the visual stage before hiding controls.
- [ ] Tighten non-essential vertical spacing while keeping all battle and finish buttons at least 44px.
- [ ] Let result content start at the top on short screens so long Korean/world-result content scrolls naturally rather than being vertically centered offscreen.

### Task 4: Verify

- [ ] Run full `npm run test` and `npm run build` on the exact final branch head.
- [ ] Inspect diff to confirm no game-rule or reward logic changed.
- [ ] Continue only to additional Pass 4 surfaces with fresh evidence; otherwise prepare PR #226 for integration gate.
