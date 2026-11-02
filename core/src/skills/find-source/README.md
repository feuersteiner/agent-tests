# Source lookup

`findSource(root, id)` finds one installed source without reading compiled YAML or writing files.

`prepareSearch` validates the id and canonicalizes the root. `collectSources` uses
discovery's `walkDirectories` exclusion policy, checks real `.agents/tests/id`
components with `isSourceDirectory`, then calls `readSource` for text and its exact
byte hash. `selectSource` rejects missing or ambiguous installations. Symbolic
directories are skipped; symbolic source files and filesystem failures are rejected.
