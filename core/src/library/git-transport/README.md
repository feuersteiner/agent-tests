# Git catalog transport

`gitLibraryTransport.open(repository, ref)` calls the entry's `openCatalog`
orchestration function. `remoteSource` validates the ref and resolves an absolute
local repository or GitHub owner/repository identity. A new temporary directory
is passed to `initializeCatalog`, which runs bare init/fetch through `git`, pins
FETCH_HEAD's exact commit, and lists valid library directory ids.

The returned catalog binds `readTest` to this directory/commit/id snapshot and
`closeCatalog` to cleanup. `readTest` validates the requested id and calls
`readCatalogFile` for TEST.md and test.yaml; only regular Git file modes are read.
The commit remains fixed if the remote branch later advances. The caller must
call close after successful open; open removes temporary files if setup fails.
Git failures reject with a credential-free message and never modify project
remotes. Local fixture repositories exercise this workflow without networking.
