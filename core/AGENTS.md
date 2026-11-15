# core agent guide

## Layout

- `index.ts`: the package's public runtime exports; nothing inside `src/` or `cli/` imports it.
- `types.ts`: the package's public type exports; type-only.
- `cli/index.ts`: command dispatch and help.
- `cli/commands/`: `validate`, and stubs for `init`, `compile`, `list`, `eval`, and `run`.
- `cli/config/banner.ts`: CLI banner.
- `src/AGENTS.md`: the rules every `src/` module follows; only the loader validates.
- `src/types.ts`: the shared building-block schemas; imports nothing from the package.
- `src/loader/`: loads, parses, and validates `test.yaml` and `agent-tests.config.yaml`, three files per folder, and owns their schemas in `types.ts`; layout locked in its `AGENTS.md`.
- `src/engines/`: the glob, grep, decide, and reason engines; each scores an input against criteria. `index.ts` is the single import; rules locked in the folder's `AGENTS.md`.
- `src/sources/`: file, directory, and in-memory sources, each with a logical path, a kind, and lazily cached text content. `index.ts` is the single import.
- `src/selector/`: a `Selector` built per Test whose `run(sources)` returns the sources that Test inspects, running its `select` filters in order (glob, grep, decide) on all sources concurrently and reading content only when grep or decide is reached. `index.ts` is the single import.

Status: the `version: 1` format, the config file, `validate`, the engines, the sources, and the selector exist; nothing calls them yet. Other commands print that they are not implemented yet.
