# agentests

A CLI that checks your repository against rules written in plain language, so a lesson
learned once holds on every commit.

[![npm](https://img.shields.io/npm/v/agentests?logo=npm)](https://www.npmjs.com/package/agentests)
[![Discord](https://img.shields.io/badge/Discord-Join-5865F2?logo=discord&logoColor=white)](https://discord.gg/kESK4bgEPW)
[![MIT license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

For teams who build with coding agents and keep correcting the same mistakes. Write the rule
once; your agent compiles it into a check and proves it on tiny example repositories; a
pre-commit hook then runs it on every commit. The MVP is feature-complete; the
[roadmap](https://github.com/feuersteiner/agentests/issues/1) lists what comes next.

## See it in 40 seconds

<!-- Video: paste the uploaded video URL on its own line here. -->

One rule, from plain language to a blocked commit: write it, let an agent compile it, watch the
evals match, then watch the hook stop a bad commit and let the fix through.

The [SvelteKit app that renders the film](demo-video) lives in this repository.

## Get started

### 1. Install

In a Git repository, with Node 22 or later:

```sh
npm install --save-dev agentests
```

### 2. Set up

```sh
npx agentests init
```

```text
Created agentests.config.yaml.
Created .agents/tests/.
Created .git/hooks/pre-commit.
Set OPENAI_API_KEY in .env or the environment.
```

`init` never overwrites: when a file exists, it prints what to add instead. Set the key it
names in the environment or in `.env`, and keep `.env` out of Git. OpenAI is the default
provider; `--decision jev` and `--reasoning anthropic` pick the others.

### 3. Write a rule

Each rule is a **Test**: a folder in `.agents/tests/`. State the rule in plain language in its
`TEST.md`, here `.agents/tests/hide-stack-traces/TEST.md`:

```markdown
# Error responses hide stack traces

Route handlers under `src/routes/` never send a stack trace to the client.

Exceptions: stack traces that are only logged.
```

Prefer to describe it in chat? `npx agentests compile` without an id prints the prompt for
your agent to name the Test and write this file.

### 4. Compile it with your agent

Ask your coding agent:

```text
Run `npx agentests compile hide-stack-traces` and follow the prompt.
```

`compile` calls no model: it prints a prompt, and your agent does the work. It writes
`test.yaml`, the part that runs:

```yaml
version: 1
id: hide-stack-traces
title: Error responses hide stack traces
description: Route handlers never send a stack trace to the client.
select:
  glob: 'src/routes/**/*.ts'
assert:
  - id: no-stack-trace
    description: No stack trace in a response.
    error: Log the stack trace and send a generic message.
    grep: '[Ss]tack'
    decide: 'No response includes a stack trace.'
```

And evals, each a tiny repository with the outcome it expects:

```text
.agents/tests/hide-stack-traces/
  TEST.md
  test.yaml
  evals/
    not-a-route/
      eval.yaml            expect: skip
      src/lib/log.ts       console.error(err.stack);
    stack-trace-logged/
      eval.yaml            expect: pass
      src/routes/user.ts   console.error(err.stack); res.status(500).send('Error');
    stack-trace-sent/
      eval.yaml            expect: fail
      src/routes/user.ts   res.status(500).send(err.stack);
```

It runs `validate` and `eval` until every eval matches, then reports what `test.yaml` cannot
express.

### 5. Prove it

Review the Test like code, then run its evals yourself:

```sh
npx agentests eval hide-stack-traces
```

Among its progress lines, `eval` prints one result per eval and a total:

```text
✓ Expected skip, got skip
✓ Expected pass, got pass
✓ Expected fail, got fail
3 of 3 eval(s) match.
```

`skip` means nothing was selected, `fail` a finding, `pass` selected with no finding.

### 6. Commit

Stage a route that sends `err.stack` and commit. The hook runs `npx agentests run --staged`,
prints the finding, and exits 1, so the commit stops:

```text
src/routes/user.ts  hide-stack-traces/no-stack-trace  Log the stack trace and send a generic message.
```

Fix the route and the commit goes through. `npx agentests run` checks the whole repository.

## Why?

- **Readable rules, explicit checks.** The rule stays in plain language in `TEST.md`, where
  anyone can read and correct it. What runs is a short `test.yaml` you review in a diff, written
  by any coding agent that runs shell commands: `compile` only prints a prompt.
- **Proved before trusted.** A Test is proved on evals, tiny repositories it must flag, pass or
  skip. `eval` shows whether it does before the Test stops a single commit.
- **Cheap first, narrow questions.** `glob` and `grep` run locally, so a model sees only the
  files they could not clear. A small decision model answers one yes-or-no question at a time,
  a broad judgment becomes several narrow ones, and the reasoning model is the last resort.

## Documentation

A documentation site is planned. Until then, the reference is this README,
`npx agentests --help`, and the compile prompt: for a Test with a `TEST.md`,
`npx agentests compile <id>` prints the full `test.yaml` rules and a worked example that splits
one broad rule into four narrow assertions.

### Commands

Run each as `npx agentests <command>`. An `[id]` names one Test; without it, every Test.

- `init`: writes the config, `.agents/tests/` and the pre-commit hook, never overwriting.
  `--decision openai|jev` and `--reasoning openai|anthropic` pick the providers; both default to
  `openai`.
- `compile [id]`: prints the prompt your agent needs and calls no model. Without an id, the
  prompt has it name a new Test and write its `TEST.md`; with an id whose `TEST.md` is missing
  or blank, write that file; otherwise, write `test.yaml` and the evals.
- `validate [id]`: checks the config, each `test.yaml` and each `eval.yaml`. Needs no key.
- `list`: prints each Test's id and title.
- `eval [id]`: runs each eval folder as its own repository and compares the outcome with the one
  it expects.
- `run [id]`: runs on the whole repository, or only on files that are `--changed` (uncommitted),
  `--staged`, or changed against `--base <ref>`.

A finding prints as `<path>  <test>/<assertion>  <error>`. Exit codes: `0` clean, `1` findings
or an eval mismatch, `2` a setup error such as a missing key, no Tests, or an invalid file.

### How a Test runs

A source is a file or a folder in scope. `select` keeps the sources a Test inspects: `glob`
matches the path, then `grep` and `decide` read the content. Every filter present must pass;
without `select`, every source is inspected.

Each selected source then goes through each assertion's stages in order: `grep` (local, fails
when it matches), `decide` (a small decision model answers one yes-or-no criterion) and `reason`
(a reasoning model). A model stage fails when it scores below the config's threshold. The first
stage passed clears the source; failing every stage present is a finding with the assertion's
`error`.

### Config

`agentests.config.yaml` names the `decision` and `reasoning` models, each by `api`, `url`,
`model` and `apiKeyEnv`, the variable that holds its key; the file never holds a key. It also
sets the `select` and `assert` thresholds, and `ignore` globs, which default to `**/.git`,
`**/.agents` and `**/node_modules`. The providers and their key variables:

- OpenAI, for both models: `OPENAI_API_KEY`.
- Jev by typesafe.ai, for decisions: `TYPESAFE_AI_API_KEY`.
- Anthropic, for reasoning: `ANTHROPIC_API_KEY`.

The CLI loads `.env` from the working directory without overriding variables already set.
`run` and `eval` need the keys the config names, even for a Test that uses only `glob` and
`grep`.

### Library

```ts
import { Agentests, loadConfig } from 'agentests';

const results = await new Agentests(loadConfig(), process.env).run({ kind: 'staged' });
```

Each result is a Test with its findings. Types are under `agentests/types`. The library never
reads `.env` or `process.env`: pass the environment in.

## Repository structure

- [`core`](core): the npm package, with the [CLI](core/cli) and the library in [`src`](core/src).
- [`docs`](docs): use cases, the source of the planned documentation site.
- [`library`](library): placeholder for the planned community library of shared Tests.
- [`demo-video`](demo-video): the SvelteKit app that renders the demo film.
- [`.github/workflows`](.github/workflows): publishing to npm.

Contributors and coding agents start with [AGENTS.md](AGENTS.md);
[core/AGENTS.md](core/AGENTS.md) maps the package. The repository uses Bun for development; the
package needs only Node.

## Roadmap

- ✅ MVP: the `version: 1` Test format, evals, the commands `init`, `compile`, `list`,
  `validate`, `eval` and `run`, and the `--changed`, `--staged` and `--base` scopes.
- 🗓️ Selectors: several per Test, typed selection of files or folders, selecting a folder by its
  children and counting them, and `!` glob exclusions.
- 🗓️ Findings and reporting: line, quote, reason and fix; JSON reports; GitHub annotations.
- 🗓️ Evals and benchmarks: the same evals across models, compared for accuracy, consistency,
  speed and cost, and a warning when `test.yaml` is older than its `TEST.md`.
- 🗓️ CLI: `targets <id>` to list what a Test inspects, and `docs` to ship the agent skills.
- 🗓️ Integrations: a GitHub Action, and plugins for Vitest, Bun, Playwright Test and Jest.
- 🗓️ Community library: shared Tests installed with `add <id>`, screened for malware and prompt
  injection.
- 🗓️ Documentation site.

✅ shipped · 🗓️ planned. Track it in [Roadmap #1](https://github.com/feuersteiner/agentests/issues/1);
an item becomes a linked sub-issue when work on it starts. Check
[open issues](https://github.com/feuersteiner/agentests/issues) for newer reports.

## Community and contributing

For questions and ideas, join [Discord](https://discord.gg/kESK4bgEPW). Report bugs and suggest
features through [GitHub Issues](https://github.com/feuersteiner/agentests/issues).

To contribute, read [AGENTS.md](AGENTS.md), then pick a roadmap item or an open issue and say
so there or on Discord before you start.

## License

[MIT](LICENSE).
