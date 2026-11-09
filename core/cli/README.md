# CLI

The `agent-tests` core package includes a TypeScript CLI that requires Bun.
From the repository root:

```sh
bun install --ignore-scripts --frozen-lockfile --linker=hoisted
./node_modules/.bin/agent-tests
./node_modules/.bin/agent-tests --help
```

Clinguini generates help with the existing logo, shown with no arguments or
`--help` (`-h`), and per-command help. All commands have scaffolded dispatch;
functionality is pending. Each stub prints its command name, ID when supplied,
and parsed values with runtime types, then exits 0. Undefined values are omitted;
Clinguini supplies `false` for omitted boolean flags. Invalid arguments exit 2.

| Command         | Selection                                   |
| --------------- | ------------------------------------------- |
| `init`          | No ID                                       |
| `add <id>`      | Required exact ID                           |
| `list`          | No ID                                       |
| `validate [id]` | Optional exact ID; omission will select all |
| `targets <id>`  | Required exact ID                           |
| `compile <id>`  | Required exact ID                           |
| `eval [id]`     | Optional exact ID; omission will select all |
| `run [id]`      | Optional exact ID; omission will select all |
| `docs`          | No ID                                       |
| `vote <id>`     | Required exact ID                           |

`run` accepts `--changed` and `--staged` boolean flags and `--base <ref>`.
These selectors are only parsed; no selection or flag-combination semantics exist
yet. Clinguini rejects boolean values such as `--changed=false` with exit 2.
No `--all` is required.

```sh
agent-tests run --help
agent-tests validate user-text-french
agent-tests run --base main
```

For example, `agent-tests run example --changed --base main` prints:

```text
run example has been called, with params: [id: string = "example", changed: boolean = true, staged: boolean = false, base: string = "main"]
```

Stubs and help do not load test/config/env files, run Git, modify repositories,
or make network/model calls. The executable disables Bun's automatic dotenv
loading. When invoking source directly, use
`bun --no-env-file /path/to/core/cli/index.ts`.

The agreed layout is repository-root `.agents/tests/<id>/`, following the project
`.agents/skills/` convention, with unique IDs in that location. Root resolution and file loading are pending. Tests use
`select` and nested `where` steps to scope files and directories. There is no nested discovery,
inheritance, or parent-test opt-out design.

Test metadata accepts optional `tags: string[]`, including an empty array, without
defaults or tag filtering. Existing definitions can omit it.

The root `package.json` includes `{"scripts":{"test:agents":"agent-tests run"}}`.
Use `npm run test:agents` for all tests or
`npm run test:agents -- user-text-french` for one (`npm run test:agents [-- id]`).
Bun is required on `PATH`. The script currently prints the parsed `run` values
and exits 0; functionality is pending.

Future CLI implementation owns file I/O, environment loading, and Git selection. Pure YAML parsing
lives in [`parse.ts`](../src/config/parse.ts); `validateTest` and `validateConfig`
live in [`validate.ts`](../src/config/validate.ts). Config covers required decision
and reasoning provider models, stage thresholds, and optional check reasoning.
`validateConfig` checks provider URLs; shared AI resolves required environment keys.
