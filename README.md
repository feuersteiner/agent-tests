# agent-tests

Turn repository rules into repeatable checks with regexes, decision models, and reasoning models.

[![MIT license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

An agent test contains `TEST.md`, the rule in prose, and `test.yaml`, its executable
triggers, checks, and labeled examples. Checks report findings without editing sources.

## Configure

Use Bun to install and run `agent-tests`. The package ships TypeScript source;
library imports require Bun or tooling that compiles TypeScript dependencies.

```sh
bun add -D agent-tests
```

Create `agent-tests.config.yaml` at the project root:

```yaml
decision:
  api: openai
  url: https://api.openai.com/v1
  model: gpt-6-luna
  apiKeyEnv: OPENAI_API_KEY
reasoning:
  api: openai
  url: https://api.openai.com/v1
  model: gpt-6-luna
  apiKeyEnv: OPENAI_API_KEY
trigger:
  threshold: 0.7
check:
  threshold: 0.7
  reasoning: medium
```

Set `OPENAI_API_KEY` in the environment or an untracked `.env`. Existing environment
variables win, including empty values. Credentials never belong in YAML. Both model
configs and nonempty keys are required, including for regex-only tests and validation.
An invalid config fails each test with exit code 2.

Decision APIs are `openai` and `jev`; Clef support is deferred. Reasoning APIs are
`openai` (chat completions) and `anthropic`. Use `https://api.typesafe.ai/v1` for
Jev and `https://api.anthropic.com/v1` for Anthropic. URLs require HTTPS, except
HTTP on `localhost`, and cannot contain credentials, query parameters, or fragments.

`check.reasoning` accepts `provider-default`, `none`, `minimal`, `low`, `medium`,
`high`, `xhigh`, or `max`; the selected provider must support the level.
Model calls can incur charges. Validation makes no model calls; `eval` and `run`
call only the AI rules present in the selected test.

## Write a test

Create `.agents/tests/formal-prose/TEST.md`:

```md
Public help prose uses formal English. Replace “gonna” with “going to”.
```

Create `.agents/tests/formal-prose/test.yaml`:

```yaml
id: formal-prose
title: Formal help prose
description: Public help prose uses formal English.
triggers:
  - id: help
    description: Public help documents.
    glob: 'src/help/**/*.md'
checks:
  - id: formal-words
    description: Avoid informal vocabulary.
    error: Replace gonna with going to.
    grep: '\b[Gg]onna\b'
evals:
  - name: Informal prose
    path: src/help/start.md
    content: We are gonna save your changes.
    expect: fail
  - name: Formal prose
    path: src/help/start.md
    content: We are going to save your changes.
    expect: pass
  - name: Source code
    path: src/internal.ts
    content: const phrase = 'gonna';
    expect: skip
```

`source` optionally records `sha256:` followed by the SHA-256 of the exact `TEST.md`
bytes. Validation rejects a stale digest. Unknown fields, duplicate YAML keys,
multiple documents, and malformed regexes are rejected.

Each trigger needs an `id`, a `description`, and at least one of `glob`, `grep`, or
`ask`. Filters use AND, always in that order; triggers use OR. A filter's list is
OR. Omitted or empty triggers select every source. Globs use POSIX paths and
include dotfiles. Regexes are case-sensitive JavaScript expressions without flags.

Each check needs an `id`, a `description`, an `error`, and at least one of `grep`,
`ask`, or `reason`. A grep match fails; `ask` and `reason` describe the **passing**
condition and fail below the configured threshold. Lists of AI conditions use AND.
Rules run as grep, ask, then reason. A passing rule ends the check; a failing rule
escalates to the next configured rule. Only failure of the final rule flags the file.
Every check must pass. Findings use one-based lines and columns derived from exact
source text; an AI can fail without locating a quote.

Evals expect `pass`, `fail`, or `skip`. They run the same trigger and check instances
used for real sources; a mismatched expectation fails the eval.

## Run

```sh
bun run --bun agent-tests validate [id]
bun run --bun agent-tests eval [id]
bun run --bun agent-tests run
bun run --bun agent-tests run src/help
bun run --bun agent-tests run --changed
bun run --bun agent-tests run --staged
bun run --bun agent-tests run --base main
```

`run` reads tracked and nonignored untracked text files. Outside Git it walks the
project. It excludes dependency/build directories, `.agents`, `.env` files, binary
files, and symlinks. Tests in a directory's `.agents/tests/` apply within that
directory, alongside ancestor tests; trigger paths are relative to that owner.

`--changed` reads uncommitted working content, including untracked files. `--staged`
reads the index. `--base REF` compares committed HEAD to its merge base with REF and
reads HEAD content. Deleted files are excluded. With `--base`, config comes from
REF's commit, so PR changes cannot redirect credentials to a new endpoint.

Use `--json` for one JSON report or `--verbose` for streaming stage traces on `run`
and `eval`. Paths follow `--` when they resemble options. Exit codes are 0 for pass,
1 for findings or eval mismatches, and 2 for usage, configuration, or runtime errors.
A runtime error takes precedence over findings. Errors omit private configuration values.

## Community library

```sh
bun run --bun agent-tests list --remote
bun run --bun agent-tests add no-informal-english
bun run --bun agent-tests add no-informal-english apps/web
bun run --bun agent-tests list
bun run --bun agent-tests update [id]
bun run --bun agent-tests remove no-informal-english [targetDir]
bun run --bun agent-tests vote no-informal-english [--up | --down]
```

The CLI reads a pinned `main` commit from the [catalog](library/README.md), validates
its definition and source hash, runs evals, and installs only `TEST.md`, `test.yaml`,
and an origin receipt. Adapt globs to the project, then validate and evaluate again.
Updates and removals refuse local edits or extra files. Missing upstream tests stay
installed. Votes never affect availability.

Voting uses the signed-in GitHub CLI account to create or close a one-row vote PR.
It uses repository write access or a fork, and leaves the local checkout untouched.
Vote auto-merge remains planned. Contribution rules are in [library/AGENTS.md](library/AGENTS.md).

## Library API

```ts
import { AgentTest, Source } from 'agent-tests';
import type { AgentTestConfig } from 'agent-tests/types';

const sources = [new Source('src/help/start.md', async () => 'We are gonna save.')];
// definition is a parsed test.yaml value; config matches the YAML model configuration.
const run = async (definition: unknown, config: AgentTestConfig) => {
	const test = new AgentTest(sources, definition, config);
	return { run: await test.run(), eval: await test.eval() };
};
```

The library validates definitions but never parses YAML or runs Git. Resolved source reads
are cached; concurrent reads may repeat and failed reads can retry. Low-level `TestTrigger`,
`TestCheck`, `TestEval`, `AI`, and abstract `AIEngine` exports support custom integrations.

## Development

```sh
bun install --frozen-lockfile
bun run check
bun run build
```

`core/` is the npm package, `docs/` is the static documentation site, and `library/`
is the community catalog. The package publishes TypeScript source and keeps its AI SDK dependencies at runtime.
`bun run build` builds the static docs and copies package prose.

Automatic initialization, compilation assistants, exemptions, and Vitest integration
remain planned. Test prose and compiled definitions are currently authored directly.

[Discord](https://discord.gg/kESK4bgEPW) · [Issues](https://github.com/feuersteiner/agent-tests/issues) · [MIT](LICENSE)
