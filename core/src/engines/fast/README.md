# Fast engine

`FastEngine` matches input text against JavaScript regex patterns without flags.

```ts
import { FastEngine } from 'agent-tests';
import type { FastEngineParams } from 'agent-tests';

const engine = new FastEngine();
const params: FastEngineParams = {
	match: ['gonna', 'wanna'],
	maybe: 'hey'
};
await engine.run('We are gonna ship.', params); // 1
await engine.run('hey there', params); // 0.5
await engine.run('Formal copy.', params); // 0
```

Params require at least one of `match` or `maybe`.
Each accepts a nonempty string or nonempty array of nonempty strings. Patterns
within a list are alternatives. A `match` hit returns `1`, taking priority over
`maybe`; a `maybe` hit returns `0.5`; otherwise the score is `0`.
`FastEngineParamsSchema` and its inferred `FastEngineParams` type are exported
from `agent-tests`.

`FastEngineParamsSchema` reuses the shared `FastCheckSchema` directly.
Patterns are case-sensitive and used as written.

Inherited `run` validates params before scoring. All patterns in both lists are
compiled before matching, so an invalid regex rejects even after an earlier
pattern could match. Validation and pattern compilation failures reject the
returned promise. The engine performs no file IO or pipeline orchestration.
