# Sample: no TODO markers

Smoke definition for JavaScript and TypeScript sources. Fail when the text
contains the uppercase word `TODO`; resolve the task or track it elsewhere.

This grep rule scans raw text, including comments and strings. It is a sample,
not a syntax-aware lint rule. Evals cover passing, failing, and skipped files.

`npm run test:agents -- sample-no-todo` currently only prints parsed arguments;
CLI discovery and execution of this definition are pending.
