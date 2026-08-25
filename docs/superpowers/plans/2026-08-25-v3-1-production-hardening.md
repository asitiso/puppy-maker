# V3.1 Production Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden the released V3 against browser render/storage failures, add privacy-safe client telemetry visible in Vercel runtime logs, remediate Nano ID CVE-2026-67213 with the smallest compatible patch, and promote only a fully verified V3.1 tree.

**Architecture:** Keep gameplay state unchanged. A root React error boundary contains render failures; production storage wrappers make browser storage exceptions non-fatal; a small client telemetry module sends only allowlisted semantic events to one Vercel Function; the function validates and logs only bounded fields. Security remediation is limited to Nano ID 3.3.18.

**Tech Stack:** React 19, TypeScript, Vitest, Vite 8, Vercel Functions, npm lockfile v3.

**Spec:** `docs/superpowers/specs/2026-08-25-v3-1-production-hardening-design.md`

## Global Constraints
- No gameplay balance or campaign/runtime state changes.
- No save schema version change.
- Never delete player saves automatically.
- Client telemetry must never include exception text, stacks, query strings, hashes, save contents, names, or arbitrary user data.
- Keep telemetry best-effort; telemetry failure must never affect gameplay.
- Security change is Nano ID `3.3.18` only; no force audit upgrade or unrelated dependency churn.
- Single-room execution; no 03/05/06 handoffs.

---

### Task 1: Define telemetry contract and Vercel endpoint

**Files:**
- Create: `src/client-telemetry-contract.ts`
- Create: `src/client-telemetry-contract.test.ts`
- Create: `api/client-telemetry.ts`
- Create: `api/client-telemetry.test.ts`

**Interfaces:**
- Produces `ClientTelemetryPayload`, `parseClientTelemetryPayload(input)`.
- Produces default Vercel handler for GET health and POST structured telemetry.

- [ ] **Step 1: Write contract tests**

Cover:
```ts
expect(parseClientTelemetryPayload({kind:'render_error',phase:'error_boundary',path:'/'})).toEqual({kind:'render_error',phase:'error_boundary',path:'/'})
expect(parseClientTelemetryPayload({kind:'client_perf',phase:'navigation',path:'/',metric:'load_ms',value:1234})).toEqual(expect.objectContaining({metric:'load_ms',value:1234}))
expect(parseClientTelemetryPayload({kind:'render_error',phase:'error_boundary',path:'/?secret=x'})).toBeNull()
expect(parseClientTelemetryPayload({kind:'render_error',phase:'error_boundary',path:'/',message:'private'})).toBeNull()
expect(parseClientTelemetryPayload({kind:'client_perf',phase:'navigation',path:'/',metric:'other',value:5})).toBeNull()
expect(parseClientTelemetryPayload({kind:'client_perf',phase:'navigation',path:'/',metric:'load_ms',value:Infinity})).toBeNull()
```

- [ ] **Step 2: Implement the bounded parser**

Use exact allowlists:
```ts
export type ClientTelemetryKind = 'render_error'|'window_error'|'unhandled_rejection'|'save_error'|'client_perf';
export type ClientTelemetryPhase = 'error_boundary'|'window'|'unhandled_rejection'|'load'|'write'|'navigation'|'paint';
export type ClientPerfMetric = 'dom_content_loaded_ms'|'load_ms'|'first_contentful_paint_ms';
```
Reject non-object inputs, extra keys, non-pathname paths, strings longer than 120 chars, non-finite/negative/over-120000 metrics, and performance events without metric/value.

- [ ] **Step 3: Write API tests**

Use mock request/response objects and verify:
- GET -> 200 `{ok:true}`.
- unsupported method -> 405.
- invalid POST -> 400 and does not log raw body.
- valid performance POST -> 204 and `console.info` structured log.
- valid fault POST -> 204 and `console.error` structured log.

- [ ] **Step 4: Implement `api/client-telemetry.ts`**

The handler imports the parser, accepts GET/POST only, and logs:
```ts
JSON.stringify({event:'puppy_maker_client_telemetry', ...payload})
```
Never interpolate or log the unparsed request body.

- [ ] **Step 5: Commit Task 1**

Commit message: `feat: add privacy-safe client telemetry endpoint`.

---

### Task 2: Contain browser/render/storage failures

**Files:**
- Create: `src/client-observability.ts`
- Create: `src/client-observability.test.ts`
- Create: `src/ProductionErrorBoundary.tsx`
- Create: `src/ProductionErrorBoundary.test.tsx`
- Create: `src/production-storage.ts`
- Create: `src/production-storage.test.ts`
- Create: `src/production-safety.css`
- Modify: `src/main.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- `reportClientTelemetry(kind, phase, metric?, value?)`
- `installClientObservability()`
- `collectPerformanceTelemetry(performanceLike)`
- `loadProductionState(storage)`
- `writeProductionState(storage,state)`
- `ProductionErrorBoundary`

- [ ] **Step 1: Write client observability tests**

Verify a pure performance collector maps navigation/paint entries only to the three approved metrics and ignores negative/non-finite values. Verify fault dedupe by injecting a fake sender and calling the same `kind:phase` twice.

- [ ] **Step 2: Implement client observability**

`reportClientTelemetry` posts JSON to `/api/client-telemetry` with `keepalive:true` and `credentials:'omit'`, swallowing failures. Use module-level `Set<string>` for one-page-session fault dedupe. `installClientObservability` attaches one `error`, one `unhandledrejection`, and one `load` listener; it never forwards exception details.

- [ ] **Step 3: Write storage failure tests**

Create storage doubles whose `getItem`, `setItem`, or `removeItem` throws. Assert:
```ts
expect(loadProductionState(throwingReadStorage, report).state).toEqual(initialState)
expect(report).toHaveBeenCalledWith('save_error','load')
expect(() => writeProductionState(throwingWriteStorage, initialState, report)).not.toThrow()
expect(report).toHaveBeenCalledWith('save_error','write')
```
Also assert ordinary resilient save/load still returns canonical hydrated state.

- [ ] **Step 4: Implement production storage wrappers**

Wrap existing `loadResilientSave`, `repairPrimarySave`, `writeResilientSave`, and the legacy ambition-key removal only. Do not duplicate schema sanitation or modify the state shape.

- [ ] **Step 5: Write error fallback tests**

Render exported fallback markup with `renderToStaticMarkup` and verify:
- `role="alert"` or equivalent accessible status;
- Korean recovery copy;
- a reload action;
- explicit copy that save data is not automatically deleted.

- [ ] **Step 6: Implement `ProductionErrorBoundary`**

Use a React class boundary. `componentDidCatch` calls only:
```ts
reportClientTelemetry('render_error','error_boundary')
```
Fallback primary button calls `window.location.reload()`.

- [ ] **Step 7: Wire root and App**

`src/main.tsx`:
```tsx
installClientObservability();
ReactDOM.createRoot(...).render(
  <React.StrictMode>
    <ProductionErrorBoundary><Root /></ProductionErrorBoundary>
  </React.StrictMode>
);
```
Import `production-safety.css`.

`src/App.tsx`: replace direct resilient load/write calls with the tested wrappers while preserving yearly ambition merge semantics.

- [ ] **Step 8: Add mobile-safe CSS**

`.production-error-screen` uses `min-height:100dvh`, safe-area padding, centered max-width content, Korean wrapping, and buttons with `min-height:44px`. Include reduced-motion rule with no animated fallback requirement.

- [ ] **Step 9: Commit Task 2**

Commit message: `feat: contain production browser failures`.

---

### Task 3: Remediate Nano ID advisory and classify stale issues

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Temporary if needed: `.github/workflows/v31-lock-refresh.yml` (must be deleted before final gate)

**Interfaces:**
- npm override: `nanoid: 3.3.18`.

- [ ] **Step 1: Add the smallest override**

Add:
```json
"overrides": {
  "nanoid": "3.3.18"
}
```
without changing other dependencies.

- [ ] **Step 2: Regenerate lockfile deterministically**

Run equivalent of:
```bash
npm install --package-lock-only --ignore-scripts
npm ci
npm audit --audit-level=high
```
The lock must resolve `node_modules/nanoid` to:
- version `3.3.18`
- resolved `https://registry.npmjs.org/nanoid/-/nanoid-3.3.18.tgz`
- integrity `sha512-DTg4MJbGMWkfi6VZFdNt2/caMbQy4Ou+Op/hJQvGEWcnVfoA1QA+xzRKAzw9jD6+GVOOeYr/mIcuDSdug6F6+w==`

If direct lock regeneration is unavailable in the current harness, use a branch-only one-shot GitHub Actions workflow with `contents: write` to run those commands, commit only `package-lock.json`, then remove that workflow before final verification.

- [ ] **Step 3: Verify security outcome**

Require `npm audit --audit-level=high` to exit successfully. Do not downgrade or waive a remaining high/critical advisory.

- [ ] **Step 4: Re-check old open issues**

Inspect #47 and #49 against current V3 tests/code. Close only if their exact original contract is now covered. Spring implementation issues #56-#60 may be closed as superseded/completed only if current repository history and V3 release evidence prove their scope shipped. Leave ambiguous issues open with a current evidence note.

- [ ] **Step 5: Commit Task 3**

Commit message: `fix: remediate nanoid production advisory`.

---

### Task 4: V3.1 final gate, preview, and production promotion

**Files:**
- Update release evidence in PR/issue comments only; no gameplay files after gate begins.

- [ ] **Step 1: Open PR against `integration/v3`**

PR title: `[00] V3.1 Production Hardening`.

- [ ] **Step 2: Run targeted and full CI**

Require:
```bash
npm ci
npm audit --audit-level=high
npm test
npm run build
```
Plus existing multi-cycle, Tactical AUTO 10/50/100, Expedition stress, malformed/NaN/Infinity, and mobile/a11y suites through the full test run.

- [ ] **Step 3: Verify Vercel preview**

Exact PR head must produce READY preview. Verify:
- root HTTP 200;
- GET `/api/client-telemetry` HTTP 200 with `{ok:true}`;
- build uses `npm ci`;
- no preview runtime error cluster.

- [ ] **Step 4: Verify exact tested tree**

Record PR head SHA, synthetic merge SHA/tree, CI run/job, test counts, build chunk sizes, audit result, and preview deployment ID.

- [ ] **Step 5: Promote `integration/v3` only if all gates are GREEN**

Advance non-force through the reviewed PR. Re-check branch SHA/tree and integration preview.

- [ ] **Step 6: Promote production under the already-approved V3.1 workflow**

Advance `main` non-force only when it is an ancestor of the verified V3.1 release SHA. Verify Vercel production READY, primary domain HTTP 200, telemetry health 200, and post-deploy runtime errors = 0.

- [ ] **Step 7: Record V3.1 release evidence**

Create/update a V3.1 tracking issue or release comment with exact SHA/tree/CI/deployment evidence and known residual risks.

---

## Self-review
- Spec coverage: all four approved V3.1 stages map to Tasks 1-4.
- Placeholder scan: no TBD/TODO/unspecified implementation steps remain.
- Type consistency: telemetry kinds/phases/metrics are defined once in Task 1 and consumed unchanged in Tasks 2-4.
- Scope: no gameplay state/schema expansion and no third-party observability dependency.