# Triggers

Triggers select the sources a test inspects. Trace output remains WIP.

[`types.ts`](types.ts) owns the contract. `ParamSchema` is a nonblank string or a nonempty list
of nonblank strings; a list holds **OR** alternatives. `TriggerSchema` requires an `id`,
a `description`, and at least one of `glob`, `grep`, or `ask`.
`TriggersSchema` validates a list of triggers and allows an empty list.

[`filters.ts`](filters.ts) default-exports `TriggerFilters`. Each filter is a `SourceFilter`,
`(source, param, config) => Promise<boolean>`:

- `GlobFilter` matches the path with `minimatch`. Its options are fixed, so neither the runtime
  nor the OS changes the result. `*` stays within a segment, `**` crosses directories, and dotfiles
  match. Parentheses are literal; `[id]` is a character class, so write `\[id\]` for a literal folder.
- `GrepFilter` matches content with case-sensitive JavaScript regexes, without flags. Every regex
  compiles before the source is read, and a bad regex throws.
- `AskFilter` scores content with `config.ai`. Conditions run in list order; the first score at
  `score >= config.threshold` passes. AI errors propagate.

[`TestsTrigger`](index.ts) runs them: `new TestsTrigger(triggers, config).run(sources)`.
`config` is `{ threshold, ai }`. Definitions must already be validated by the
[`Validator`](../validator.ts). Pass the stub `ai` from
[`shared/ai/stub.ts`](../shared/ai/stub.ts) until `DecisionAI` is connected.

- No triggers selects every source.
- Within a trigger, filters use **AND** and always run as `glob`, `grep`, then `ask`,
  stopping at the first failure.
- Between triggers, selection uses **OR**. Every trigger runs on every source concurrently.
- Selected sources are collapsed by `path` and returned in trigger order.

`GrepFilter` and `AskFilter` each call [`Source.open()`](../shared/source.ts); caching belongs to
the getter.
