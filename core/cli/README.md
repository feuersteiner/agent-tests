# Command line

The Node CLI parses arguments, calls the public library entry, and presents results.

`index.ts` calls `runCommand`, which calls `parse` then `execute`. Parsing does no I/O;
execution imports library behavior only through `agent-tests`. Command handlers are WIP
until their implementation issues land. Help and version work; stubs exit 2.

Build with `bun run --cwd core build`; run the built entry with
`node core/dist-cli/index.js --help` from the repository root.
