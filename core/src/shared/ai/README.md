# AI

AI scoring and explanations. `ask` is always a passing condition, and higher scores mean stronger support for passing. The package root exports `AI` and the schemas; concrete classes need direct imports.

- [`index.ts`](index.ts): abstract `AI` with `run(request, config?)`, which returns a score in `[0, 1]`, and `explain(request, score, config?)`, which keeps the score and requires exact source quotes. Errors reject the promise.
- [`types.ts`](types.ts) and [`prompts.ts`](prompts.ts): the contracts and default prompts. `AiConfig.system` overrides a prompt, and an empty string removes it.
- [`decision.ts`](decision.ts): `new DecisionAI(model)` needs a decision model. It scores with `P(true)` and explains source lines in one multi-question call.
- [`reasoning.ts`](reasoning.ts): `new ReasoningAI(model)` needs a language model with structured output. Retries follow SDK defaults.
- [`stub.ts`](stub.ts): `StubAI`, the WIP default, with random `0.1` or `0.9` scores and no failures.
