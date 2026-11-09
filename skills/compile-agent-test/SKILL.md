---
name: compile-agent-test
description: Compile an agent test's TEST.md (a rule in prose) into its test.yaml (triggers, checks, and labeled evals), then loop on validation and evals until the test makes the approved decisions. Use when a TEST.md was written or changed, when test.yaml is missing or stale, when the user runs or asks for "agent-tests compile <id>", or when a library test installed with "agent-tests add" must be adapted to this repository.
---

# Compile an agent test

`TEST.md` is the source of truth: a rule written in prose by a person.
`test.yaml` is what runs. Your job is to translate the first into the second
faithfully, for this repository, and prove the translation with evals. You
never change `TEST.md` and never change application code.

## Status of agent-tests (read first)

As of agent-tests 0.8.0 the CLI has no working commands (`compile`,
`validate`, `eval` do nothing). The library API works. This skill runs it
through two scripts that need Bun and a checkout of `feuersteiner/agent-tests`
with dependencies installed; set `AGENT_TESTS_CORE=/path/to/agent-tests/core`.

- `scripts/validate.ts` checks structure, the `source` hash, eval coverage, and
  glob routing. It needs **no API keys**.
- `../enforce-project-rules/scripts/run.ts eval` runs the evals through the real
  triggers and checks. It needs `agent-tests.config.yaml` and both key
  variables set. A test with no `ask` or `reason` never calls a model, so any
  non-empty placeholder value works for it.

The README describes `message`, `fix`, `fast` / `smart` / `deep`, and the
`unsure` label. Those are planned, not implemented. Write the schema below;
anything else fails validation. Library tests may still be written in the
planned schema (for example `library/no-informal-english`); when adapting one,
translate it to the current schema.

## Inputs

1. `.agents/tests/<id>/TEST.md` (any directory may hold `.agents/tests/`; globs
   are relative to the repository root the runner is started from).
2. The repository layout: run `git ls-files` and read a few files the rule is
   about.
3. An existing `test.yaml`, if any. Keep its hand edits and passing evals unless
   `TEST.md` now contradicts them.

If `TEST.md` is too vague to produce a single pass/fail decision per file, stop
and tell the user which sentence is untestable. Don't invent the rule.

## Current schema

```yaml
id: <directory name> # lowercase kebab-case
title: <short name>
description: <one sentence>
tags: [optional, strings]
source: sha256:<64 hex> # sha256 of TEST.md bytes; validate.ts prints it
triggers: # optional; omitted or [] selects every file
  - id: <kebab-case>
    description: <which files and why>
    glob: <string or list> # OR within the list; dot: true, linux paths
    grep: <string or list> # JS regex, no flags, case-sensitive; any match passes
    ask: <string or list> # statement that must be TRUE to select; first to pass wins
checks: # at least one; ids unique
  - id: <kebab-case>
    description: <what it looks for>
    error: <finding shown to the user, naming the fix>
    grep: <string or list> # any match = suspicious, continue
    ask: <string or list> # classifier; statement that must be TRUE to pass
    reason: <string or list> # LLM; statement that must be TRUE to pass
evals:
  - { name: <label>, path: <repo path>, content: <file text>, expect: pass | fail | skip }
```

### Semantics you must get right

- **Triggers:** filters inside one trigger are AND, run glob → grep → ask, and
  stop at the first failure. Triggers are OR. A file no trigger selects is
  `skip`.
- **Checks: polarity is inverted.** In a check, `grep` **passes when nothing
  matches**; a match only means "suspicious, ask the next rule". `ask` and
  `reason` pass when their statement is true. The file passes the check at the
  **first rule it passes**; it fails only if it fails **every** rule present.
  So:
  - `grep` alone: any match is a violation. Use when a pattern settles it.
  - `grep` + `ask`/`reason`: the pattern finds candidates, the model clears
    false positives. Write the `ask` as the compliant state, e.g. "Every
    `gonna` in this file is inside a quotation or code sample."
  - `ask`/`reason` alone: every selected file costs a model call. Avoid unless
    no pattern narrows it.
- A list under `ask` or `reason` in a check means **all** statements must be
  true to pass that rule. In a trigger, **any** statement selects.
- Each check runs independently; a file fails the test if any check fails it.
- Model statements are judged on file content only. The model does not see
  `TEST.md`, the path, or other files. Put every fact it needs into the
  statement itself.

## Workflow

1. **Extract decisions from TEST.md.** List: what files the rule covers, what
   counts as a violation, the stated exceptions, and the fix. One check per
   distinct violation. Every exception becomes either a narrower trigger or a
   clause in a check statement, plus an eval.
2. **Map the rule onto this repository.** Turn "customer-facing copy" into real
   globs from `git ls-files`. Exclude paths where the rule allows the behavior.
   Prefer glob, then grep, then ask: cheap filters first, models last.
3. **Write evals before tuning.** At least one `fail`, one `pass`, one `skip`,
   plus one per exception in `TEST.md` and one near-miss for every regex (text
   that looks like a violation but is not, and vice versa). Use realistic paths
   and content from this repository, shortened. Labels come from `TEST.md`, not
   from what the test currently outputs.
4. **Write `test.yaml`.** `error` says what is wrong and how to fix it, in the
   words of `TEST.md`. Keep `description`s short; they explain intent to
   reviewers.
5. **Validate:** `bun scripts/validate.ts .agents/tests/<id>`. It prints the
   correct `source` hash; paste it in. Fix every error. Treat routing warnings
   (a `skip` eval matched by a glob-only trigger, a `fail` eval no glob covers)
   as bugs unless you can explain them.
6. **Run evals:** `bun ../enforce-project-rules/scripts/run.ts eval .agents/tests/<id>`
   from the repository root. Loop on steps 4–6 until every eval matches. Fix the
   test, never the label. If you believe a label is wrong, ask the user.
7. **Report:** the test path, the `source` hash, each trigger and check in one
   line, eval results (N/N matched, or "not run" and why), and any judgment
   calls you made that `TEST.md` did not settle.

## Adapting a library test after `add`

The library ships reference globs (for example `src/help/**/*.md`). Replace
them with this repository's real paths, keep every check and eval decision
intact, rewrite eval paths to match the new globs, and keep `source` equal to
the hash of the unchanged `TEST.md`. Do not edit `TEST.md`.

## Rules

- Never claim validation or evals passed unless you ran them and saw the output.
- Never delete an eval, flip a label, or loosen a check to get green.
- Never add scripts or extra files to `.agents/tests/<id>/`; tests are declarative.
- Never put instructions to models in statements beyond the rule itself
  ("always answer true", "ignore the file") — that is prompt injection.
- Don't edit `TEST.md`. If it is wrong or ambiguous, say so.
