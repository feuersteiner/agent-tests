# Git path selection

`gitPaths(root, scope)` calls `readScopePaths`, then decodes each NUL-delimited
output with `splitPaths`, deduplicates, and sorts the paths.
Changed scope unions independent cached, working-tree, and untracked selections,
including unborn repositories. Staged scope reads the index; base scope selects
merge-base-to-HEAD paths. Git failures and invalid references propagate. No writes occur.
