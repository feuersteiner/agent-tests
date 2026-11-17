# No eval

Code under `src/` never runs a string as code: it never calls `eval` and never builds a function from a string with the `Function` constructor.

Applies to the TypeScript and JavaScript files under `src/`.

Exceptions: mentioning `eval` in a comment, an error message, or a check that rejects it is not running it.
