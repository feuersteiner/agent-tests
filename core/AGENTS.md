# core agent guide

## Module boundaries

- YAML parsing and Git file selection belong to `core/cli/`; workflow-definition validation belongs to the main library `Validator` in `core/src/validator.ts`. The library must not import CLI code or run Git; the CLI passes sources in.
- Feature modules must not import each other's implementation/runtime code; `check` and `trigger` stay independent.
- Composition root exception: the future AgentTests facade may assemble source/trigger/check/eval modules. Features must never import the facade or use its barrel to bypass feature boundaries.
- Reusable cross-module code belongs in `core/src/shared/`, including AI, Source, and base schemas, and must be imported from there.
- `core/src/types.ts` owns `AgentTestSchema` and re-exports the public contracts. It imports feature contracts, so features must never import it; doing so creates a circular import that crashes at load.
- The eval runner receives `TestsTrigger` and `TestsCheck` instances; `core/src/evals/` only imports their types.
- FilterSchema and FilterConfig live in `core/src/trigger/types.ts`; trigger filters use AND semantics and always run as glob, grep, then ask. Keep `core/src/types.ts`, root exports, and the package `./types` subpath stable. Other contracts may move beside their owning modules later.
- Imports within a feature, external packages, and Node builtins are outside this restriction.
