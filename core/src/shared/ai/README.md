# AI

[`AI`](index.ts) exposes readonly async `run(request, config?)` and `explain(request, score, config?)`.
The base validates requests, config, finite scores in `[0, 1]`, and explanation output using [`types.ts`](types.ts).
`ask` describes the passing condition; higher scores mean stronger support for passing.
Explanations preserve the supplied score and require every nonempty failure quote to be an exact source substring.
Validation, changed-score, grounding, and implementation errors reject the promise.

`new ReasoningAI(model)` ([source](reasoning.ts)) requires an SDK language-model instance supporting structured output.
It uses SDK defaults: two retries with backoff for retryable provider failures; malformed/schema-invalid output fails without retry.
`new DecisionAI(model)` ([source](decision.ts)) requires an SDK decision-model instance supporting boolean and choice questions.
It scores with the passing condition's `P(true)` and explains all nonblank source lines in one multi-question call.
Explanations preserve original failing lines and the score, without generated reasons; injected provider request limits still apply.
Both implementations forward optional request `reasoning`; neither wires a default provider.

`AiConfig.system` overrides the operation's shared default in [`prompts.ts`](prompts.ts); an empty string removes it.
DecisionAI retains native explanation criteria and fragment IDs with system overrides.
[`StubAI`](stub.ts) remains a WIP default: random `0.1`/`0.9` scores and empty failures preserving the supplied score.
The package root exports `AI` and schemas/types; concrete classes require direct source imports.
