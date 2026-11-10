# Standalone fixture repository

Run `bun run demo` from the workspace root. It invokes all CLI commands against
`repository/`, which contains a valid YAML config, one agent-test definition,
and a clean TypeScript source. `run` executes the TODO rule; `eval` verifies
its pass/fail/skip examples.

Interactive runs show each upcoming command and wait for Enter. Ctrl+C stops the
demo; redirected runs continue without pauses. A dummy provider key is supplied;
regex-only fixtures make no AI calls.

`init`, `add`, `targets`, `compile`, `docs`, and `vote` remain explicitly labelled
scaffolds. Git scope flags currently run the full source set.
