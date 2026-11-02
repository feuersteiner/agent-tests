# Validation

This directory's `index.ts` is the package API barrel. Each stage has one public function:

- `validate-test.ts`: `validateTest` reads and parses `test.yaml`, calls `validateSource`, checks
  directory identity, calls `validatePatterns`, then calls `validateEvals` only when all patterns
  are accepted. `validationResult` in `utils.ts` assembles the result.
- `validate-tests.ts`: `validateTests` discovers installed directories, filters an optional id,
  then calls `validateTest` for each, including malformed and uncompiled definitions. Missing ids
  throw rather than silently passing.
- `patterns.ts`: `validatePatterns` calls `collectPatterns`, compiles each regex for syntax only,
  and calls `isRiskyPattern` without matching example content. Invalid expressions, backreferences
  and nested variable repetition, including brace ranges such as `(a{1,})+`, block static evals.
  This guard detects common risky forms; it is not a proof of arbitrary regex execution safety.
- `evals.ts`: `validateEvals` checks fixture paths, calls the production trigger stage, and uses
  `definiteOutcome` in `utils.ts` to compare outcomes established by fast checks. Unknown model
  decisions remain undecided. `source.ts` verifies the exact `TEST.md` source hash.

Pattern collection and repetition detection are owned internal stages; shared shapes live in
`types.ts` and general helpers live in `utils.ts`. Validation never writes or calls a model.
Eval quality still requires maintainer review.
