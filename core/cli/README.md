# CLI

The `agent-tests` core package includes a TypeScript CLI that requires Bun.
From the repository root:

```sh
bun install --ignore-scripts --frozen-lockfile --linker=hoisted
./node_modules/.bin/agent-tests
./node_modules/.bin/agent-tests --help
```

Clinguini generates help with the existing logo, shown with no arguments or
`--help` (`-h`). Invalid input exits nonzero. Commands are not implemented yet.

The CLI owns file I/O, environment loading, and Git selection. Pure YAML parsing
lives in [`parse.ts`](../src/config/parse.ts); `validateTest` and `validateConfig`
live in [`validate.ts`](../src/config/validate.ts). Config covers required decision
and reasoning provider models, stage thresholds, and optional check reasoning.
`validateConfig` checks provider URLs; shared AI resolves required environment keys.
