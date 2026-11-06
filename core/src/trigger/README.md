# Triggers

Triggers select the sources a test inspects.

- [`types.ts`](types.ts): `TriggerSchema`, `FilterConfig`, and `SourceFilter`. A trigger needs an `id`, a `description`, and at least one of `glob`, `grep`, or `ask`.
- [`filters.ts`](filters.ts): `TriggerFilters`. Globs use `minimatch` with fixed options, so results match on every runtime and OS; write `\[id\]` for a literal folder. Lists are **OR** alternatives.
- [`index.ts`](index.ts): `new TestTrigger(triggers, config).run(sources)` returns a `Result<Trigger>`, where flagged means matched. `selected(sources, result)` returns every input unchanged without triggers; otherwise it deduplicates flagged sources by path in result order.

`FilterConfig.ai` is the `AI` instance shared with checks; `ask` calls `ai.decide.run`.

Filters in a trigger use **AND**, running `glob`, `grep`, then `ask` and stopping at the first failure. Triggers use **OR**, and no triggers selects every source.
