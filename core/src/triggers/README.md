# Triggers

[index.ts](index.ts) defines the abstract `Trigger<Params>` base.
Its public readonly `run(input, params, config): Promise<boolean>` parses params
with the protected `paramsSchema: z.ZodType<Params>` before calling protected
`matches(input, params, config)`.
Import each class directly from its source module. The package root's `Trigger`
remains the shared YAML type.

- [PathMatchTrigger](path-match.ts): `new PathMatchTrigger()`, `run` takes
  `Patterns` (string or nonempty string array).
- [ContentMatchTrigger](content-match.ts): `new ContentMatchTrigger()`, `run`
  takes `Patterns`.
- [PathAskTrigger](path-ask.ts): `new PathAskTrigger(ai)`,
  `run` takes a passing-condition string.
- [ContentAskTrigger](content-ask.ts): `new ContentAskTrigger(ai)`,
  `run` takes a passing-condition string.

`run` receives a path or content string. Match params use `PatternsSchema`;
ask params use `AiRequestSchema.shape.ask`.

`PathMatchTrigger` uses `node:path.posix.matchesGlob`: `*` stays within one path
segment, `**` can cross directories, and ordinary wildcards exclude leading dots.
`ContentMatchTrigger` uses `FastEngine` with case-sensitive JavaScript regexes
without flags, passing on score `1`. Pattern arrays are alternatives. Every
content regex compiles before matching; any invalid regex rejects the promise.

Every `run` requires caller-supplied global configuration shaped as
`{ threshold: number }` (`TriggerConfig`); match triggers ignore it. Threshold
ownership, validation, and defaults belong to the caller's future global config.
Triggers neither validate nor default nor store the threshold or config.

Ask constructors require only an injected `AI` instance; provider configuration
belongs to the caller. Ask returns whether the raw AI score is at least that
execution's `config.threshold`, using only the supplied input and passing condition.
All triggers return booleans. Param validation, regex, and AI errors reject `run`.
