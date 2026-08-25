# V3 Release Candidate Checklist

Authoritative baseline entering Expanded Polish: `integration/v3@542d1746fb4253a25222435e798d90c189df4d52`

## Required gates

- [ ] `npm ci` succeeds from committed `package-lock.json`
- [ ] dependency audit path captured and every high-severity finding classified
- [ ] no unclassified high-severity runtime vulnerability
- [ ] Expanded Polish semantic run guidance tests GREEN
- [ ] Home/mobile/accessibility regression GREEN at 360/390/430
- [ ] repeat-run QoL/re-entry regression GREEN
- [ ] persistence/malformed/NaN/Infinity/idempotency GREEN
- [ ] normal four Campaign regressions GREEN
- [ ] NG+ multicycle regression GREEN
- [ ] Fifth / True regression GREEN
- [ ] Hollow accept/refuse/runtime/ending/persistence regression GREEN
- [ ] Tactical stability including AUTO 10/50/100 GREEN
- [ ] Expedition stress GREEN
- [ ] Season/meta long-run GREEN
- [ ] Expanded multi-cycle soak GREEN
- [ ] full `npm run test` GREEN with exact counts recorded
- [ ] `npm run build` (`tsc -b && vite build`) GREEN with bundle/module output recorded
- [ ] build-size warnings classified or resolved with evidence
- [ ] exact tested candidate tree recorded
- [ ] PR synthetic merge tree equals tested/promotion tree
- [ ] `integration/v3` advances exactly once, non-force, only after all gates GREEN
- [ ] `main` unchanged
- [ ] production unchanged

## Current evidence

- Hollow baseline entering this Wave: 424/424 files, 1669/1669 tests, build GREEN.
- Expanded Polish UX checkpoint CI #1784: 426/426 files, 1678/1678 tests, build GREEN, 201 modules.
- CI #1784 reproduced one high-severity dependency warning; exact dependency path is being captured by the audit-evidence CI step before any dependency upgrade.
- CI #1784 build output: JS 543.36 kB minified / 158.55 kB gzip, exceeding Vite's 500 kB warning threshold. This is a measured performance/release warning and must be resolved or explicitly classified before RC.
