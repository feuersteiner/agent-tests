# core agent guide

## Module boundaries

- Feature modules must not import each other's implementation/runtime code; `check` and `trigger` stay independent.
- Reusable cross-module code belongs in `core/src/shared/` and must be imported from there, with these exceptions:
  - AI at `core/src/ai/` is a temporary exception until the user authorizes moving it to shared. Do not move AI or create the shared directory now.
  - Existing `core/src/types/` imports remain shared schema/type contracts; preserve these contracts without duplicating them.
- Imports within a feature, external packages, and Node builtins are outside this restriction.
