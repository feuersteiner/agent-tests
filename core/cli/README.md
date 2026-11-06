# CLI

The Bun CLI validates, runs, and evaluates installed tests and manages community installations.

Run `bun --no-env-file core/cli/index.js --help` from the repository root.
The CLI owns file I/O, environment loading, and Git selection. Pure YAML parsing
lives in `src/config/parse.ts`; test and config validation live in `src/config/validate.ts`.

- `args.ts` rejects unsupported commands, options, and combinations before I/O.
- `config.ts` loads `.env` without overriding real variables and reads the model config.
- `discover.ts` finds scoped `.agents/tests/<id>/` definitions and checks source hashes.
- `files.ts` supplies working, staged, or committed snapshots; `--base` reads trusted config.
- `run.ts` assembles library calls, and `report.ts` emits text or JSON with 0/1/2 exit codes.
- `library/` reads a pinned bare catalog, publishes complete installations, and opens vote PRs.

See the root [README](../../README.md) for configuration and examples.
