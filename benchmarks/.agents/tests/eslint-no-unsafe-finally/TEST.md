# No control flow out of finally

A `finally` block never returns, throws, breaks or continues its way out.

Applies to the JavaScript files under `src/`. The rule and its cases come from ESLint's `no-unsafe-finally`.
