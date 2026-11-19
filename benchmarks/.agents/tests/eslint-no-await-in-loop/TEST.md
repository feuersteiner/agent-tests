# No await in a loop

Code does not await on each turn of a loop. Awaiting once in the part of a loop header that runs a single time is fine, and so is the body of a `for await` loop.

Applies to the JavaScript files under `src/`. The rule and its cases come from ESLint's `no-await-in-loop`.
