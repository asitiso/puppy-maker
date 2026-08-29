# V14 Pass 4 Overlay Focus Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the four global mobile overlays keyboard-safe and focus-correct without changing their game logic, layout ownership, or visual system.

**Architecture:** Add one tiny React hook that owns modal focus lifecycle only: initial focus, Escape close, Tab containment, and focus restoration. Each overlay keeps its existing markup/game actions and supplies its open state, close callback, dialog ref, launcher ref, and preferred initial-focus ref. Sanctuary gains the missing lifecycle; Raising/Season/World replace duplicated Escape/restore code with the shared hook.

**Tech Stack:** React 19, TypeScript, CSS, Node `node:test` source-contract regressions, GitHub Actions `npm run test` + `npm run build`.

**Spec:** `docs/superpowers/specs/2026-08-29-v14-polish-pass-4-design.md`

## Global Constraints

- Preserve existing game rules, rewards, save behavior, routes, and overlay content.
- Do not create a modal framework or new dependency.
- Preserve the existing single body scroller, safe-area padding, 44px touch targets, and reduced-motion behavior.
- Target mobile robustness at 360×640, 390×844, and widths up to 430px.
- Keep Korean labels readable and avoid color-only state communication.
- TDD order is RED contract → minimal implementation → targeted/full CI → merge/release gates.

---

### Task 1: Lock the overlay focus contract in RED

**Files:**
- Create: `src/v14-polish-pass-4-regression.test.ts`

**Interfaces:**
- Consumes: existing overlay files `SanctuaryOverlay.tsx`, `RaisingIdentityOverlay.tsx`, `SeasonLiveOpsOverlay.tsx`, `WorldProgressOverlay.tsx`.
- Produces: source contracts requiring shared hook adoption plus initial-focus, Escape, Tab, and restore semantics.

- [ ] **Step 1: Write the failing test**

```ts
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import assert from 'node:assert/strict'

const root = process.cwd()
const source = (file: string) => fs.readFileSync(path.join(root, file), 'utf8')

test('global overlays share complete modal focus lifecycle', () => {
  const hook = source('src/useOverlayFocusManagement.ts')
  assert.match(hook, /event\.key === 'Escape'/)
  assert.match(hook, /event\.key !== 'Tab'/)
  assert.match(hook, /initialFocusRef\.current\?\.focus\(\)/)
  assert.match(hook, /restoreTarget\?\.focus\(\)/)

  for (const file of [
    'src/SanctuaryOverlay.tsx',
    'src/RaisingIdentityOverlay.tsx',
    'src/SeasonLiveOpsOverlay.tsx',
    'src/WorldProgressOverlay.tsx',
  ]) {
    const overlay = source(file)
    assert.match(overlay, /useOverlayFocusManagement/)
    assert.match(overlay, /dialogRef/)
    assert.match(overlay, /initialFocusRef/)
  }
})
```

- [ ] **Step 2: Run test to verify it fails**

Run through the repository CI after opening the draft PR: `npm run test`
Expected: FAIL because `src/useOverlayFocusManagement.ts` does not exist.

- [ ] **Step 3: Commit the RED contract**

```bash
git add src/v14-polish-pass-4-regression.test.ts
git commit -m "test(v14): lock overlay focus lifecycle"
```

---

### Task 2: Add the minimal shared focus-management hook

**Files:**
- Create: `src/useOverlayFocusManagement.ts`

**Interfaces:**
- Consumes: `open: boolean`, `onClose: () => void`, `dialogRef: RefObject<HTMLElement | null>`, `launcherRef: RefObject<HTMLElement | null>`, `initialFocusRef: RefObject<HTMLElement | null>`.
- Produces: `useOverlayFocusManagement(options): void`.

- [ ] **Step 1: Implement focus lifecycle only**

```ts
import { useEffect, type RefObject } from 'react'

const focusableSelector = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

interface OverlayFocusOptions {
  open: boolean
  onClose: () => void
  dialogRef: RefObject<HTMLElement | null>
  launcherRef: RefObject<HTMLElement | null>
  initialFocusRef: RefObject<HTMLElement | null>
}

export function useOverlayFocusManagement({
  open,
  onClose,
  dialogRef,
  launcherRef,
  initialFocusRef,
}: OverlayFocusOptions) {
  useEffect(() => {
    if (!open) return

    const restoreTarget = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : launcherRef.current

    initialFocusRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab') return

      const focusable = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? [],
      ).filter((element) => !element.hasAttribute('disabled') && element.tabIndex !== -1)
      if (focusable.length === 0) {
        event.preventDefault()
        initialFocusRef.current?.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement
      if (event.shiftKey && active === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      requestAnimationFrame(() => {
        const target = restoreTarget?.isConnected ? restoreTarget : launcherRef.current
        target?.focus()
      })
    }
  }, [dialogRef, initialFocusRef, launcherRef, onClose, open])
}
```

- [ ] **Step 2: Keep the helper deliberately narrow**

Do not add scroll locking, portals, aria generation, animation, or overlay layout. Those responsibilities remain in the existing components/CSS.

- [ ] **Step 3: Commit**

```bash
git add src/useOverlayFocusManagement.ts
git commit -m "feat(v14): share overlay focus lifecycle"
```

---

### Task 3: Adopt the hook in Sanctuary, Raising, Season, and World overlays

**Files:**
- Modify: `src/SanctuaryOverlay.tsx`
- Modify: `src/RaisingIdentityOverlay.tsx`
- Modify: `src/SeasonLiveOpsOverlay.tsx`
- Modify: `src/WorldProgressOverlay.tsx`
- Test: `src/v14-polish-pass-4-regression.test.ts`

**Interfaces:**
- Consumes: `useOverlayFocusManagement` from Task 2.
- Produces: each overlay has a `dialogRef`, `launcherRef`, and `initialFocusRef`; the close button is the preferred initial focus target.

- [ ] **Step 1: Wire Sanctuary**

Add refs for launcher, dialog root, and close button. Replace direct close state mutation with a stable `closeOverlay` callback, call the shared hook, attach `ref={dialogRef}` to the dialog and `ref={initialFocusRef}` to its close button.

- [ ] **Step 2: Wire Raising Identity**

Remove its duplicated document Escape listener and manual previous-focus restoration. Keep launcher behavior and route/game callbacks unchanged; wire the same three refs into the shared hook.

- [ ] **Step 3: Wire Season Live Ops**

Remove duplicated Escape/restore effect only. Preserve all season claims/actions and overlay content; wire the shared hook and close-button initial focus.

- [ ] **Step 4: Wire World Progress**

Remove duplicated Escape/restore effect only. Preserve expedition/world state and navigation; wire the shared hook and close-button initial focus.

- [ ] **Step 5: Run targeted/full test and build**

Run: `npm run test`
Expected: PASS, including `v14-polish-pass-4-regression.test.ts`.

Run: `npm run build`
Expected: PASS with TypeScript/Vite build clean.

- [ ] **Step 6: Commit**

```bash
git add src/SanctuaryOverlay.tsx src/RaisingIdentityOverlay.tsx src/SeasonLiveOpsOverlay.tsx src/WorldProgressOverlay.tsx

git commit -m "fix(v14): complete overlay keyboard focus flow"
```

---

### Task 4: Verify and gate the slice before broader Pass 4 work

**Files:**
- No new production files unless CI reveals a concrete defect.

**Interfaces:**
- Consumes: Tasks 1–3.
- Produces: one independently reviewable GREEN overlay-focus slice ready for the next Pass 4 mobile-flow audit.

- [ ] **Step 1: Inspect PR CI evidence**

Require GitHub Actions `npm run test` and `npm run build` success on the exact PR head.

- [ ] **Step 2: Inspect changed-file scope**

Confirm no game rules, reward code, save schema, route ownership, or unrelated CSS changed.

- [ ] **Step 3: Continue Pass 4 only from concrete evidence**

Next inspect Guardian Expedition, Story, Tactical, and Training for compact-height/safe-area/Korean-wrap issues. Create a separate implementation plan for that subsystem rather than expanding this focus-management slice opportunistically.
