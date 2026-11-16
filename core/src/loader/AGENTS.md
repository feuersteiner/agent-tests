# loader agent guide

Pipeline `file -> text -> YAML -> schema`: `test/` and `config/` each hold exactly `load.ts` (file -> text), `parse.ts` (text -> YAML), and `validate.ts` (YAML -> schema, plus the rules the schema cannot express); each stage calls the next.
Only `load.ts` touches disk. `parse` and `validate` take text and values, never files or paths, so they stay usable as a library.
`helpers/` holds only `yaml.ts`, `file.ts`, `issues.ts`, and `patterns.ts`; a new helper file needs a one-word name. `index.ts` is the single import for every stage, and `types.ts` holds the `test.yaml`, `eval.yaml`, and config schemas and their types. Add no other files here.
