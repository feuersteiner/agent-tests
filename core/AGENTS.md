# core agent guide

## Layout

- `cli/index.ts`: command dispatch and help.
- `cli/commands/`: `validate`, and stubs for `init`, `compile`, `list`, `eval`, and `run`.
- `cli/config/banner.ts`: CLI banner.
- `src/types.ts`: schemas for `test.yaml` at `version: 1` and `agent-tests.config.yaml`, and the shared types.
- `src/loader/`: loads, parses, and validates `test.yaml` and `agent-tests.config.yaml`, three files per folder; layout locked in its `AGENTS.md`.

Status: the `version: 1` format, the config file, and `validate` exist. Other commands print that they are not implemented yet.
