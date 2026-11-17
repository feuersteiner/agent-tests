# agentests

Linting for intelligence.

Decisions travel slowly. Agents write fast. The work ships before the decision reaches it, and a
linter cannot read tone, meaning, or intent.

[![npm](https://img.shields.io/npm/v/agentests?logo=npm)](https://www.npmjs.com/package/agentests)
[![Discord](https://img.shields.io/badge/Discord-Join-5865F2?logo=discord&logoColor=white)](https://discord.gg/kESK4bgEPW)
[![MIT license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

agentests shows where a decision has not reached the work. Write it once, in plain language. Your
coding agent compiles it into narrow yes-or-no questions and proves them on your own evals. A
pre-commit hook then checks every commit and names each file that breaks it. The MVP is
feature-complete; the [roadmap](https://github.com/feuersteiner/agentests/issues/1) lists what
comes next.

## See it in 60 seconds

https://github.com/user-attachments/assets/b7f71b93-9cb0-4d5e-9825-edc523b0ebdb

One brand decision, from the meeting to a blocked commit: written down once, compiled into three
clear questions, proved on six evals. The film's [SvelteKit app](demo-video) is in this repository.

## Get started

### 1. Install

In a Git repository, with Node 22 or later:

```sh
npm install --save-dev agentests
npx agentests init
```

`init` writes `agentests.config.yaml`, the `.agents/tests/` folder and a pre-commit hook. It never
overwrites: when a file exists, it prints what to add. Set the API key it names, `OPENAI_API_KEY`
by default, in the environment or in `.env`, and keep `.env` out of Git.

### 2. Write the rule

Marketing decided: **No hype. No guarantees. Never blame the customer.** Write it down once as a
**Test**, a folder in `.agents/tests/` whose `TEST.md` states the rule in plain language, here
`.agents/tests/brand-voice/TEST.md`:

```markdown
# Brand voice

Customer-facing copy under `content/` and `emails/` says what the product does in plain words.
It promises no result and never blames the reader for a problem.

Exceptions: refund and legal terms.
```

Prefer to say it in chat? `npx agentests compile` without an id prints the prompt for your agent to
name the Test and write this file.

### 3. Compile it and prove it

Ask your coding agent to run `npx agentests compile brand-voice` and follow the prompt. `compile`
calls no model: it prints a prompt, and your agent does the work. One fuzzy rule becomes three
clear questions in `test.yaml`, the part that runs, each behind a local text check:

```yaml
version: 1
id: brand-voice
title: Brand voice
description: Customer-facing copy has no hype, promises no result, and never blames the reader.
select:
  glob: ['content/**/*.md', 'emails/**/*.md']
assert:
  - id: no-hype
    description: No hype.
    error: Say what it does in plain words.
    grep: '[Rr]evolutionary|[Ww]orld-class|[Gg]ame-chang|[Cc]utting-edge|[Bb]est-in-class'
    decide: 'The text makes no superlative claim about the product.'
  - id: no-guarantees
    description: No promise of a result.
    error: Describe the typical result, or link the terms.
    grep: '[Gg]uarantee|100%|[Rr]isk-free'
    decide: 'The text makes no promise of a result.'
  - id: no-blame
    description: Never blame the reader.
    error: Say what happened and what to do next.
    grep: '[Yy]ou (entered|failed|forgot)|[Yy]our (mistake|error|fault)'
    decide: 'The text does not say the reader made a mistake.'
```

Your agent also writes evals: tiny repositories, each with files at their real paths and the
outcome it expects, `fail` for a finding, `pass` for no finding, `skip` when nothing is selected.
The near misses carry the proof:

```text
.agents/tests/brand-voice/evals/
  guaranteed-result/
    eval.yaml            expect: fail
    content/pricing.md   Guaranteed to double your conversions in 30 days.
  refund-terms/
    eval.yaml            expect: pass
    content/pricing.md   30-day money-back guarantee. See the terms.
```

Both say "guarantee". Only one promises a result. `hype-headline` and `plain-headline` split the
same way, `blames-reader` must fail, and `changelog-is-not-copy` must be skipped: a changelog is
not customer copy. The agent runs `validate` and `eval` until every eval matches, then reports what
`test.yaml` cannot express. Review the Test like code, then run `npx agentests eval brand-voice`
yourself. Among its progress lines, it prints one result per eval and a total:

```text
Eval blames-reader
✓ Expected fail, got fail
Eval changelog-is-not-copy
✓ Expected skip, got skip
Eval guaranteed-result
✓ Expected fail, got fail
Eval hype-headline
✓ Expected fail, got fail
Eval plain-headline
✓ Expected pass, got pass
Eval refund-terms
✓ Expected pass, got pass
6 of 6 eval(s) match.
```

### 4. Commit

An agent drafts a launch email, `emails/launch.md`, with the line `Guaranteed to double your
conversions in 30 days.` On commit, the hook runs `npx agentests run --staged`, prints the finding,
and exits 1. The commit stops:

```text
emails/launch.md  brand-voice/no-guarantees  Describe the typical result, or link the terms.
```

Replace the line with `Most teams see results within a month.` and the commit goes through. The
decision now reaches every commit. `npx agentests run` checks the whole repository.

## Why?

- **Engineered, not vibes.** "Is this on brand?" cannot be grepped and is too broad to ask a model
  reliably. agentests has your agent split it into narrow yes-or-no questions, with local text
  checks first. The text checks, the order of stages and the exit codes are deterministic.
- **Fewer tokens, faster runs.** `glob` and `grep` run locally and cost nothing, so a model sees
  only the files they could not clear, one small question per call.
- **Proved on your own evals.** A compiled Test comes with its own cases and the outcome each must
  get. `eval` shows whether it holds before it blocks a single commit, and again when you change
  models.
- **You own it.** Rules and evals are plain files in your repository, reviewed like code and
  compiled by any coding agent that runs shell commands. Change the model or provider in the
  config, then re-prove with one command.

## Documentation

Until the documentation site ships, `npx agentests --help` and the compile prompt carry the detail.
Run each command as `npx agentests <command>`; an `[id]` names one Test, without it every Test.

- `init`: writes the config, `.agents/tests/` and the hook, never overwriting. Pick providers with
  `--decision openai|jev` and `--reasoning openai|anthropic`.
- `compile [id]`: prints the prompt for your agent to write `TEST.md`, `test.yaml` and the evals.
- `validate [id]`: checks the config, each `test.yaml` and each `eval.yaml`. Needs no key.
- `list`: prints each Test's id and title.
- `eval [id]`: runs each eval folder as its own repository and reports whether it matches.
- `run [id]`: checks the whole repository, or only `--changed`, `--staged`, or `--base <ref>` files.

A finding prints as `<path>  <test>/<assertion>  <error>`. Exit codes: `0` clean, `1` findings or
an eval mismatch, `2` a setup error such as a missing key, no Tests, or an invalid file.

`agentests.config.yaml` names the `decision` model, for `decide`, and the `reasoning` model, for
`reason`, by `api`, `url`, `model` and `apiKeyEnv`, the variable that holds the key, never the key
itself. It also sets the `select` and `assert` thresholds and `ignore` globs. Providers: OpenAI for
both (`OPENAI_API_KEY`), Jev by typesafe.ai for decisions (`TYPESAFE_AI_API_KEY`), Anthropic for
reasoning (`ANTHROPIC_API_KEY`). The CLI loads `.env` without overriding variables already set;
`run` and `eval` need the keys the config names, even for a Test that uses only `glob` and `grep`.

### Library

```ts
import { Agentests, loadConfig } from 'agentests';

const results = await new Agentests(loadConfig(), process.env).run({ kind: 'staged' });
```

Each result is a Test with its findings, and the types are under `agentests/types`. The library
never reads `.env` or `process.env` itself: pass the environment in.

## Repository structure

- [`core`](core): the npm package, with the [CLI](core/cli) and the library in [`src`](core/src).
- [`docs`](docs): use cases, the source of the planned documentation site.
- [`library`](library): placeholder for the planned community library of shared Tests.
- [`demo-video`](demo-video): the SvelteKit app that renders the demo film.
- [`.github/workflows`](.github/workflows): publishing to npm.

## Roadmap

**Shipped.** The MVP: the `version: 1` Test format, evals, the commands `init`, `compile`, `list`,
`validate`, `eval` and `run`, and the `--changed`, `--staged` and `--base` scopes.

**Planned.**

- Selectors: several per Test, typed selection of files or folders, selecting a folder by its
  children and counting them, and `!` glob exclusions.
- Findings and reporting: line, quote, reason and fix; JSON reports; GitHub annotations.
- Evals and benchmarks: the same evals across models, compared for accuracy, consistency, speed and
  cost, and a warning when `test.yaml` is older than its `TEST.md`.
- CLI: `targets <id>` to list what a Test inspects, and `docs` to ship the agent skills.
- Integrations: a GitHub Action, and plugins for Vitest, Bun, Playwright Test and Jest.
- Community library: shared Tests installed with `add <id>`, screened for malware and prompt
  injection.
- Documentation site.

Track it in [Roadmap #1](https://github.com/feuersteiner/agentests/issues/1), where items become
linked sub-issues as work starts, and in [open issues](https://github.com/feuersteiner/agentests/issues).

## Community and contributing

Bring questions and ideas to [Discord](https://discord.gg/kESK4bgEPW), and bugs and feature
requests to [GitHub Issues](https://github.com/feuersteiner/agentests/issues). To contribute, start
with [AGENTS.md](AGENTS.md); [core/AGENTS.md](core/AGENTS.md) maps the package, which needs only
Node, while the repository uses Bun for development. Pick a roadmap item or an open issue and say
so there or on Discord before you start.

## License

[MIT](LICENSE).
