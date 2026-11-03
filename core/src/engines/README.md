# Engines

`Engine<Params>` defines the shared abstract engine API. Its public async
`run(input, params)` returns a `Promise<number>` with a finite score in `[0, 1]`.
`ScoreSchema` validates that range; `Score` is its inferred TypeScript type.
All three exports are available from `agent-tests`.

Extend `Engine<Params>` with a protected readonly `paramsSchema: z.ZodType<Params>`
and a protected `score(input, params): Promise<number>` implementation. `run`
validates params with Zod, passes the parsed params (including normalization) to
`score`, then validates the returned score. Invalid params prevent scoring.
Validation failures and underlying scoring errors reject the returned promise.

`run` is a `public readonly` async function property. TypeScript prevents
reassignment; subclasses can still override it.

Concrete fast, smart, and deep engines remain WIP.
