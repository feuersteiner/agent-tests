# agent-tests

Linting for intelligence: turn fuzzy business and code rules into tests.

[![Discord](https://img.shields.io/badge/Discord-Join-5865F2?logo=discord&logoColor=white)](https://discord.gg/kESK4bgEPW)
[![MIT license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

An agent test is a rule your codebase must follow, packaged so a person, an agent,
or CI can check it. Triggers pick the files the rule applies to; checks judge them.
Both use globs and regex where a pattern is enough, and a decision model where the
rule needs judgment. Tests report findings and never modify your code.

**Status:** WIP 🚧

## Example

Your app's interface must be in French, but agents keep adding English strings.
A test is two files in the repository-root `.agents/tests/user-text-french/`. `TEST.md` states the rule
in plain prose:

```md
All user-facing text is written in French. Examples, exceptions, and how to fix a
violation...
```

`test.yaml`, written by an agent from `TEST.md`, holds everything that runs:

```yaml
id: user-text-french
title: User text in French
description: User-facing text is written in French.
tags: ['ui', 'language'] # optional metadata
triggers:
  - id: user-facing-text
    description: Svelte and HTML files with text shown to end users.
    glob: ['src/**/*.svelte', 'src/**/*.html']
    ask: 'This file contains text displayed to an end user.'
checks:
  - id: french-only
    message: User-facing text is not in French.
    fix: Translate the text into French.
    smart:
      ask: 'Quote each piece of user-facing text that is not in French.'
evals:
  - name: English button label
    path: src/lib/Save.svelte
    content: <button>Save</button>
    expect: fail
```

Only Svelte and HTML files that a decision model judges to contain user-facing text
are inspected. Paths outside those globs are skipped without a model call.

Tests live only in the repository-root `.agents/tests/<id>/`, following the
project `.agents/skills/` convention. IDs are unique within `.agents/tests/`.
Use triggers and globs to scope tests to files or subdirectories.
Optional `tags` accepts an array of strings, including `[]`, with no default or
tag filtering. Existing definitions can omit it.

## Where it runs

- **While an agent works:** on the files it just edited.
- **Before a commit:** on uncommitted changes.
- **In CI:** on the whole repository, like `eslint .` or `prettier --check .`.
- **In a test suite:** through a Vitest plugin, as pass/fail tests beside your own.
- **In your own tools:** as a library from the npm package.

## Get started (WIP)

Not published yet.

The package ships TypeScript source. Library imports require Bun or tooling that
compiles TypeScript dependencies; plain Node does not execute TypeScript inside
`node_modules`. The TypeScript CLI requires Bun on `PATH`.

All documented commands have scaffolded help and dispatch. Functionality is pending:
each stub prints its command name, ID when supplied, and parsed values with runtime
types, then exits 0. Undefined values are omitted; Clinguini supplies `false` for
omitted boolean flags. Invalid arguments exit 2. Stubs do not load test/config/env
files, run Git, or make model calls.
`validate [id]`, `run [id]`, and `eval [id]` accept an optional exact test ID;
omission will select all tests when implemented, without `--all`.

```sh
npm install -D agent-tests
npx agent-tests init                          # config, .agents/tests/, pre-commit hook
npx agent-tests add user-text-french          # install a community test at the root
npx agent-tests list                          # installed tests
npx agent-tests validate user-text-french     # check one local test
npx agent-tests validate                      # check all local tests
npx agent-tests targets user-text-french      # files that test would inspect
npx agent-tests compile user-text-french      # compile TEST.md into test.yaml
npx agent-tests eval user-text-french         # run its labeled examples
npx agent-tests eval                          # run all tests' labeled examples
npx agent-tests run user-text-french          # run one test
npx agent-tests run                           # run all tests on the whole repository
npx agent-tests run --changed                 # uncommitted files
npx agent-tests run --staged                  # pre-commit
npx agent-tests run --base main               # pull requests
npx agent-tests docs                          # skills that teach agents to write and run tests
npx agent-tests vote user-text-french         # toggle your vote for a library test
```

The root `package.json` includes this script:

```json
{ "scripts": { "test:agents": "agent-tests run" } }
```

Use `npm run test:agents` for all tests or `npm run test:agents -- user-text-french`
for one (`npm run test:agents [-- id]`). Bun must still be on `PATH`.
The script currently prints the parsed `run` values and exits 0; functionality is pending.

Choose the decision model (Jev or OpenAI) in `agent-tests.config.yaml`
and keep its credentials in `.env`.
Clef support is deferred pending standardized APIs for system-one models.

## Triggers

Design locked; implementation WIP.

Triggers decide whether a test inspects a file. `triggers` is optional;
omitting it or setting `triggers: []` selects every file.
Otherwise, it is a list of triggers, each with a lowercase kebab-case `id` and a `description`.
Each trigger requires at least one filter:

- `glob`: POSIX glob patterns on the path, including dotfiles.
- `grep`: case-sensitive JavaScript regex patterns on the content, without flags.
- `ask`: a decision model judging the content against a passing condition.

Filters within one ID use **AND**: every configured filter must pass.
Triggers use **OR**: trigger A or trigger B can qualify a file.
Within each trigger, filters always run as `glob`, then `grep`, then `ask`, so a
model is only called once the cheap filters pass. Omitted filters are skipped; the
first failure stops that trigger. A file is excluded only if every trigger fails.

`glob`, `grep`, and `ask` each accept a string or a nonempty list of alternatives (**OR**).
For `glob` and `grep`, any matching pattern passes that filter.
For `ask`, each string is a nonblank passing condition; prompts run in list order
until one passes. If none passes, the filter fails.

```yaml
# .agents/tests/brand-messaging/test.yaml: customer-facing copy follows Acme's brand voice.
triggers:
  # Marketing pages are always brand copy: a glob is enough.
  - id: marketing
    description: Marketing pages.
    glob: ['content/**/*.md', 'src/routes/(marketing)/**/*.svelte']
  # Elsewhere, cheap filters first and models last.
  - id: customer-copy
    description: Product and marketing copy shown to customers.
    glob: ['src/**/*.svelte', 'emails/**/*.html']
    grep: '[Aa]cme'
    ask:
      - 'This file contains product copy shown to customers.'
      - 'This file contains marketing copy shown to customers.'
```

For debugging, trace outcomes by trigger ID and filter (`glob`, `grep`, or `ask`),
with a pass, failure, or skipped status and reason. Later filters are skipped
after one fails. Trace output remains WIP.

## Compilation

Design locked; implementation WIP.

Your agent turns `TEST.md` into `test.yaml`. `agent-tests compile <id>` hands it the
rule, a test-generator skill, and your repository layout; the agent writes the
triggers, checks, and evals, then loops on `agent-tests validate` and
`agent-tests eval` until they pass. Edit `test.yaml` by hand whenever you like.
When `TEST.md` changes, `validate` flags `test.yaml` as stale until it is recompiled.
Library tests ship already compiled; after `add`, your agent adapts them to your
repository.

## Checks

Design locked; implementation WIP.

Checks judge each targeted file and report pass, warning, or error findings, through
the CLI, Vitest, or the library. A check runs from `fast` to `smart` to `deep`,
cheapest first, and escalates only what it cannot settle:

```yaml
# .agents/tests/brand-messaging/test.yaml
checks:
  - id: no-familiar-language
    message: Copy uses familiar language.
    fix: Rewrite in Acme's formal voice; see TEST.md.
    human-tiebreak: true # if deep stays unsure, a person decides
    fast: # patterns, no model
      match: # any match fails
        - '\b(gonna|wanna|gotta)\b'
      maybe: # weak signal: a match escalates, with the hits as hints
        - '\b(hey|awesome|folks|no worries)\b'
    smart: # classifier such as Jev or OpenAI
      ask: 'Quote each phrase in this copy that uses familiar or casual language.'
      bounds: [0.3, 0.8] # below: pass, between: unsure, above: likely violation
    deep: # structured LLM call, the final word
      ask: 'Judge each quoted phrase against the brand voice in TEST.md.'
      reasoning: medium # low, medium, or high
```

- **`fast`** fails on a `match`. A `maybe` hit escalates, and so does no hit when
  `smart` or `deep` exists. The agent writes the patterns; `agent-tests validate`
  checks them against the evals and flags risky ones. Patterns are regex today,
  with room for other pattern types later.
- **`smart`** passes, escalates, or flags violations by confidence bounds,
  quoting each instance it finds.
- **`deep`** confirms every violation a model flagged, with the `reasoning` effort
  the check sets. If it stays unsure, the CLI shows a warning, or a person
  reviews it with `human-tiebreak: true`.
- A check uses only the levels it needs, and `maybe`, `bounds`, and `reasoning`
  are optional.

Every finding names its test, check, level, file, and line, with the fix:

```text
src/routes/+page.svelte:12:5  error  "Hey folks!" uses familiar language
  brand-messaging/no-familiar-language (deep): Rewrite in Acme's formal voice.
```

## Evals

Design locked; implementation WIP.

Benchmarks that show whether a newer model or a regenerated test still makes the
approved decisions before you upgrade. Each test keeps labeled examples under
`evals` in its `test.yaml`:

```yaml
evals:
  - name: casual greeting on the homepage
    path: src/routes/+page.svelte
    content: <h1>Hey folks! Welcome to Acme.</h1>
    expect: fail
  - name: formal copy
    path: src/routes/about/+page.svelte
    content: <p>Acme provides enterprise-grade testing.</p>
    expect: pass
  - name: billing code is not copy
    path: src/billing/charge.ts
    content: 'export const charge = (cents: number) => cents;'
    expect: skip # the triggers should not select it
```

`expect` is `pass`, `fail`, `unsure`, or `skip`. The planned `agent-tests eval [id]`
will run the real triggers and checks on every example and report disagreements.
An ID selects one test; omission selects all tests.

## Community library

The [`library/`](library/README.md) directory is a shared catalog of tests. Anyone can contribute one with a pull request containing its `TEST.md`, credited to the author's GitHub profile, and its compiled `test.yaml`. Every PR is screened for malware and prompt injection, and accounts that attempt either are banned. Every test merged into `main` is available to `npx agent-tests add [test-id]`.

Vote for a test with `npx agent-tests vote <test-id>` (WIP): it uses your GitHub CLI login to open a pull request that adds or removes your handle in the test's `score.csv`, and the PR merges automatically once its check passes. Only you can add yourself, one vote per pull request. Scores show interest and never gate availability.

## Repository structure

- [`core`](core): the `agent-tests` npm package.
- [`docs`](docs): the documentation site, built with [Bref-ui](https://github.com/feuersteiner/bref-ui).
- [`library`](library): community tests.
- [`docs/usecases.md`](docs/usecases.md): proposed use cases.

## Community and contributing

For questions and ideas, join [Discord](https://discord.gg/kESK4bgEPW). Report bugs
and suggest features through [GitHub Issues](https://github.com/feuersteiner/agent-tests/issues).
Contributors and their agents start with [`AGENTS.md`](AGENTS.md).

## License

[MIT](LICENSE).
