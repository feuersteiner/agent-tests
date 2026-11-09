# Select

Selection returns typed final targets through nested directory scopes.

- `types.ts`: required `SelectSchema`, recursive `SelectStepSchema`, and selection results/configuration.
- `scope.ts`: infer directory ancestors from flat paths and traverse matching scopes without opening file content.
- `filters.ts`: grep and AI predicates; true retains a source, false stops its branch.
- `index.ts`: `new TestSelect(select, config).run(sources)` returns results; `selected(result)` returns final targets once per path.

Root `type` is mandatory: `files` or `directories`. Filters use AND, run glob before grep before ask, and each accepts OR alternatives. A nested `where` runs relative to each selected directory. Empty branches stop; sibling branches continue. Checks receive the final typed sources.
