# AI directory

- `index.ts`: abstract `AI`; validated `run` and `explain`, preserved scores and exact quotes.
- `types.ts`: Zod request, config, score, and explanation contracts.
- `prompts.ts`: shared defaults; `AiConfig.system` overrides the operation's default.
- `reasoning.ts`: `ReasoningAI`, structured output with an injected SDK language model.
- `decision.ts`: `DecisionAI`, native scoring and fragment decisions with an injected SDK model.
- `models.ts`: build OpenAI or Jev decision providers and OpenAI or Anthropic reasoning providers from validated config; resolve required environment keys.
- `stub.ts`: retained for step 9; random scores, unused by AgentTest.
