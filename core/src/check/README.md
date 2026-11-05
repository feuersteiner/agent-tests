# Check

Checks judge the sources a test selected. Findings output remains WIP.

[`types.ts`](types.ts) owns the contract. `CheckSchema` requires an `id`, a `description`, an `error`,
and at least one of `grep`, `ask`, or `reason`. Each is a string or a nonempty list of alternatives.
`CheckConfig` is `{ threshold, reasoning, decisionAi, reasoningAi }`; thresholds and reasoning levels
never live in a check.

[`rules.ts`](rules.ts) default-exports `CheckRules`. Each rule is a `SourceRule`,
`(source, param, config) => Promise<boolean>`, where `true` means the source fails:

- `GrepRule` fails on any hit, using case-sensitive JavaScript regexes without flags.
  Every regex compiles before the source is read, and a bad regex throws.
- `AskRule` scores content with `config.decisionAi`. `ask` is a passing condition. Conditions run in
  list order; the first score at `score >= config.threshold` passes, and otherwise the rule fails.
  AI errors propagate.
- `ReasonRule` works like `AskRule` with `config.reasoningAi`, and also forwards `config.reasoning`.

Both AIs are typed as the abstract `AI`, so either can be the stub until real ones are connected.

[`TestsCheck`](index.ts) runs them: `new TestsCheck(checks, config).run(sources)` returns the sources
that pass, in their original order. Definitions must already be validated by the
[`Validator`](../validator.ts).

- Within a check, rules escalate in the order `grep`, `ask`, `reason`, and a check may start at any
  of them. A passing rule passes the check; a failing rule moves on to the next rule present,
  and the last rule's result is final.
- Between checks, selection uses **AND**: a source must pass every check. All checks run on every
  source concurrently.
