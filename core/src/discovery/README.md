# Discovery

Discover compiled `.agents/tests/<id>/test.yaml` rules and select their candidate files without writes.

`discoverTests(root)` assigns each rule an owner, `.` for the root or its relative directory.
Parent and nested rules compound, including rules sharing an ID.
A descendant `.agents/tests/config.yaml` can disable inherited IDs with `disable: [id]`;
`owner/id` selects a specific ancestor definition (`./id` selects the root definition).
Exemptions never disable that package's own definition.

`collectCandidates(root, scope)` reads ordinary text files, excluding symbolic links,
binary content, test definitions, Git metadata, dependencies, and build outputs.
Git repositories respect ignored and untracked paths.
`changed` selects staged, unstaged, and untracked changes; `staged` reads the index snapshot;
`base` selects changes from a merge base to HEAD.
Only one Git scope can be selected, and `paths` restricts it with files, directories, or globs.
Git scopes outside a repository fail explicitly.

`testsForFile` applies owner boundaries and descendant exemptions.
`formatTestTree` renders discovered rules in stable owner and ID order.

Stage ownership: [candidate selection](candidates/README.md),
[package discovery](load-packages/README.md), [rule directory discovery](directories/README.md),
[Git selection](git-paths/README.md), and [directory traversal](walk-directories/README.md).
Their `index.ts` files own orchestration. The discovery barrel preserves the package API;
filesystem/path predicates and Git execution each have a single-function stage file.
Absolute path filters canonicalize existing ancestors while retaining glob suffixes.
