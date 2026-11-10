# Standalone fixture repository

Run `bun run demo` from the workspace root. Each numbered step describes the next
command, temporary change, and expected exit code, then waits for Enter in an
interactive terminal. Redirected runs continue without pauses.

The demo copies `repository/` to a temporary directory. It injects failing source
examples, removes required files, adds unexpected files and nested directories,
and restores each change in `finally`. Recovery commands verify that the original
sources pass again. Config failures and an incorrect eval label are also injected.
The temporary repository and local server are removed on completion, failure, or
Ctrl+C; the checked-in repository is never modified.

The repository contains 13 agent tests:

- `no-todo`: unfinished source markers.
- `no-debugging`: console logging and debugger statements.
- `component-structure`: exactly `component.svelte` and `types.ts`, including nested component folders.
- `payment-retries`: preserve idempotency keys after an incident (use case 1).
- `payment-copy`: French wording, charge status, next actions, and uncertainty (2).
- `documentation-contract`: documentation agrees with an included implementation excerpt (3).
- `shared-pricing`: reuse the pricing policy (4).
- `strategy-alignment`: respect a segment exit (6).
- `margin-policy`: preserve the required margin (7).
- `launch-promises`: keep customer promises aligned with launch dates (8).
- `customer-handover`: retain commitments and unresolved issues (9).
- `renewal-risk`: reflect a conditional renewal in forecasts (10).
- `brand-voice`: formal wording with an allowed internal-identifier exception.

Numbers refer to [`docs/usecases.md`](../../docs/usecases.md). Replaying all 48
labeled examples and deliberately introducing an incorrect label exercises the
evaluation workflow in use case 5. Examples include pass, fail, and skip outcomes;
glob/grep alternatives; trigger AND/OR; ask alternatives; and grep/ask escalation.

The local stub in `model/` implements only the SDK endpoints and answers needed
by these examples. It exercises the real decision/reasoning engines without
external calls or credentials. It does **not** validate semantic AI accuracy.
Unknown fixture prompts fail rather than receive a default passing answer. The
demo points the copied config at this server and supplies a dummy environment key.

Directory checks currently use `DirectorySource.open()` listings and `reason`;
their eval examples contain listing snapshots. No directory-operations grammar
has been added. The documentation example includes both facts in one source;
automatic cross-file context collection remains unimplemented.

`init`, `add`, `targets`, `compile`, `docs`, and `vote` remain explicitly labelled
scaffolds. Git scope flags are accepted but currently run the full source set.
