# AI directory

- `index.ts`: abstract `AI`; validated `run` and `explain`, preserved scores and exact quotes.
- `types.ts`: Zod request, config, score, and explanation contracts.
- `prompts.ts`: shared defaults; `AiConfig.system` overrides the operation's default.
- `reasoning.ts`: `ReasoningAI`, structured output with an injected SDK language model.
- `decision.ts`: `DecisionAI`, native scoring and fragment decisions with an injected SDK model.
- `stub.ts`: WIP Stub default; random scores.
