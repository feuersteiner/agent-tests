# Candidate selection

`collectCandidates(path, scope)` calls `prepareCandidates` to validate the scope,
canonicalize the root and absolute filters, and select Git or filesystem paths.
`readCandidates` filters paths and calls `readContent` for each eligible file.
Staged reads use literal Git pathspecs and index contents; other scopes use
contained real working files. Binary contents are omitted. This stage never writes.
`utils.ts` owns scope validation, absolute-filter normalization, and matching.
