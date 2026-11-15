# src agent guide

Validation is the loader's job and only the loader's: `src/loader/` validates test files and config, and every other folder here, including folders added later, receives clean, typed values and trusts them.
Outside the loader, never validate inputs, arguments, or a module's own config: no Zod `parse` or `safeParse`, no type guards, no defensive checks on arguments.
If a value can reach a module wrong, fix the loader, not the module.
Types and schemas live in `src/types.ts` with `AgentTest*` names.
