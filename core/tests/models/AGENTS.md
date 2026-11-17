# models fixture agent guide

A fixture repository, not a test suite: real Tests with evals in `.agents/tests/` that measure how accurately the configured models judge, using `agent-tests.config.yaml` (OpenAI, `gpt-6-luna` and `gpt-6-sol`, key in `OPENAI_API_KEY`).

- Each Test id starts with its set's prefix: `decide-` (how `decide` reads a criterion), `reason-` (multi-step judgments), or `flow-` (`select.decide` and escalation from grep to a model).
- `eval` and `run` here call paid models; only the owner runs them, through the root `bun run test:models`, which builds, then runs `eval` here on Node with the repository root `.env`.
- `validate` and `list` call no model and are safe: `node ../../dist/cli/index.js validate` from this folder.
- Everything under `.agents/` is sample data with deliberate violations: `bun test`, ESLint, Prettier, and `tsc` skip it. Keep every sample file inside `.agents/`; add no file next to this guide.
- Eval files named like an entry of `core/.gitignore` (`dist`, `out`, `logs`, `.env`) are not committed; pick other names.
