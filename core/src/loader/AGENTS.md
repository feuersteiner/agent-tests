# loader agent guide

Pipeline `file -> text -> YAML -> schema`: `test/`, `eval/`, `config/`, and `security/` each hold exactly `load.ts` (file -> text), `parse.ts` (text -> YAML), and `validate.ts` (YAML -> schema, plus the rules the schema cannot express); each stage calls the next.
Only `load.ts` touches disk. `parse` and `validate` take text and values, never files or paths, so they stay usable as a library.
`helpers/` holds only `yaml.ts`, `file.ts`, `issues.ts`, and `patterns.ts`; a new helper file needs a one-word name. `index.ts` is the single import for every stage, and `types.ts` holds the `test.yaml`, `eval.yaml`, config, and `agentests.security.yaml` schemas and their types.
`security/validate.ts` is the safety gate of the security runner: it rejects any target or detection host outside `LOCAL_HOSTS` and `safety.allowed_hosts`, credentials in URLs, request totals over `safety.max_requests`, and a production target unless both `safety.allow_production` and the caller's `allowProduction` option (the `--allow-production` flag) say so. Add no other files here.
