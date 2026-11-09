# Sample: no console.log calls

Smoke definition for JavaScript and TypeScript sources. Fail when source text
contains `console.log(`, allowing whitespace around the dot and before `(`.

This grep rule scans raw text, including comments and strings. It is a sample,
not a syntax-aware lint rule. Evals cover passing, failing, and skipped files.

`npm run test:agents -- sample-no-console-log` currently only prints parsed
arguments; CLI discovery and execution of this definition are pending.
