# Shared

Reusable code shared by feature modules.

- [`ai/`](ai/README.md): AI scoring, explanations, and SDK implementations.
- [`source.ts`](source.ts): `new Source(path, getter)`, where `open()` calls the getter. Sources make no filesystem assumptions, so callers supply how content is read.
- [`types.ts`](types.ts): `IdSchema`, `TextSchema`, and `ParamSchema`, plus `Result<T>`, `{ flagged, cleared }`, returned by triggers, checks, and evals.
