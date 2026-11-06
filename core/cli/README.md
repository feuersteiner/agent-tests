# CLI stub

The `agent-tests` core package includes this Hello World binary. From the repository root:

```sh
bun install --ignore-scripts --frozen-lockfile --linker=hoisted
./node_modules/.bin/agent-tests
```

The CLI owns file I/O, environment loading, and Git selection. Pure YAML parsing
lives in [`parse.ts`](../src/config/parse.ts); `validateTest` and `validateConfig`
live in [`validate.ts`](../src/config/validate.ts). Config currently covers stage
thresholds and optional check reasoning; PR #82 will add provider settings.
