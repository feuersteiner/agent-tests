# Library installs

Install, refresh, list and remove library tests through the published API.

`addTest` pins a catalog commit, validates the two rule files, runs their actual
examples and prints the compilation brief. Only `TEST.md` and `test.yaml` are
copied; local provenance records the commit and original hashes. Voters are never
installed. Eval failures remain explicit in the operation result.

`updateTests` preserves edited files and tests removed upstream. `removeTest`
refuses edited or unmanaged copies, including directories containing extra files.
Nested owners are supported; symlink paths and paths outside the project fail.

The default transport uses an isolated temporary Git catalog through the existing
HTTPS authentication. An explicit absolute `library.repository` path supports
local Git catalogs without network access. `LibraryOptions.transport` accepts
deterministic fixtures.
Missing model credentials preserve explicit skipped eval outcomes.
