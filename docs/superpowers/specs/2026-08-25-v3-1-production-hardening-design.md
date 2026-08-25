# V3.1 Production Hardening Design

## Status
Approved for single-room execution on 2026-08-25.

## Baseline
- Production/main/integration baseline: `3d9f389ad13268ac9b42226ef4516f82697d6d69`
- V3 production deployment is READY and serving HTTP 200.
- Initial post-release scan found no Vercel runtime errors and no unresolved toolbar feedback.

## Goal
Make the released V3 safer to operate in real browsers without adding gameplay systems: contain client rendering/storage failures, add privacy-safe client telemetry that is visible in Vercel runtime logs, remove the known Nano ID high-severity advisory with the smallest compatible patch, and run a full V3.1 release gate.

## Non-goals
- No new Campaign, route, ending, combat engine, economy, or meta-progression system.
- No gameplay balance changes.
- No save schema version change.
- No automatic deletion of player saves during recovery.
- No third-party error-tracking service or user-identifying telemetry.

## 1. Browser failure containment

### React render boundary
Add a root-level `ProductionErrorBoundary` above `Root`. It catches descendant render/lifecycle errors and replaces a blank/crashed screen with an accessible recovery surface.

The recovery surface:
- explains that the current screen failed to load;
- states that saved data is not automatically deleted;
- provides a single primary action to reload the application;
- uses mobile-safe layout, safe-area padding, Korean wrapping, and a 44px minimum action target.

The boundary reports only a semantic failure category (`render_error`) and phase (`error_boundary`) to client telemetry. It must not send error messages, stack traces, save contents, user-entered text, IDs, or device fingerprints.

### Storage failure tolerance
`App` already uses resilient primary/backup saves, but browser storage APIs can still throw (for example, storage blocked or unavailable). Wrap the initial load/repair and write/remove operations in `try/catch`.

On load failure:
- fall back to `initialState` for the current session;
- queue a privacy-safe `save_error/load` telemetry event;
- do not clear storage.

On write failure:
- keep the in-memory session playable;
- emit `save_error/write` telemetry;
- do not throw from the effect.

Existing schema sanitation, backup recovery, NG+ reset semantics, and save idempotency remain authoritative and unchanged.

## 2. Client observability and performance

Vercel Web Analytics is not currently enabled for this project, so V3.1 must not depend on a dashboard switch or a new package. Instead add one tiny Vercel Function at `/api/client-telemetry`.

### Client events
The browser may send only these event classes:
- `render_error`
- `window_error`
- `unhandled_rejection`
- `save_error`
- `client_perf`

Allowed fields are semantic and bounded:
- `kind`
- `phase`
- `path` (URL pathname only)
- optional metric name from an allowlist
- optional finite numeric metric value

Never send exception text, stack, query strings, hashes, save values, names, arbitrary strings, or nested objects.

### Rate control
Client fault events are deduplicated per session by `kind:phase`. Telemetry delivery is best-effort and never allowed to break gameplay. Network/reporting errors are swallowed.

### Performance samples
After window load, send a small bounded set of browser timing samples when present:
- DOMContentLoaded time from Navigation Timing
- load event time from Navigation Timing
- first-contentful-paint from Paint Timing

These samples are performance diagnostics only. No continuous sampling loop is added.

### Server endpoint
`GET /api/client-telemetry` is a health check and returns JSON `{ "ok": true }`.

`POST /api/client-telemetry` validates the bounded schema. Invalid methods/payloads are rejected without logging raw request bodies. Valid client faults are written as structured Vercel runtime logs; performance samples use info-level logs and fault events use error-level logs.

## 3. Security remediation

Current lockfile resolves `postcss -> nanoid@3.3.17`. GitHub Advisory `GHSA-2v37-7h3g-55p8` / CVE-2026-67213 now classifies Nano ID `<3.3.18` as affected and `3.3.18` as the patched 3.x release.

Apply only the compatible patch:
- add npm override `nanoid: 3.3.18`;
- update the existing lockfile Nano ID record from 3.3.17 to 3.3.18 using the published tarball and integrity;
- do not run a force audit upgrade and do not upgrade Vite/PostCSS or unrelated dependencies.

Release acceptance requires fresh `npm ci` plus audit evidence showing no remaining high-severity Nano ID advisory.

## 4. Stale issue cleanup

Do not bulk-close historical issues blindly. Close only issues whose original contract is demonstrably covered by released V3 code/tests. At minimum, re-check old RC blockers around NEW_RUN and weekly cadence before changing their state. If evidence is ambiguous, leave the issue open with a current note rather than guessing.

## 5. Testing and release gate

### Targeted tests
Add tests for:
- error fallback markup and no destructive-save wording;
- client telemetry sanitation/dedupe/performance allowlist;
- telemetry API method and schema handling;
- storage exceptions falling back/continuing safely without changing canonical save logic.

### Regression
Require:
- all existing V3 tests plus new V3.1 tests;
- existing normal/NG+/True/Hollow multi-cycle soak;
- Tactical AUTO 10/50/100 and Expedition stress;
- malformed/NaN/Infinity persistence suites;
- mobile/accessibility contracts including 360/390/430.

### Build/deploy
- `npm ci`
- dependency audit evidence
- full `npm test`
- `tsc -b && vite build`
- Vercel preview READY
- preview root HTTP 200
- `/api/client-telemetry` GET health 200
- no preview runtime error cluster from the deployment

Only after those gates are green may the exact tested V3.1 tree advance `integration/v3`, then `main`/production under the user's already-approved V3.1 workflow. The production deployment must be rechecked for READY, HTTP 200, telemetry health, and post-deploy runtime errors.

## Scope guard
This wave is operational hardening. If implementation reveals a required save-schema migration, new gameplay state, or a broad frontend architecture rewrite, stop and reclassify rather than expanding the wave.