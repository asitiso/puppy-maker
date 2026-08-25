# Expanded Polish plan self-review

- Spec coverage: all approved 8 stages map to Tasks 1-8.
- Scope guard: no new campaign, combat engine, major economy/meta, or persistent subsystem.
- Placeholder scan: no TBD/TODO/implement-later placeholders.
- Type boundary: new `RunGuidanceView` is presentation-only and consumes existing `GameState`; no downstream task relies on undefined persisted fields.
- Persistence rule: production sanitizer changes are explicitly RED-gated.
- Security rule: warning must be traced to an exact dependency path before any upgrade; risky major migration is classified rather than forced.
- Release rule: promotion requires tested-tree equality and non-force integration update; main/prod remain untouched.

Result: plan is internally consistent and ready for inline execution.
