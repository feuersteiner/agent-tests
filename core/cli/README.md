# Command line

The Node CLI parses arguments, calls the public library entry, and presents results.

`index.ts` calls `runCommand`, which calls `parse` then `execute`. Parsing does no I/O;
execution imports library behavior only through `agent-tests`. Query, evaluation,
library, and workspace stages present the corresponding public API results.

Arguments and supported flags are validated before dispatch. JSON includes only
public outcomes; loaded environment variables and model configuration stay private.
Skipped model work remains visible in text and JSON. Usage/runtime failures exit 2,
findings and eval disagreements exit 1, and completed successful operations exit 0.

Build with `bun run --cwd core build`; run the built entry with
`node core/dist-cli/index.js --help` from the repository root.
