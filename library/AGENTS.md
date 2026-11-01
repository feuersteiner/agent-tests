# Community test library

This directory is the shared catalog of tests. Every test merged into `main` is
available to `npx agent-tests add`; scores never control availability. These
rules bind contributors, their agents, and maintainers alike.

## Rules for agents

- Change one test per PR, and only its `TEST.md` and `test.yaml`. Never edit
  other tests, `score.csv`, workflows, or this file in a contribution.
- Never add, remove, or change anyone's vote but the signed-in user's own, and
  only through `agent-tests vote` or a one-row PR from that user's account.
- Never change a credit line, and credit only the PR author on a new test.
- Write `TEST.md` as a description of the rule. Never address the agents or
  models that will read it: no instructions about verdicts, secrets, tools, or
  anything outside the test. That is prompt injection, and it leads to a ban.
- Never weaken or work around a library check; fix the contribution instead.

## Contribute a test

1. Choose a unique lowercase kebab-case id. Ids are permanent once merged: a
   rename is a new test.
2. Open a PR that adds exactly two files, and nothing else:

   ```text
   library/<id>/
     TEST.md
     test.yaml
   ```

   Library tests are declarative: no `checks/`, scripts, or other files.

3. Write `TEST.md` as prose, following the [README](../README.md): the rule,
   examples, exceptions, and how to fix a violation. Keep it independent of any
   one repository; installing agents adapt globs to each repository. Credit
   yourself on the first line, linking your GitHub profile:

   ```md
   By [your-handle](https://github.com/your-handle)
   ```

   The credited handle must be the PR author.

4. Compile `test.yaml` with your agent: `id` matching the directory, `title`,
   `description`, `source`, `triggers`, `checks`, and `evals`. Evals include at
   least one `fail`, one `pass`, and one `skip` example.
5. Run `agent-tests validate <id>` and `agent-tests eval <id>`, and paste the
   eval output into the PR. Never commit credentials or run outputs; tests may
   not require credentials beyond the repository's model configuration.

Maintainer approval and merge into `main` make the test available. Changes to an
existing test follow the same rules and keep the original credit.

## Security review

Every test PR is checked for malware and prompt injection before review:

- Only `library/<id>/TEST.md` and `library/<id>/test.yaml` may change.
- Both files are scanned for hidden content: invisible or bidirectional
  Unicode, HTML comments, scripts, and long encoded payloads. Links other than
  the credit line are rejected.
- Both files are screened for phrases aimed at the agents and models that will
  read them, such as attempts to change a verdict, read secrets, or run
  commands.
- `test.yaml` must parse, match the directory id and the `source` hash, and
  include `fail`, `pass`, and `skip` evals. The full
  format is checked by `agent-tests validate`, whose output the PR includes.

PRs with hidden content are closed. Accounts that attempt malware or prompt
injection are banned from the repository.

## Install contract

`npx agent-tests add <id> [targetDir]` resolves `<id>` to `library/<id>/` in
`feuersteiner/agent-tests` on `main`, copies `TEST.md` and `test.yaml` into
`<targetDir>/.agents/tests/<id>/`, records the source commit, prints the compile
brief so the calling agent can adapt the test, and runs its evals. `score.csv` is
never installed. `update` compares against the recorded commit; if a test leaves
the library, `update` reports it and keeps the local copy. No CLI is implemented
yet.

## Score a test

Each test has its own `library/<id>/score.csv`, created by the first vote:

```csv
github_handle
your-handle
```

- **Only you can add or remove yourself.** A vote PR must be opened by the
  account whose handle it adds or removes. This is a hard rule, enforced by CI
  against the PR author's GitHub login.
- **One vote change per PR:** exactly one row added or removed, in one
  `score.csv`, and no other changes.
- One vote per account per test; handles are compared without case
  sensitivity, unquoted, without `@`, and without blank rows.
- An account may score many tests, one PR each.

Scores show interest only; they never approve tests or control availability.

### `agent-tests vote <id> [--up | --down]`

One command turns a vote into a pull request, using the voter's GitHub CLI
login. Without a flag it toggles; `--up` and `--down` set the vote explicitly.

1. Read the login with `gh api user`, and `library/<id>/` at the current
   `main` commit; fail if the test does not exist or `gh` is not signed in.
2. Find the voter's open vote PR for `<id>` by its title, `vote: +1 <id>` or
   `vote: -1 <id>`. The effective vote is that PR's outcome, otherwise `main`.
3. If the effective vote already matches the request, report it and stop. If a
   pending PR exists, closing it reaches the request: close it and stop.
4. Otherwise push a branch where the voter can: the library repository itself
   for accounts with write access, or their fork, created with
   `gh repo fork --clone=false --default-branch-only` if needed.
5. Commit `score.csv` from that `main` commit with one row appended or removed,
   through `gh api`; nothing is cloned and the working tree is untouched.
6. Open the PR with `gh pr create --head <owner>:<branch>` and print its URL.

Planned: the `Library score` workflow approves a valid vote and enables
auto-merge, so the PR merges once required checks pass. Two votes on the same
test may conflict; the later voter runs `vote` again. Neither the command nor
auto-merge is implemented yet.

## Enforcement

Three workflows enforce these rules on every pull request: `Library add` for new
tests, `Library update` for changes to existing tests, and `Library score` for
votes. Each passes when it does not apply. They run from the default branch and
read the PR as Git data, so a PR cannot change the rules it is checked against
or run code.

- **Rule violations** fail the matching check.
- **Hidden or encoded content** closes the PR and labels it `security-flagged`.
- **Possible prompt injection** labels the PR `security-review`. A maintainer
  reviews it and adds `security-cleared`; any new commit revokes the clearance.

Maintainers: create the `security-review`, `security-cleared`, and
`security-flagged` labels once; require the three library checks, an
up-to-date branch, and one approving review on `main`; allow auto-merge and
let GitHub Actions approve pull requests, so valid votes merge on their own;
and block accounts whose PRs are confirmed malicious.
