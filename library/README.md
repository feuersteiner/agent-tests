# Community library

Shared agent tests anyone can install with `npx agent-tests add <test-id>`.
Every test merged into `main` is available. The CLI is WIP.

## Contribute a test

Open a pull request that adds `library/<test-id>/` with exactly two files:

- `TEST.md`: the rule in prose, starting with a credit line that links your
  GitHub profile: `By [your-handle](https://github.com/your-handle)`.
- `test.yaml`: compiled by your agent, with labeled `fail`, `pass`, and `skip`
  examples.

Ids are permanent. Library tests are declarative: no scripts or custom code.

## Vote for a test

Run `npx agent-tests vote <test-id>` to toggle your vote, or `--up` and
`--down` to set it. It opens a pull request from your GitHub CLI login that
adds or removes your handle in the test's `score.csv`. Only you can vote for
yourself, one vote per pull request. Votes show interest and never gate
availability.

## Security

Every pull request is checked automatically. Hidden content closes it, and
possible prompt injection waits for a maintainer. Accounts that attempt malware
or prompt injection are banned.

The full rules, for contributors and their agents, are in
[`AGENTS.md`](AGENTS.md).
