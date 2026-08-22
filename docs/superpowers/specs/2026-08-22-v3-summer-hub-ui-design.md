# V3 Summer Hub UI Design

## Goal
Extend the already-integrated Spring story surfaces into a Summer-only presentation layer for the active Campaign, Guardian Festival result, representative Character Bond, and VN reflection without introducing new shared state.

## Architecture
- `SummerHubOverlay` owns only presentation and accessibility behavior.
- `SummerHubViewModel` contains presentation-ready strings/arrays only.
- Room 05 does not import or interpret raw campaign affinity or numeric Character Bond trust.
- Room 01 remains the semantic source for Summer chapter/Bond consequences.
- Lane A composition will adapt 01's `summerCampaignStoryPresentation(...)` result into `SummerHubViewModel` on `verify/v3-summer-story-ui`.
- Guardian Festival outcome remains authoritative from World/Tactical; 05 never recomputes it.

## Surfaces
### Campaign Home
Show only Summer season/month, active Campaign, current phase, exactly one primary CTA, one relationship change, and one Guardian Festival result summary.

### Journey
Show campaign title/objective, Guardian Festival framing, completed story beats, and one next-action prompt. Avoid quest-counter/checklist presentation.

### Character Bond
Show representative Summer character with a qualitative relationship summary plus Memory / Promise / Conflict lists. No numeric trust gauge.

### Summer VN shell
Reuse the Spring shell contract: portrait, speaker, dialogue, choices, log, seen-scene fast-forward. Summer dialogue must be able to reflect fail-forward outcomes.

## Accessibility/mobile
Maintain 360x640, 390x844 and 430px contracts, safe-area padding, vh fallback + dvh support, 44px controls, Korean wrapping, internal scroll containment, ESC close, Tab containment, initial close focus, launcher focus return, visible focus, and reduced motion.

## Verification
- RED production-module/CSS absence first.
- Independent 05 Summer tests + full suite + `tsc -b && vite build`.
- Compose exact 01 frozen candidate and exact 05 frozen candidate on `verify/v3-summer-story-ui`.
- Add Lane A E2E for all four active Campaign identities and representative fail-forward reflection.
- Keep verify PR Draft; never merge directly to `integration/v3`.
