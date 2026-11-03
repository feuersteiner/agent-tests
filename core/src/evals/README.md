# Evals

This directory's `index.ts` aggregates the public API; each implementation has one public function:

- `evaluate-test.ts`: `evaluateTest` rejects definitions without examples, calls
  `withFixtureRepository` once per example, delegates to `evaluateCase`, then summarizes results.
- `evaluate-tests.ts`: `evaluateTests` calls `discoverTests`, filters an optional id and calls
  `evaluateTest` for each definition. A requested missing id throws.
- `case.ts`: `evaluateCase` checks `isSafeEvalPath`, writes the example, calls production
  `evaluateTriggers` and `evaluateChecks`, and reports disagreements or execution errors.
- `fixture.ts`: `withFixtureRepository` initializes an isolated temporary Git repository and removes
  it in `finally`, including when evaluation throws. Fixture creation failures propagate.

`path.ts` owns the exported fixture-path predicate; `types.ts` owns result shapes. Missing models
never turn expected failures into passing evaluations. Source repository files are unchanged.
