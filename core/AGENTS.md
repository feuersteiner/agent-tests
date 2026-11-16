# core agent guide

## Layout

- `index.ts`: the package's public runtime exports; nothing inside `src/` or `cli/` imports it.
- `types.ts`: the package's public type exports; type-only.
- `cli/index.ts`: command dispatch and help.
- `cli/commands/`: `validate`, `run`, and stubs for `init`, `compile`, `list`, and `eval`.
- `cli/helpers/error.ts`: the message of a thrown value, shared by the commands.
- `cli/config/banner.ts`: CLI banner.
- `src/AGENTS.md`: the rules every `src/` module follows; only the loader validates.
- `src/index.ts`: the `AgentTests` class, the main class and the entry for everything, built from the full config with the engines and one scope, select, assert, and eval orchestrator as private members; `run(scope, id?)` loads the Tests through the loader, scopes the sources once, runs each Test's select then assert one Test after another, and returns each Test with its findings; `eval(id?)` loads the Tests and their evals through the loader, runs each Test's evals one after another, and returns each Test with each eval's expected and actual outcome and findings; these are its only public members; not a barrel.
- `src/types.ts`: the shared building-block schemas; imports nothing from the package.
- `src/loader/`: loads, parses, and validates `test.yaml`, `eval.yaml`, and `agent-tests.config.yaml`, three files per folder, and owns their schemas in `types.ts`; layout locked in its `AGENTS.md`.
- `src/engines/`: the glob, grep, decide, and reason engines; each scores an input against criteria. `index.ts` is the single import; rules locked in the folder's `AGENTS.md`.
- `src/sources/`: file, directory, and in-memory sources, each with a logical path, a kind, and lazily cached text content. `index.ts` is the single import.
- `src/scope/`: a `ScopeOrchestrator` built once from the config's `ignore` globs, whose `run(scope)` asks Git for the files (all tracked and untracked non-ignored files, or only those changed, staged, or differing from a base ref), drops the ones matching `ignore`, and returns them with their ancestor directories as sources; requires a Git repository. Its `runFolder(folder)` does the same for every file under a folder taken as the repository root, without Git. `index.ts` is the single import.
- `src/select/`: a `SelectOrchestrator` built once from the engines and the config's `select` section, whose `run(select, sources)` returns the sources a Test inspects, running the Test's `select` filters in order (glob, grep, decide) on all sources concurrently and reading content only when grep or decide is reached. `index.ts` is the single import.
- `src/assert/`: an `AssertOrchestrator` built once from the engines and the config's `assert` section, whose `run(assert, sources)` returns a finding for each source and assertion that fails, escalating grep, decide, reason and stopping at the first stage that clears the source. `index.ts` is the single import.
- `src/eval/`: an `EvalOrchestrator` built once from the scope, select, and assert orchestrators, whose `run(test, eval)` scopes the eval folder as the root without its `eval.yaml`, runs the Test's select then assert, and returns the eval with its actual outcome (`skip` when nothing is selected, `fail` on a finding, else `pass`), `matches` (whether actual equals expected), and findings; logs ✓ for a match and ✗ otherwise. `index.ts` is the single import.

Status: the `version: 1` format, the config file, `validate`, the engines, the sources, the scope, the select, assert, and eval orchestrators, and `AgentTests`, which builds and coordinates them, exist; `run` calls `AgentTests`. Other commands print that they are not implemented yet.
