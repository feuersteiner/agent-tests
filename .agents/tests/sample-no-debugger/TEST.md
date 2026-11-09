# Sample: no debugger statements

Smoke definition for JavaScript and TypeScript sources. Fail when source text
contains `debugger` followed by optional whitespace and a semicolon.

This grep rule scans raw text, including comments and strings. Semicolon-free
statements are outside this sample's rule. Evals cover pass, fail, and skip.

`npm run test:agents -- sample-no-debugger` currently only prints parsed arguments;
CLI discovery and execution of this definition are pending.
