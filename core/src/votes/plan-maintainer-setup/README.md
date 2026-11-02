# Planning maintainer setup

`planMaintainerSetup` reads settings and prepares ordered requests without applying them.

1. `validateTarget` rejects malformed repository names before transport calls.
2. `readSettings` reads repository metadata, calls `readProtection`, and reads Actions
   workflow permissions and labels; protection 404 means an unprotected branch.
3. `buildPlan` selects missing labels, calls `protectionBody` to preserve stronger protection,
   then proposes auto-merge and Actions review permissions only when missing.

The returned snapshot and request payloads are consumed by `applyMaintainerSetup`.
Read and response parsing failures reject the plan; no writes occur in this stage.
