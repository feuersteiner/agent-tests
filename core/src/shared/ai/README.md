# AI

AI scoring and explanations. `ask` is always a passing condition, and higher scores mean stronger support for passing. The package root exports `AI`, `agent-tests/types` exports the schemas and types, and `AgentTest` constructs concrete models from validated provider config.

- [`index.ts`](index.ts): abstract `AI` with `run(request, config?)`, which returns a score in `[0, 1]`, and `explain(request, score, config?)`, which keeps the score and requires exact source quotes. Errors reject the promise.
- [`types.ts`](types.ts) and [`prompts.ts`](prompts.ts): the contracts and default prompts. `AiConfig.system` overrides a prompt, and an empty string removes it.
- [`decision.ts`](decision.ts): `new DecisionAI(model)` needs a decision model. It scores with `P(true)` and explains source lines in one multi-question call.
- [`reasoning.ts`](reasoning.ts): `new ReasoningAI(model)` needs a language model with structured output. Retries follow SDK defaults.
- [`models.ts`](models.ts): construct OpenAI or Jev decision providers and OpenAI or Anthropic reasoning providers, resolving `apiKeyEnv`; missing or blank keys fail construction even for grep-only tests.

Clef support is deferred pending standardized APIs for system-one models.
