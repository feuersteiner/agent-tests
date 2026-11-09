---
name: run-agent-tests
description: Check code against the project's agent tests (the rules in .agents/tests/) and report what breaks them, by file, line, and rule, with the fix. Use when the user asks to "run the agent tests", "check my changes against our rules", "check before I commit", or review a branch or PR against project rules, and after you finish an edit in a repository that has .agents/tests/.
---

# Run agent tests

Check files against every installed agent test and report findings. This skill
only reports. Never change application code, test files, or labels while
running it. Fix code only if the user asks, and then re-run to confirm.

## Status of agent-tests (read first)

As of agent-tests 0.8.0 the `agent-tests run` command does nothing. This skill
runs the library through `scripts/run-all.ts`, which needs Bun and a checkout
of `feuersteiner/agent-tests` with dependencies installed
(`bun install --ignore-scripts --frozen-lockfile --linker=hoisted`); set
`AGENT_TESTS_CORE=/path/to/agent-tests/core`.

It also needs `agent-tests.config.yaml` at the repository root (see the
`enforce-project-rules` skill) with both key variables set. A test with no
`ask` or `reason` never calls a model, so placeholder key values work when every
test is regex-only. If a test uses `ask` or `reason` and the keys are missing,
say so and stop; don't report a partial run as complete.

Planned but not implemented: per-directory `config.yaml` opt-outs, warnings,
`unsure` results, and `human-tiebreak`. Don't claim them.

## Pick the scope

Match what the user asked for. If they didn't say, use `--changed` after your
own edits and the whole repository otherwise.

| User intent                      | Command                              |
| -------------------------------- | ------------------------------------ |
| Whole repository (CI-style)      | `bun scripts/run-all.ts`             |
| What I changed (incl. untracked) | `bun scripts/run-all.ts --changed`   |
| What I'm about to commit         | `bun scripts/run-all.ts --staged`    |
| This branch / PR against `main`  | `bun scripts/run-all.ts --base main` |
| One rule only                    | add `--test <id>` (repeatable)       |

Run it from the repository root. A test in `<dir>/.agents/tests/` applies only
to files under `<dir>`, on top of the tests from parent directories.

Exit codes: `0` no findings, `1` findings, `2` setup problem or invalid test.

## Workflow

1. **Run** the command for the chosen scope and read the whole output.
2. **Handle invalid tests.** An `invalid test` line means its `test.yaml` does
   not match the current schema or is stale. Report it; offer to recompile it
   with the `compile-agent-test` skill. Don't skip it silently.
3. **Triage each finding.** Open the file at the reported lines (lines come from
   the check's regex; model-only checks give just the file). Read the test's
   `TEST.md` and decide:
   - **Violation:** the code breaks the rule as `TEST.md` states it.
   - **False positive:** `TEST.md` explicitly allows this case (an exception),
     or the regex matched something unrelated. Quote the sentence of `TEST.md`
     or the matched text that shows it.
     Never dismiss a finding because fixing it is inconvenient. When unsure, call
     it a violation and say why you are unsure.
4. **Report** in this shape:

   ```text
   Checked 14 changed files against 3 tests: 2 violations, 1 false positive.

   Violations
   - src/lib/Save.svelte:12 — user-text-french/french-only
     "Save" is shown to users in English. Fix: translate to "Enregistrer".

   False positives
   - docs/quotes.md:4 — no-informal-english/formal-vocabulary
     "gonna" is inside a quoted customer message; TEST.md excludes quotations.
     Suggest: add a pass eval for this and recompile the test.
   ```

   Always state the scope, the number of tests and files, and anything that
   did not run (invalid tests, missing keys).

5. **Feed false positives back.** Each one is a bug in the test, not the code.
   Offer to add it as a `pass` eval and recompile with `compile-agent-test`.
   Don't edit `test.yaml` without the user's go-ahead.
6. **If the user asks you to fix violations,** fix them, then re-run the same
   command and report the new result.

## Rules

- Never say the code passes unless the run finished and you saw the output.
- Never delete, weaken, or skip a test to make a run green.
- Never change a test while running it; test changes go through `compile-agent-test`.
- Don't commit `agent-tests.config.yaml` secrets; it only names env variables.
