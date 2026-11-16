# src agent guide

Validation is the loader's job and only the loader's: `src/loader/` validates test files and config, and every other folder here, including folders added later, receives clean, typed values and trusts them.
Outside the loader, never validate inputs, arguments, or a module's own config: no Zod `parse` or `safeParse`, no type guards, no defensive checks on arguments.
If a value can reach a module wrong, fix the loader, not the module.
The main components are orchestrators, each in a folder named by its verb: `scope/`, `select/`, and `assert/` now, `eval/` to follow; new stages follow this pattern.
`src/index.ts` holds `AgentTests`, the main class and the entry for everything: built from the full config, it builds the engines and one `ScopeOrchestrator`, `SelectOrchestrator`, and `AssertOrchestrator`, keeps them as private members, and coordinates them; it loads Tests through the loader; its public members are `run(scope, id?)` now and `eval` later, nothing else; it is not a barrel.
The folder's `index.ts` exports a `<Verb>Orchestrator` class built once from the engines and/or its config section, whose `run(...)` receives the Test's block (or the run's scope) and the sources; its `types.ts` holds `<Verb>Schema` / `AgentTest<Verb>` and `<Verb>ConfigSchema` / `AgentTest<Verb>Config` where a schema exists.
Orchestrators keep no per-Test state and decide engine order, early stopping, and thresholds; engines only score.
Orchestrators never walk the file system or call Git, except the scope orchestrator, the only one that does (it lists the scope's files from Git, or an eval folder's files from disk, then applies `ignore`).
`src/types.ts` holds only the shared building blocks and imports nothing from this package; each folder owns its types and schemas in its own `types.ts` and may import the shared ones.
`assert/types.ts` owns `AgentTestResult`.
Public re-exports live outside `src/`, in `core/index.ts` and `core/types.ts`; nothing in `src/` re-exports another folder's names.
The whole `test.yaml` and config schemas live in `src/loader/types.ts` because only the loader validates with them.
Never make `src/types.ts` import from a folder (a circular import that fails at load time); exported names keep the `AgentTest*` prefix.
