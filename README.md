# agent-tests

Linting for intelligence: turn fuzzy business and code rules into tests.

[![Discord](https://img.shields.io/badge/Discord-Join-5865F2?logo=discord&logoColor=white)](https://discord.gg/kESK4bgEPW)
[![MIT license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

An agent test is a rule your codebase must follow, packaged so a person, an agent,
or CI can check it. `select` picks typed file or directory targets; checks judge them.
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
select:
  type: files
  glob: ['src/**/*.svelte', 'src/**/*.html']
  ask: 'This file contains text displayed to an end user.'
checks:
  - id: french-only
    description: All user-facing text is French.
    error: Translate user-facing text into French.
    ask: 'All user-facing text is written in French.'
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
Use `select` and nested `where` steps to scope tests to files or directories.
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

For library use, pass parsed definitions as an array and parsed shared config:

```ts
import { AgentTests, FileSource } from 'agent-tests';

const sources = [new FileSource('src/app.ts', async () => 'console.log("hello");')];
const suite = new AgentTests(sources, definitions, config);
const results = await suite.run(); // [{ id, select, check }]
const evals = await suite.eval(); // [{ id, result }]
```

Each test filters the same source base independently. Construction validates every
definition and config; AI and provider keys are required only when execution starts.
Use `[definition]` for one test. Results follow definition order.

## Selection

Every test requires `select` with an explicit `type: files` or `type: directories`.
The type describes the final targets. Without filters, selection returns all
supplied descendants of that type.

```yaml
select:
  type: files
  glob: '**/*-ui/'
  where:
    glob: '*.svelte'
    ask: 'This file displays user-facing text.'
```

This first selects matching directories, then their immediate Svelte files.
A trailing `/` restricts a glob to directories. Each `where` operates relative to
its parent directory; another `where` adds another directory-selection step.
Use `**` to match nested descendants. Intermediate targets are directories even
when the final type is `files`.

Filters run as `glob`, then `grep`, then `ask`, using AND and stopping at the
first failure. Each accepts a string or a nonempty list of alternatives (OR):

- `glob`: POSIX path patterns, including dotfiles.
- `grep`: case-sensitive JavaScript content regexes without flags; files only.
- `ask`: passing conditions scored by the decision engine; alternatives run in
  order until one reaches `config.select.threshold`.

Empty branches stop immediately. Other matching branches continue. Final targets
are deduplicated by path before checks run. Verbose output records scopes,
matching counts, and filter outcomes.

A directory remains a directory target throughout execution:

```ts
import { DirectorySource, FileSource } from 'agent-tests';

const directory = new DirectorySource('src/ui', async () => [
	new FileSource('src/ui/Button.svelte', async () => '<button>Save</button>')
]);
await directory.open();
// { name: 'ui', children: [{ name: 'Button.svelte', kind: 'file', lines: 1 }] }
const children = await directory.children(); // traversable typed sources
```

Paths are normalized repository-relative POSIX paths. Children use full paths
and must be immediate children of their directory. Flat file inputs infer their
ancestor directories without filesystem I/O. Explicit directory sources supply
their own child lists, including empty directories.

File `open()` returns text. Directory `open()` summarizes immediate children;
file entries have line counts, directory entries do not. Empty files have zero
lines; a terminal newline does not add an empty line. Reads and snapshots are
cached, including concurrent reads; failed reads may retry. AI engines receive
file text or a JSON directory snapshot.

Directory count/name predicates (`DirectoryEngine`) remain deferred.

## Compilation

Design locked; implementation WIP.

Your agent turns `TEST.md` into `test.yaml`. `agent-tests compile <id>` hands it the
rule, a test-generator skill, and your repository layout; the agent writes the
selection, checks, and evals, then loops on `agent-tests validate` and
`agent-tests eval` until they pass. Edit `test.yaml` by hand whenever you like.
When `TEST.md` changes, `validate` flags `test.yaml` as stale until it is recompiled.
Library tests ship already compiled; after `add`, your agent adapts them to your
repository.

## Checks

Checks run on each final target and escalate through `grep`, `ask`, then `reason`.
A passing rule clears the check; a failing rule continues to the next configured
rule. The final configured rule determines whether the check reports a finding.

```yaml
checks:
  - id: formal-language
    description: Customer-facing text uses formal language.
    error: Rewrite casual expressions in formal language.
    grep: '\b(gonna|wanna|gotta)\b'
    ask: 'All customer-facing text uses formal language.'
    reason: 'All customer-facing text uses formal language.'
```

Any `grep` match fails its rule. Every `ask` or `reason` condition in a list must
reach `config.check.threshold` to pass. Reasoning uses `config.check.reasoning`.
Directory checks support AI conditions on directory snapshots; `grep` on a
directory is rejected during configuration validation. Custom callers can
traverse directory children and read their contents through the source API.

`Engines` shares `DecisionalAiEngine`, `ReasoningAiEngine`, `GrepEngine`, and
`GlobEngine` across selection and checks. Both AI provider configurations remain
required. Provider credentials are resolved when execution first creates the
engines, including for grep-only tests.

## Evals

Evals run selection and checks against labeled examples. Expected outcomes are
`pass`, `fail`, or `skip`.

```yaml
evals:
  - name: Informal file
    path: src/help.md
    content: We are gonna save your changes.
    expect: fail
  - name: Directory layout
    path: src/ui
    children:
      - path: src/ui/Button.svelte
        content: <button>Save</button>
      - path: src/ui/nested
        children: []
    expect: pass
```

Each example supplies either `content` for a file or `children` for a directory.
Child paths are repository-relative. Each example is evaluated independently
against its test's selection; an empty selection produces `skip`.

## Migration

Replace each test's `triggers` with `select` and its required final `type`.
Move the old filter fields into `select`; nested directory scopes use `where`.
Filter arrays continue to represent alternatives. Separate trigger IDs and
cross-trigger OR groups are removed; split distinct selection pipelines into
separate test definitions.

Rename repository configuration `trigger.threshold` to `select.threshold`.
Use `FileSource` instead of constructing `Source`; `Source` is now the union type
of `FileSource` and `DirectorySource`. Replace `TestTrigger` with `TestSelect`
and result `.trigger` with `.select`. Replace `AI` with `Engines`,
`.decide` with `.decision`, and `.reason` with `.reasoning`; stage configs receive
`engines` instead of `ai`.

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
