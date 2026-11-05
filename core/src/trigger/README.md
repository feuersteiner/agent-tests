# Triggers

Triggers select the sources a test inspects.

- [`types.ts`](types.ts): `TriggerSchema`, `FilterConfig`, and `SourceFilter`. A trigger needs an `id`, a `description`, and at least one of `glob`, `grep`, or `ask`.
- [`filters.ts`](filters.ts): `TriggerFilters`. Globs use `minimatch` with fixed options, so results match on every runtime and OS; write `\[id\]` for a literal folder. Lists are **OR** alternatives.
- [`index.ts`](index.ts): `new TestsTrigger(triggers, config).run(sources)` returns a `Result<Trigger>`, where flagged means matched. `selected(sources, result)` gives the sources to inspect.

Filters in a trigger use **AND**, running `glob`, `grep`, then `ask` and stopping at the first failure. Triggers use **OR**, and no triggers selects every source.
