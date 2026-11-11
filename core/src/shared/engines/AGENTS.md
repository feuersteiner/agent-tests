# Engines agent guide

```ts
type Engine = (input: string, criteria: Param, config?: AiConfig) => Promise<number>;
```

- Engines and factories are arrow functions. The engine contract has no generics, result objects, or required classes.
- Every engine returns a score in `[0, 1]`. Glob and grep return only `0` or `1`; higher AI scores mean stronger support for the passing condition.
- Criteria lists combine with OR: glob/grep return `1` when any pattern matches; decide/reason score each criterion separately and return the highest score.
- Reuse `Param` and `ParamSchema` from `../types.ts`. Engine-specific schemas, `AiConfig`, provider settings types, and `Engine` belong in `types.ts`.
- Validate criteria with `ParamSchema`; AI engines also validate input, per-call config, and returned scores. Errors reject the promise.
- Project dependencies must stay inside this directory, except top-level shared contracts in `../types.ts`. External packages and Node builtins are allowed. Do not depend on legacy `../ai/`, feature modules, or CLI code.
