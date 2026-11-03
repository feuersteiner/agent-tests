# Applying maintainer setup

`applyMaintainerSetup` performs an explicitly requested plan and rejects concurrent protection edits.

1. `validateTarget` checks the plan repository before remote access.
2. `requireUnchangedProtection` calls `readProtection` and compares stable fingerprints
   with the planning snapshot; a mismatch rejects before all settings writes.
3. `applyChanges` sends the planned operations serially and returns completed descriptions.

A failed write stops later operations and rejects the promise. Earlier successful writes
remain applied; there is no rollback or partial-success return value. Inspect settings and
prepare a fresh plan before retrying. No live settings requests belong in automated tests.
