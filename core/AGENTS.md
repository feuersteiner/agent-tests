# core agent guide

## Module boundaries

- Feature modules must not import each other's implementation/runtime code; `check` and `trigger` stay independent.
- Reusable cross-module code belongs in `core/src/shared/`, including AI and Source, and must be imported from there.
- Existing `core/src/types/` imports remain shared schema/type contracts; preserve these contracts without duplicating them.
- Imports within a feature, external packages, and Node builtins are outside this restriction.
