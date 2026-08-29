# V14 Detail Completion R1 — Implementation Plan

## Goal
Deepen the existing V14 experience without creating V15 scaffolding. Improve only proven rough edges in current V14 interaction architecture and presentation.

## Guardrails
- No new game systems, currencies, combat rules, save schema, or future-version framework.
- Reuse `useOverlayFocusManagement`, existing Build Editor state, equipment metadata, and current mobile CSS tokens.
- Preserve autosave/loadout mutation behavior and reward ownership.
- RED first for every behavioral/source contract change.

## Slice 1 — Shared V14 overlay navigation semantics
Files: `src/V14OverlayBackButton.tsx`, `src/SanctuaryOverlay.tsx`, `src/RaisingIdentityOverlay.tsx`, `src/SeasonLiveOpsOverlay.tsx`, `src/WorldProgressOverlay.tsx`.
- Introduce one small V14-local back control, not a generic modal framework.
- Standardize visible copy to `← 이전 화면` and accessible labels.
- Associate dialogs with visible headings via `aria-labelledby` where currently only `aria-label` is used.
- Keep each overlay's layout and backdrop behavior intact.

## Slice 2 — Build Editor joins the existing overlay lifecycle
Files: `src/useOverlayFocusManagement.ts`, `src/V12BuildEditor.tsx`.
- Extend the existing helper only as needed for a portal dialog that has no persistent launcher component.
- Build Editor gets initial focus, Escape close, Tab containment, and focus restoration to the element that opened it.
- Preserve one body scroller and mobile safe-area behavior.

## Slice 3 — Build decision clarity
Files: `src/V12BuildEditor.tsx`, `src/v12-build-editor.css`.
- Before changing Leader, show which currently equipped items would be unequipped by existing compatibility rules.
- Show meaningful equipment effect detail, including existing numeric ratios/target counts where metadata already provides them.
- No stat simulation and no new equipment rules.

## Tests / gates
Add `src/v14-detail-completion-r1-regression.test.ts` first and observe RED. Then targeted tests, full `npm run test`, `npm run build`, PR to `integration/v3`, release PR to `main`, and fresh Actions/Vercel verification.
