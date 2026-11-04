# YAML parser

`parseTestYaml(text)` parses one YAML document. `parseTestDefinition(value)`
validates an already decoded value. Both run synchronously and return `AgentTest`
or throw an `Error` containing field paths or YAML line/column information.

```ts
import { readFileSync } from 'node:fs';
import { parseTestDefinition, parseTestYaml } from 'agent-tests';
import { AgentTestSchema } from 'agent-tests/types';
import type { AgentTest } from 'agent-tests/types';

const text = readFileSync('library/no-informal-english/test.yaml', 'utf8');
const test: AgentTest = parseTestYaml(text);
parseTestDefinition({ ...test, title: 'Formal public copy' });
AgentTestSchema.safeParse(test); // Direct Zod validation without throwing.
```

File reading in this example belongs to the caller: the parser accepts strings
and performs no file IO. `AgentTest` is inferred from `AgentTestSchema`; shared
schemas and their inferred types live in `src/types/`, exported through `index.ts`
and the `agent-tests/types` package entry point.

The contract follows the repository README and community reference test. Unknown
fields, empty filters/stages, repeated check IDs, and duplicate YAML keys fail.
`evals` is required and may be empty; example content may be an empty string.
`Eval.expect` uses `TestOutcome`: `'pass' | 'fail' | 'unsure' | 'skip'`.
`source`, when present, must be a `sha256:` digest. Bounds must increase within
`[0, 1]`. Test and check IDs use lowercase kebab-case. Strings and key ordering
are preserved, including written trigger and filter order, without defaults or
execution.
