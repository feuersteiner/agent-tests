# Doc comments match the code

Every documented function does what its doc comment says: the return values, thrown errors, parameter handling, and bounds the comment states match the implementation.

Applies to the TypeScript files under `src/` that hold at least one `/** ... */` doc comment.

Exceptions: functions without a doc comment, and comments that describe intent without claiming a behavior.
