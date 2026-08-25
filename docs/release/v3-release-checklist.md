# V3 Release Candidate Checklist

Authoritative baseline entering Expanded Polish: `integration/v3@542d1746fb4253a25222435e798d90c189df4d52`

## Required gates

- [x] `npm ci` succeeds from committed `package-lock.json`
- [x] dependency audit path captured and every high-severity finding classified
- [x] no unclassified high-severity runtime vulnerability
- [x] Expanded Polish semantic run guidance tests GREEN
- [x] Home/mobile/accessibility regression GREEN at 360/390/430
- [x] repeat-run QoL/re-entry regression GREEN
- [x] persistence/malformed/NaN/Infinity/idempotency GREEN
- [x] normal four Campaign regressions GREEN
- [x] NG+ multicycle regression GREEN
- [x] Fifth / True regression GREEN
- [x] Hollow accept/refuse/runtime/ending/persistence regression GREEN
- [x] Tactical stability including AUTO 10/50/100 GREEN
- [x] Expedition stress GREEN
- [x] Season/meta long-run GREEN
- [x] Expanded multi-cycle soak GREEN
- [x] full `npm run test` GREEN with exact counts recorded
- [x] `npm run build` (`tsc -b && vite build`) GREEN with bundle/module output recorded
- [x] build-size warning resolved with measured evidence
- [ ] exact tested candidate tree recorded in Control Tower
- [ ] PR synthetic merge tree equals tested/promotion tree
- [ ] `integration/v3` advances exactly once, non-force, only after all gates GREEN
- [x] `main` has not been modified by Expanded Polish work
- [x] production has not been modified by Expanded Polish work

## Expanded Polish evidence before final promotion

### Player experience / QoL

- Semantic run guidance: first run, active run, returning run, completed run, True and Hollow tone without raw affinity/danger/threshold leakage.
- `RunGuidanceCard` is presentation-only and adds no persisted state or progression mutation.
- Home controls retain focus-visible treatment, reduced-motion support, Korean wrapping, safe-area treatment and minimum touch target support.
- Repeat-play re-entry tests prove True/Hollow/completed-run guidance survives hydrate/reload without replaying hidden candidate semantics.

### Persistence / multi-run

- `v3-expanded-polish-persistence.test.ts`: 4/4 GREEN.
- malformed numeric state: NaN/Infinity sanitized; canonical lists deduplicated; fractional affinity follows the existing safe integer sanitizer.
- hydrate -> JSON save -> hydrate is idempotent.
- NEW_RUN clears current campaign/route/danger/world authority exactly once and preserves intended compact inherited world history.
- arbitrary non-canonical manual relationship echoes do not become authority.
- `v3-expanded-polish-soak.test.ts`: 1/1 GREEN across normal -> True -> Hollow -> new possibility lineage.
- existing NG+ multicycle, Fifth persistence, Hollow persistence and global malformed-number regressions remain GREEN.

### CI / performance

CI #1791 / job `97657020969` on PR #181 synthetic merge ref:
- clean install: `npm ci` GREEN on Node 22.23.2 / npm 10.9.8
- full test: **429/429 test files, 1686/1686 tests GREEN**
- Tactical stability: 13/13 incl. AUTO 10/50/100 GREEN
- Expedition stress: 4/4 GREEN
- Expanded QoL: 3/3 GREEN
- Expanded persistence: 4/4 GREEN
- Expanded soak: 1/1 GREEN
- global malformed numeric NaN/Infinity regression GREEN
- `tsc -b && vite build`: GREEN; 201 modules transformed

Measured bundle improvement:
- before split: main JS **543.36 kB** minified / 158.55 kB gzip, above Vite's 500 kB warning threshold
- after Vite 8 Rolldown vendor code splitting:
  - app JS **353.00 kB** / 98.78 kB gzip
  - vendor JS **189.58 kB** / 59.61 kB gzip
  - Rolldown runtime 0.58 kB
- no >500 kB chunk warning remains.

### Security classification

Fresh `npm audit --json` in CI #1791 reports one high-severity transitive finding:
- package: `nanoid@3.3.17`
- advisory: `GHSA-2v37-7h3g-55p8`
- vulnerable range: `<3.3.18`
- dependency path: `postcss@8.5.26 -> nanoid@^3.3.17`
- direct dependency: no
- project source imports `nanoid`: none
- project source imports `postcss`: none
- role in this repository: Vite/PostCSS build-time tooling, not browser/runtime game code

Classification: **known build-tooling dependency risk; no unclassified high-severity runtime vulnerability.** The affected Nano ID APIs require a zero-size custom generator input; puppy-maker does not call Nano ID. A blind forced toolchain upgrade is intentionally excluded from this RC because PostCSS is constrained to the Nano ID 3.x CommonJS line and adjacent 3.x security work remains an upstream compatibility concern. Track the dependency refresh separately; do not use `npm audit fix --force` in the release branch.

## Final promotion record

The exact candidate tree, PR synthetic merge tree, promoted tree and final `integration/v3` RC SHA are recorded in issue #54 after the final CI run. Promotion is allowed only when all three trees are identical and the baseline has not moved unexpectedly.
