# Fetch with a timeout

Every `fetch` call in the TypeScript files under `src/` passes a `signal` created with `AbortSignal.timeout`, so no request can hang forever.

Applies to the `.ts` files under `src/` that call `fetch`.

Exceptions: none. How the rest of the file is written does not matter to this rule.
