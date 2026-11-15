# engines agent guide

Engines follow the no-validation rule in `src/AGENTS.md`. The structured-output schema the reason engine passes to the AI SDK to request a score is a request format, not validation.

Every engine is an `AgentTestEngine` from the folder's own `types.ts`, built by a factory: `createGlobEngine` in `glob.ts` gets a path and returns 1 or 0, `createGrepEngine` in `grep.ts` gets text and returns an occurrence count, and `createDecideEngine` in `decide.ts` and `createReasonEngine` in `reason.ts` get text and return a score from 0 to 1.
A list of criteria is an OR: return the best result among the alternatives (any glob matching, the highest grep count, the highest model score).
Engines score what they are given. Engine order, early stopping, thresholds, and how many model calls to spend belong to the caller (the selector and the tests).
Return a bare number; richer metadata comes later, so do not add it yet.
`utils.ts` holds what the model engines share: `RUN_SYSTEM_PROMPT` and `providerSettings`, which reads the API key from its environment variable on an engine's first use. `index.ts` only composes `createEngines` and is the single import for the folder; no file here imports from it.
