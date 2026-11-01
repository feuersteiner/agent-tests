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
