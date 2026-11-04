# Check

Check orchestration remains pending; scoring engines live in [`engine/`](engine/).

[`Engine<Params>`](engine/index.ts) exposes readonly `run(input, params): Promise<number>`.
It validates params with Zod and returns a raw, finite score in `[0, 1]`.
Validation, regex, and AI errors reject the promise.

[FastEngine](engine/fast.ts) uses local, case-sensitive JavaScript regexes without flags.
`match` and `maybe` accept nonempty strings or nonempty arrays of nonempty strings; at least one is required.
All patterns compile before matching; each list contains alternatives.
A `match` hit scores `1` with priority, a `maybe` hit scores `0.5`, otherwise `0`.

[SmartEngine](engine/smart.ts) and [DeepEngine](engine/deep.ts) require constructor-injected [AI](../ai/README.md).
The caller configures providers; `ask` is a nonblank passing condition. Both return raw AI scores.
Smart forwards only `{ input, ask }`; optional `bounds` are two increasing numbers in `[0, 1]`.
Smart neither forwards nor applies bounds; interpretation belongs to check execution.
Deep forwards `input`, `ask`, and optional `reasoning` (`low`, `medium`, `high`; no default), with no bounds.

Engine classes, params schemas/types, `ScoreSchema`, and `Score` export from `agent-tests`.
