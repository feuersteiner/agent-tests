# No silent fallthrough

A `case` that has statements does not fall through to the next clause, unless a comment says `falls through`.

Applies to the JavaScript files under `src/`. The rule and its cases come from ESLint's `no-fallthrough`.
