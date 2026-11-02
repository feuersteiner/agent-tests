# Opening a vote

`openVote` creates a score-only vote PR from a validated, pinned main snapshot.

1. `writableRepository` chooses writable upstream or creates/reuses and verifies the voter's fork.
2. `writeVote` creates a unique ref at the pinned commit and writes the author-only CSV change.
3. `createPullRequest` opens the PR against the source default branch and parses its URL.

No local Git checkout is changed. Transport and URL parsing failures propagate without
rollback: a fork, ref, commit or PR created before a later failure may remain remotely.
