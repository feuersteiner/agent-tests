# Vote state reads

`readVoteState` prepares validated vote state without changing GitHub or a local checkout.

1. `readSnapshot` validates the authenticated login and pins the repository's main commit.
2. `readScore` checks that the test exists, calls `requireRegularScore` for existing CSV,
   decodes base64 and calls `scoreRows` to reject malformed or duplicate rows.
3. `readPending` selects exact vote titles owned by the authenticated login and rejects ambiguity.
4. `buildVoteState` combines these reads for the decision stage.

Missing tests, invalid identities, unsafe modes, incomplete trees and transport failures
reject before mutation. Score and directory reads use the same immutable commit.
