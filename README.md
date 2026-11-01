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
A test is two files in `.agents/tests/user-text-french/`. `TEST.md` states the rule
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
triggers:
  path:
    match: ["src/**/*.svelte", "src/**/*.html"]
  content:
    ask: "This file contains text displayed to an end user."
checks:
  - id: french-only
    message: User-facing text is not in French.
    fix: Translate the text into French.
    smart:
      ask: "Quote each piece of user-facing text that is not in French."
evals:
  - name: English button label
    path: src/lib/Save.svelte
    content: <button>Save</button>
    expect: fail
```

Only Svelte and HTML files that a decision model judges to contain user-facing text
are inspected. Every other file is skipped without a model call.

## Where it runs

- **While an agent works:** on the files it just edited.
- **Before a commit:** on uncommitted changes.
- **In CI:** on the whole repository, like `eslint .` or `prettier --check .`.
- **In a test suite:** through Vitest, as pass/fail tests.
- **In your own tools:** as a library from the npm package.

## Get started (WIP)

Not published yet.

```sh
npm install -D agent-tests
npx agent-tests init                          # config, .agents/tests/, pre-commit hook
npx agent-tests add user-text-french          # install a community test at the root
npx agent-tests add user-text-french apps/web # install it for apps/web/ only
npx agent-tests validate user-text-french     # check a local test's structure
npx agent-tests list                          # installed tests as a directory tree
npx agent-tests targets user-text-french      # files that test would inspect
npx agent-tests eval user-text-french         # run its labeled examples
npx agent-tests run                           # check the whole repository
npx agent-tests run --changed                 # uncommitted files
npx agent-tests run --staged                  # pre-commit
npx agent-tests run --base main               # pull requests
npx agent-tests docs                          # skills that teach agents to write and run tests
npx agent-tests vote user-text-french         # toggle your vote for a library test
```

Choose the decision model (Jev, Clef, or OpenAI) in `agent-tests.config.yaml`
and keep its credentials in `.env`.

## Triggers

Design locked; implementation WIP.

Triggers decide, per file, whether a test inspects it: yes or no. A trigger reads
a file's `path`, its `content`, or both, and every filter it names must pass, in
the order written. A list of triggers holds alternatives.

- `path.match`: a glob on the path.
- `path.ask`: a decision model judging the path.
- `content.match`: a regex on the file text.
- `content.ask`: a decision model judging the file text.

```yaml
# .agents/tests/brand-messaging/test.yaml: customer-facing copy follows Acme's brand voice.
triggers:
  # Marketing pages are always brand copy: a glob is enough.
  - path:
      match: ["content/**/*.md", "src/routes/(marketing)/**/*.svelte"]
  # Elsewhere, cheap filters first and models last.
  - path:
      match: ["src/**/*.svelte", "emails/**/*.html"]
      ask: "This path belongs to a customer-facing page, component, or email."
    content:
      match: "[Aa]cme"
      ask: "This file contains product or marketing copy shown to customers."
```

Like `AGENTS.md`, any directory can have its own `.agents/tests/`. Its tests apply
inside that directory, in addition to tests from parent directories, and its
`.agents/tests/config.yaml` can opt out of specific parent tests.

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
    smart: # classifier such as Jev or Clef
      ask: "Quote each phrase in this copy that uses familiar or casual language."
      bounds: [0.3, 0.8] # below: pass, between: unsure, above: likely violation
    deep: # structured LLM call, the final word
      ask: "Judge each quoted phrase against the brand voice in TEST.md."
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
  are optional. **Custom Vitest checks** pass or fail only; they never escalate.

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
    content: "export const charge = (cents: number) => cents;"
    expect: skip # the triggers should not select it
```

`expect` is `pass`, `fail`, `unsure`, or `skip`. `agent-tests eval <id>` runs the real triggers and checks on every example and reports any that disagree.

## Community library

The [`library/`](library/README.md) directory is a shared catalog of tests. Anyone can contribute one with a pull request containing its `TEST.md`, credited to the author's GitHub profile, and its compiled `test.yaml`. Every PR is screened for malware and prompt injection, and accounts that attempt either are banned. Every test merged into `main` is available to `npx agent-tests add [test-id]`.

Vote for a test with `npx agent-tests vote <test-id>` (WIP): it uses your GitHub CLI login to open a pull request that adds or removes your handle in the test's `score.csv`, and the PR merges automatically once its check passes. Only you can add yourself, one vote per pull request. Scores show interest and never gate availability.

## Repository structure

- [`core`](core): the `agent-tests` npm package.
- [`docs`](docs): the documentation site, built with [Bref-ui](https://github.com/feuersteiner/bref-ui).
- [`library`](library): community tests.
- [`usecases.md`](usecases.md): proposed use cases.

## Community and contributing

For questions and ideas, join [Discord](https://discord.gg/kESK4bgEPW). Report bugs
and suggest features through [GitHub Issues](https://github.com/feuersteiner/agent-tests/issues).
Contributors and their agents start with [`AGENTS.md`](AGENTS.md).

## License

[MIT](LICENSE).
