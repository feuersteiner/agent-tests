# Engines

[`Engine<Params>`](index.ts) exposes readonly async `run(input, params): Promise<number>`.
It validates and normalizes params with Zod before scoring, then requires a finite score in `[0, 1]`.
Invalid params, invalid scores, regex errors, and AI errors reject the promise.
Subclasses implement protected readonly `paramsSchema: z.ZodType<Params>` and `score(input, params)`.

[`FastEngine`](fast.ts) uses case-sensitive JavaScript regexes without flags.
`match` and `maybe` accept nonempty strings or nonempty arrays of nonempty strings; at least one is required.
Each list contains alternatives; all patterns compile before matching.
A `match` hit scores `1` with priority; a `maybe` hit scores `0.5`; otherwise `0`.

[`SmartEngine`](smart.ts) and [`DeepEngine`](deep.ts) require an injected [AI](../ai/README.md): `new SmartEngine(ai)` or `new DeepEngine(ai)`.
The caller configures providers; `ask` must be nonblank and describe the passing condition.
Smart forwards only `{ input, ask }`, preserving the raw AI score.
Optional Smart `bounds` are two increasing numbers in `[0, 1]`; the engine neither forwards nor applies them.
Bounds interpretation belongs to check execution.
Deep forwards `input`, `ask`, and optional `reasoning` (`low`, `medium`, or `high`, with no default).
Deep returns the raw AI score; its params have no bounds.

Each concrete engine's `*EngineParamsSchema` reuses its corresponding `*CheckSchema`.
`Engine`, `ScoreSchema`, `Score`, and all concrete engine classes, params schemas, and params types export from `agent-tests`.
