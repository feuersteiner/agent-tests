# Library installs

Install, refresh, list and remove library tests through the published API.

`addTest` pins a catalog commit, validates the two rule files, runs their actual
examples and prints the compilation brief. Only `TEST.md` and `test.yaml` are
copied; local provenance records the commit and original hashes. Voters are never
installed. Eval failures remain explicit in the operation result.

`updateTests` preserves edited files and tests removed upstream. `removeTest`
refuses edited or unmanaged copies, including directories containing extra files.
Nested owners and symlink project roots are supported; symlinks below that root
and paths outside the canonical project fail.

The default transport uses an isolated temporary Git catalog through the existing
HTTPS authentication. An explicit absolute `library.repository` path supports
local Git catalogs without network access. `LibraryOptions.transport` accepts
deterministic fixtures.
Missing model credentials preserve explicit skipped eval outcomes.

## Function calls

`addTest` canonicalizes root, checks `testDirectory`, and enters `withCatalog`.
It reads the pinned test, calls `prepareTest` for isolated validation/evaluation,
creates an owner-relative `libraryBrief`, and publishes through `writeTest` using
`createSource` provenance. The write callback rechecks the target before publish.

[`updateTests`](update/README.md) discovers installed owners and updates each copy
against one catalog. `removeTest` uses `testDirectory` and `readManagedSnapshot`
before deleting an unchanged copy. `listRemoteTests` uses `withCatalog` to return
sorted unique ids and the pinned commit. No voters are read or installed.

[`gitLibraryTransport`](git-transport/README.md) owns temporary Git snapshots.
`utils.ts` owns shared path checks, provenance hashes and safe snapshot reads;
`types.ts` owns library contracts including `CatalogContext`. `index.ts` remains
the public API barrel. Catalog, validation and filesystem failures reject; normal
skip/unchanged outcomes and eval exit codes remain explicit in returned results.
