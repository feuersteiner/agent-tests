# Engines agent guide

```ts
type Engine = (input: string, criteria: Param, config?: AiConfig) => Promise<number>;
```

- Engines and factories are arrow functions. The engine contract has no generics, result objects, or required classes.
- Glob returns `0` or `1`; AI returns a score in `[0, 1]`, where higher means stronger support for the passing condition. Grep returns a nonnegative integer occurrence count; a normal grep predicate passes when the count is greater than zero.
- Criteria lists combine with OR: glob returns `1` when any pattern matches; grep returns the highest individual pattern count, without summing alternatives; decide/reason score each criterion separately and return the highest score.
- Grep counts non-overlapping JavaScript regex matches, including zero-width matches. Counting must terminate and cached regex state must not leak between calls.
- Reuse `Param` and `ParamSchema` from `../types.ts`. Engine-specific schemas, `AiConfig`, provider settings types, and `Engine` belong in `types.ts`.
- Validate criteria with `ParamSchema`; AI engines also validate input, per-call config, and returned scores. Errors reject the promise.
- Project dependencies must stay inside this directory, except top-level shared contracts in `../types.ts`. External packages and Node builtins are allowed. Do not depend on legacy `../ai/`, feature modules, or CLI code.
