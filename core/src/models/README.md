# Models

Inject `DecisionModel` into triggers and checks. `createMockModel` provides deterministic offline
answers; `createAiDecisionModel` wraps an AI SDK language model and validates structured output.
Check responses use fail for violations and pass for compliant content. Trigger responses use
pass for selected files. Confidence is the probability of a violation. Provider failures become
sanitized operational errors, never a passing decision.
