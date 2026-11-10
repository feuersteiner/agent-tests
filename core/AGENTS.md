# core agent guide

## Module boundaries

- `core/src/config/parse.ts` owns pure YAML parsing with `parseYaml`. `validate.ts` owns test-definition and repository-config validation through `validateTest`, `validateTests`, and `validateConfig`, sharing generic `validate(value, schema)` for schema output. Duplicate test/check-ID and grep-regex mechanics belong here, not in schema declarations. `config/index.ts` reads and validates the YAML config. Definition/source discovery, environment loading, and Git selection belong to `core/cli/`. Filesystem-backed sources in `core/src/shared/sources/` own lazy file and directory reads. The library must not import CLI code or run Git; the CLI passes sources in.
- Configuration boundary exception: `core/src/config/validate.ts` may import root test schemas from `core/src/types.ts`. Root types re-export the declarative config schema/type from `config/types.ts`; neither root types nor features may import validation or parsing implementations. Config covers required decision/reasoning provider models, stage thresholds, and optional check reasoning; URL policy checks belong in `validateConfig`. Shared AI constructs providers and resolves environment keys from validated config.
- Feature modules must not import each other's implementation/runtime code; `check` and `trigger` stay independent.
- Composition root exception: the `AgentTests` class in `core/src/index.ts` may assemble source/trigger/check/eval modules. Its constructor validates all definitions and shared config without creating AI; execution lazily caches one shared AI and creates fresh stages per test on each call, each selecting from the original sources. Features must never import it or use its exports to bypass feature boundaries.
- Reusable cross-module code belongs in `core/src/shared/`, including AI, typed sources, and base schemas, and must be imported from there.
- `core/src/types.ts` owns `AgentTestSchema` and re-exports the public contracts. It imports feature contracts, so features must never import it; doing so creates a circular import that crashes at load.
- The eval runner receives `TestTrigger` and `TestCheck` instances; `core/src/evals/` only imports their types.
- FilterSchema and FilterConfig live in `core/src/trigger/types.ts`; trigger filters use AND semantics and always run as glob, grep, then ask. Keep `core/src/types.ts`, root exports, and the package `./types` subpath stable. Other contracts may move beside their owning modules later.
- Imports within a feature, external packages, and Node builtins are outside this restriction.
