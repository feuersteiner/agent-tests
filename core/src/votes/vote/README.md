# Vote decisions

`voteTest` validates inputs, reads state, resolves the requested vote, then applies it.

1. `prepareVote` validates the ID, repository and mutually exclusive direction options.
2. `readVoteState` reads the immutable main snapshot and the author's pending PR.
3. `decideVote` resolves explicit up/down or toggling, returning immediately if unchanged.
4. `applyVoteDecision` closes an obsolete pending PR; `openVote` runs only if needed.

Reads and decisions never write. Failed mutations propagate; an already closed PR remains
closed. The public entry is `index.ts`; decision and transport steps are internal.
