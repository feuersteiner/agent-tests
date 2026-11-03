# agent-tests

Turn recurring code and business rules into reusable tests for people, agents, and CI.

An agent test pairs a plain-language `TEST.md` with a compiled `test.yaml`.
Triggers select files; checks report explained findings without changing those files.

## Develop from this checkout

The package is not published yet. Node.js 24 runs the library and CLI; Bun 1.3.4 manages the workspace.

```sh
bun install --frozen-lockfile
bun run build
node core/dist-cli/index.js --help
bun run check
bun run lint
bun run test
```

`core/` contains the published library and thin CLI. `docs/` is a static Svelte site.
[`library/`](library/README.md) contains community rules; [`docs/usecases.md`](docs/usecases.md)
explains situations where agent tests complement conventional tests.

## Local workflow

Install the package tarball into a project while publication is pending:

```sh
cd core
npm pack
# From the consuming project, npm install -D /path/to/agent-tests/core/agent-tests-0.0.1.tgz
```

The installed CLI provides these commands:

```sh
npx --no -- agent-tests init --hook         # config, tests directory, optional staged hook
npx --no -- agent-tests add no-informal-english
npx --no -- agent-tests compile no-informal-english
npx --no -- agent-tests validate no-informal-english
npx --no -- agent-tests eval no-informal-english
npx --no -- agent-tests targets no-informal-english
npx --no -- agent-tests run --changed
npx --no -- agent-tests run --staged
npx --no -- agent-tests run --base origin/main
npx --no -- agent-tests run src/            # selected paths; no scope means all candidates
npx --no -- agent-tests list
npx --no -- agent-tests list --remote
npx --no -- agent-tests update
npx --no -- agent-tests remove no-informal-english
npx --no -- agent-tests docs test-generator
npx --no -- agent-tests vote no-informal-english --up
```

`add <id> [targetDir]` installs a pinned library rule, records its provenance,
prints a compilation brief, and runs its evals. `update [id]` preserves local edits
and rules removed upstream. `remove <id> [targetDir]` protects modified files.

`compile` prints material for an agent; it does not run an agent or write compiled files.
The bundled generator skill explains the validate/eval correction loop.

## Rule format

`TEST.md` states the rule, examples, and exceptions. `test.yaml` names that source's
exact SHA-256 hash and declares triggers, checks, and labeled evaluation examples.
Unknown keys and stale source hashes fail validation.

Triggers combine path globs, content regexes, and model questions in written order.
Alternatives stop at the first passing trigger. Nested `.agents/tests/` directories
compound their owners' tests; `.agents/tests/config.yaml` can disable inherited tests.

Checks escalate through `fast` regexes, `smart` model confidence bounds, and `deep`
model judgment. Findings include the test, check, level, file, line, and correction.
An unresolved final judgment warns; `human-tiebreak` marks it for review. A full
human-review workflow remains WIP.

[`no-informal-english`](library/no-informal-english/TEST.md) is the deterministic
reference rule used by the contract tests. Evaluation outcomes are `pass`, `fail`,
`unsure`, and `skip`; missing model access is reported separately from expected skips.

## Models

Configuration lives in `agent-tests.config.yaml`; credentials stay in the process
environment or ignored `.env`. Existing environment values take precedence.

```yaml
model:
  provider: openai
  model: gpt-5-mini
  apiKeyEnv: OPENAI_API_KEY
```

The AI SDK adapter also accepts `provider: openai-compatible` with a `baseUrl`.
Tests inject mock models and make no paid requests. Without model credentials,
model-free triggers and fast checks still run; unresolved model work skips with warnings.

Library settings accept `repository` and `ref` under `library`; the default is
`feuersteiner/agent-tests` at `main`. An absolute local Git repository path supports
offline catalogs. Votes use the authenticated GitHub CLI and change only that user's row.

## Library and Vitest APIs

```ts
import { runTests } from 'agent-tests';

const result = await runTests(process.cwd(), { changed: true });
process.exitCode = result.exitCode;
```

`agent-tests/vitest` exports `agentTests()`, added to the top-level `plugins` in a
Vitest 5 configuration. It creates suites for installed tests and check-target pairs.
Errors fail, warnings annotate, and unavailable models or absent targets skip.
It defaults to uncommitted files locally and base-branch changes in CI; exact model
answers are cached during watch sessions. `init --vitest` adds this configuration;
`init --github` creates a full-history GitHub Actions workflow.

Commands support `--json`. Exit codes are 0 for successful checks, 1 for findings or
evaluation disagreements, and 2 for usage, configuration, or runtime failures.
GitHub CI receives annotations for findings.

## Contributing

Start with [`AGENTS.md`](AGENTS.md) and the binding [`library rules`](library/AGENTS.md).
Library contributions contain exactly one rule's `TEST.md` and `test.yaml`.
The trusted workflows screen rule content and validate author-only votes.
Maintainer setup helpers preserve existing branch protections; see
[`votes`](core/src/votes/README.md).

Documentation-site content, eval baselines, and model comparisons remain WIP.
Questions: [Discord](https://discord.gg/kESK4bgEPW).
License: [MIT](LICENSE).
