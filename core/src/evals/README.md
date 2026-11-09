# Evals

Evals test a test's selection and checks against labeled examples.

- [`types.ts`](types.ts): `EvalSchema` and `TestOutcomeSchema`. An example has a `name`, a `path`, `content` or directory `children`, and an `expect` of `pass`, `fail`, or `skip`.
- [`index.ts`](index.ts): `new TestEval(evals).run(select, check, verbose)` returns a `Result<Eval>`, where flagged means the example did not match its label and `trace` says what happened.

An example's outcome is `skip` if selection returns no targets, `fail` if any check flags it, and `pass` otherwise.
