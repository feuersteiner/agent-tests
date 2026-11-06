# Check

Checks judge the sources a test selected.

- [`types.ts`](types.ts): `CheckSchema`, `CheckConfig`, and `SourceRule`. A check needs an `id`, a `description`, an `error`, and at least one of `grep`, `ask`, or `reason`.
- [`rules.ts`](rules.ts): `CheckRules`. Any `grep` hit fails, and every `ask` or `reason` condition in a list must pass.
- [`index.ts`](index.ts): `new TestCheck(checks, config).run(sources)` returns a `Result<Check>`, where flagged means a violation and `check.error` is the message to print.

Rules escalate as `grep`, `ask`, then `reason`, and a check may start at any of them. A passing rule clears the check, a failing rule moves to the next one, and the last rule's result is final. A source must clear every check.

Final failures include grounded `findings` with quotes and one-based lines and columns. Only the final configured rule requests AI explanations; scores are preserved.
