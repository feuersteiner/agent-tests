# agent-tests

Turn repository rules into tests an agent can compile, prove on evals, and run.

**Status: WIP**, see the [Roadmap](https://github.com/feuersteiner/agent-tests/issues/1).
The CLI is a skeleton; the MVP format and command behavior below are planned.

A **Test** is one `.agents/tests/<id>/` folder: `TEST.md` states the rule,
`test.yaml` holds what runs, and an optional `evals/` folder proves its behavior.

## Test format

```yaml
version: 1
id: user-text-french
title: User text in French
description: User-facing text is written in French.
select:
  glob: ['src/**/*.svelte', 'src/**/*.html']
  grep: '<(p|button)\b'
  decide: 'This file contains text displayed to an end user.'
test:
  - id: french-only
    description: User-facing text is in French.
    error: Translate the text into French.
    grep: 'hello'
    decide: 'This text is written in French.'
    reason: 'This text is written in French.'
```

`version: 1` is required. One `select` filters sources through `glob`, `grep`,
and `decide`, in that order; every present filter must pass. Omit `select` to
select every source. Each entry in `test` runs its configured engines in order:
`grep`, `decide`, then `reason`, and reports its `error` on failure.

## Evals

Each eval folder is a tiny repository with files at their real paths.
Its `eval.yaml` sets `expect: pass` (selected, no finding), `expect: fail`
(a finding), or `expect: skip` (nothing selected).

```text
.agents/tests/user-text-french/
  TEST.md
  test.yaml
  evals/
    english-button-label/
      eval.yaml                 # expect: fail
      src/lib/Save.svelte       # <button>Save</button>
    billing-code-is-not-copy/
      eval.yaml                 # expect: skip
      src/billing/charge.ts
```

## Commands

- `agent-tests init`: write the config, `.agents/tests/`, and pre-commit hook.
- `agent-tests compile <id>`: print the prompt an agent needs to write `test.yaml`
  and evals from `TEST.md`, then loop on validation and evals.
- `agent-tests list`: show installed Tests.
- `agent-tests validate [id]`: validate one Test, or all Tests when omitted.
- `agent-tests eval [id]`: run one Test's evals, or all Tests' evals when omitted.
- `agent-tests run [id]`: run one Test, or all Tests, on the whole repository;
  narrow with `--changed`, `--staged`, or `--base <ref>`.

A finding names the Test, failing test, path, and `error`. Exit codes are 0 for
clean, 1 for findings, and 2 for setup errors.

## Community

Join [Discord](https://discord.gg/kESK4bgEPW) for questions and ideas, or use
[GitHub Issues](https://github.com/feuersteiner/agent-tests/issues) for bugs and
feature requests. Contributors and agents start with [AGENTS.md](AGENTS.md).

## License

[MIT](LICENSE).
