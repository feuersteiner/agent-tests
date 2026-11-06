# AI directory

- `engines/index.ts`: abstract `AIEngine` owns readonly arrow-field `run` and `explain`, request/options/score validation, default prompts, blank-input explanations, unchanged scores, and exact-quote grounding. Shared provider settings resolve required environment keys synchronously. Keep runtime imports and re-exports of `AI`, `DecideAIEngine`, and `ReasonAIEngine` out of this module.
- `engines/decide.ts` and `engines/reason.ts`: exported named classes `DecideAIEngine` and `ReasonAIEngine` extend `AIEngine`, construct their SDK model once, and override only protected scoring/evidence hooks. `index.ts` exports the `AI` container, eagerly constructing one `decide: AIEngine` and one `reason: AIEngine`. This dependency direction avoids ESM initialization cycles. No separate AI validation helper or service interface.
- Keep each AI TypeScript file at 75 physical lines or fewer, aiming for about 50; preserve readable formatting and exported prompt text.
- Both members expose `run(request, options?)` for passing-condition scores in `[0, 1]` and `explain(request, score, options?)` using the same model without rescoring. Validate requests/options, preserve scores, and require exact quotes.
- `types.ts`: shared schemas and `AiSettings` provider config; use inferred operation types or type-import `AI` from `index.ts` in callers. Never import root feature contracts here. Repository config validation stays in `config/validate.ts`.
- `prompts.ts`: shared defaults; `AiConfig.system` overrides the operation's default, including an explicit empty string.
- Decision APIs are OpenAI or Jev; reasoning APIs are OpenAI chat or Anthropic. Use pinned SDKs directly; Clef is deferred.
- `AgentTest` shares one configured `AI` instance between trigger and check; independent runs may use different config.
