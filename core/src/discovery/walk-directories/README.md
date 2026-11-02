# Directory traversal

`walkDirectories(root)` accumulates directories through `visitDirectory` in stable
depth-first order. Only real directories are visited; symlinks are not followed.
The shared `isExcludedDirectory` stage excludes `.agents`, Git metadata,
dependencies, and generated output including `.next`.
The input root must exist and use the caller's desired canonical spelling.
Read failures propagate; this stage performs no writes. Callers import `index.ts`.
