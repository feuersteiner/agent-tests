# Library update stage

`updateTests(root, id?, options?)` canonicalizes the project root, then calls
`discoverInstalled` to select managed-copy candidate directories. An absent
explicit id rejects; no candidates returns an empty result without opening Git.

`withCatalog` opens one pinned catalog and invokes `updateInstalled`, which calls
`updateOne` serially. Each copy passes `testDirectory` and `readManagedSnapshot`
checks. Edited/unmanaged copies, changed catalog settings, and missing remote ids
produce preserved/skipped results. A matching commit produces unchanged status.

For a newer commit, `updateOne` calls `prepareTest`, `libraryBrief`, `createSource`,
and `writeTest`. Publication rechecks the canonical target and original snapshot
fingerprint so concurrent edits are retained. Results retain the real eval exit
code (0 expected outcomes, 1 mismatches, 2 errors). Unsafe paths, invalid remote rules, catalog
reads, or publication failures reject; `withCatalog` always closes its snapshot.
