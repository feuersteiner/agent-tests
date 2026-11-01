# Votes

`voteTest` opens one pull request changing only the authenticated user's row in a library score.

The default toggles the effective vote, including a pending vote PR. `up` and `down` are
idempotent. Toggling back to the main-branch state closes the pending PR. Every read is pinned
to one main commit. GitHub API commits avoid changing the local repository. Users without
upstream write access use their own verified fork. A malformed score file is rejected, as are
executable files, symlinks, and incomplete Git metadata for an existing score.

The GitHub CLI must already have access to the repository. `GhRunner` provides an injectable
transport for tests; credentials never belong in options, output, or configuration files.

`planMaintainerSetup` reads repository settings and proposes missing security labels,
required library checks, at least one review, auto-merge, and Actions review permissions.
`applyMaintainerSetup` performs these writes only when explicitly invoked. Existing check
bindings, stronger review counts, branch restrictions, bypass identities, and workflow token
permissions are preserved. Concurrent protection changes require a new plan.

The trusted `Library score` workflow validates an exact one-row author-only change before
approving its specific head commit and enabling auto-merge. Both old and new CSV entries must
be nonexecutable regular Git blobs; a vote cannot change file modes. Pull request code is never run.
