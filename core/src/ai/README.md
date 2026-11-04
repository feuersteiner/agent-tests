# AI

`AI` validates requests, config, scores, and exact source quotes; `run(request, config?)` returns a score in `[0, 1]` supporting `ask` as the passing condition.
`explain(request, score, config?)` preserves the score and identifies failing instances.
`ReasoningAI` uses SDK defaults: two retries with backoff for transient provider failures; malformed/schema-invalid output propagates immediately.
`DecisionAI` explains all nonblank lines in one multi-question call; injected provider request limits still apply.
`AiConfig.system` overrides shared defaults in [`prompts.ts`](prompts.ts).
`StubAI` is a WIP default: random `0.1`/`0.9` scores and default explanations.
[`ReasoningAI`](reasoning.ts) and [`DecisionAI`](decision.ts) require injected SDK models.
The package root exports `AI` and schemas/types; concrete classes require direct source imports.
