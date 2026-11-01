# Validation

`validateTest` reads `TEST.md` and `test.yaml`, verifies strict schema and source freshness, and
checks fast patterns against outcomes that can be decided without a model. Unknown model decisions
remain undecided. Invalid regexes, risky repetition and backreferences fail validation before execution.

`validateTests` includes malformed and uncompiled installed tests rather than silently omitting them.
Validation never writes to the project or calls a model. Eval quality still requires maintainer review.
