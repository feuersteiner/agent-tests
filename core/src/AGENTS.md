# src agent guide

Validation is the loader's job and only the loader's: `src/loader/` validates test files and config, and every other folder here, including folders added later, receives clean, typed values and trusts them.
Outside the loader, never validate inputs, arguments, or a module's own config: no Zod `parse` or `safeParse`, no type guards, no defensive checks on arguments.
If a value can reach a module wrong, fix the loader, not the module.
The main components are orchestrators, one per stage, each in a folder named by the stage's verb: `select/` and `assert/` now, `eval/` to follow; new stages follow this pattern.
Before the orchestrators, `scope/` builds the run's source list once (Git lists the target's files, then `ignore` is applied), so orchestrators receive sources and never walk the file system or call Git.
The folder's `index.ts` exports a `<Verb>Orchestrator` class built per Test from that Test's block, the engines, and the matching config section, whose `run(...)` does the stage's work; its `types.ts` holds `<Verb>Schema` / `AgentTest<Verb>` and `<Verb>ConfigSchema` / `AgentTest<Verb>Config`.
Orchestrators decide engine order, early stopping, and thresholds; engines only score.
`src/types.ts` holds only the shared building blocks and imports nothing from this package; each folder owns its types and schemas in its own `types.ts` and may import the shared ones.
Public re-exports live outside `src/`, in `core/index.ts` and `core/types.ts`; nothing in `src/` re-exports another folder's names.
The whole `test.yaml` and config schemas live in `src/loader/types.ts` because only the loader validates with them.
Never make `src/types.ts` import from a folder (a circular import that fails at load time); exported names keep the `AgentTest*` prefix.
