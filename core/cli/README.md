# CLI

The Node executable validates, runs, and evaluates installed tests and manages community installations.

Build with `bun run --cwd core build`, then run `node core/dist/cli/index.js --help`.
YAML parsing and Git selection stay here; definition validation stays in the library.

- `args.ts` rejects unsupported commands, options, and combinations before I/O.
- `config.ts` loads `.env` without overriding real variables and reads the model config.
- `discover.ts` finds scoped `.agents/tests/<id>/` definitions and checks source hashes.
- `files.ts` supplies working, staged, or committed snapshots; `--base` reads trusted config.
- `run.ts` assembles library calls, and `report.ts` emits text or JSON with 0/1/2 exit codes.
- `library/` reads a pinned bare catalog, publishes complete installations, and opens vote PRs.

See the root [README](../../README.md) for configuration and examples.
