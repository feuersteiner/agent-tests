# Evals

Evals test a test's triggers and checks against labeled examples.

- [`types.ts`](types.ts): `EvalSchema` and `TestOutcomeSchema`. An example has a `name`, a `path`, `content`, and an `expect` of `pass`, `fail`, or `skip`.
- [`index.ts`](index.ts): `new TestEval(evals).run(trigger, check, verbose)` returns an `EvalResult`, where flagged means the example did not match its label with `actual` recording the observed label and `trace` recording stage failures.

An example's outcome is `skip` if no trigger selects it, `fail` if any check flags it, and `pass` otherwise.
