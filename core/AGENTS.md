# core agent guide

## Layout

- `cli/index.ts`: command dispatch and help.
- `cli/commands/`: `validate`, and stubs for `init`, `compile`, `list`, `eval`, and `run`.
- `cli/config/banner.ts`: CLI banner.
- `src/AGENTS.md`: the rules every `src/` module follows; only the loader validates.
- `src/types.ts`: schemas for `test.yaml` at `version: 1` and `agent-tests.config.yaml`, and the shared types.
- `src/loader/`: loads, parses, and validates `test.yaml` and `agent-tests.config.yaml`, three files per folder; layout locked in its `AGENTS.md`.
- `src/engines/`: the glob, grep, decide, and reason engines; each scores an input against criteria. `index.ts` is the single import; rules locked in the folder's `AGENTS.md`.
- `src/sources/`: file, directory, and in-memory sources, each with a logical path, a kind, and lazily cached text content. `index.ts` is the single import.

Status: the `version: 1` format, the config file, `validate`, the engines, and the sources exist; nothing calls the engines or the sources yet. Other commands print that they are not implemented yet.
