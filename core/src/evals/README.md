# Evals

`evaluateTest` writes each labeled example into its own isolated temporary Git repository, runs the
real triggers and checks, and compares the result with `expect`. Every repository is always removed.

`evaluateTests` discovers installed tests, optionally filters by id, and evaluates each definition.
Results distinguish disagreements, skipped examples and execution errors; a missing model never
turns an expected failure into a passing evaluation. No source repository files are changed.
