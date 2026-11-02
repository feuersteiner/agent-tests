# Vitest hosting

`agentTests()` adds an `agent-tests` project through Vitest 5's `configureVitest`
and `injectTestProjects`. Import it from `agent-tests/vitest` and add it to the
top-level `plugins` array in `vitest.config.ts`.

The entry owns one plugin state. `prepareProject()` calls `createProject()` to
select scope, collect targets and write a generated entry, then `injectProject()`
to register the independent Node project. Temporary project paths are canonicalized
before deriving the entry and cache paths so watch notifications match Vitest's
real file identities, including symlinked temporary directories on macOS.

`collectHostedGroups()` discovers definitions and candidate files, loads the
configured cached model and resolves owner-relative triggers. `selectHostedScope()`
chooses explicit scopes first; local runs otherwise select uncommitted files and CI
compares against `origin/main` or the GitHub pull request's base branch.

The generated entry calls `registerHostedTests()`. Installed definitions become
suites; `registerPair()` registers each applicable check/target combination. Errors
fail, warnings annotate passing tests, unavailable models skip, and definitions
without targets have a skipped test. Staged content stays pinned; other content is
reread in the worker. Normal Vitest commands run this project alongside existing
projects.

In watch mode, [watchProject()](watch/README.md) refreshes targets serially, republishes
worker data and writes the canonical generated entry only when inputs change or
collection recovers. Collection failures become a failing hosted test.
`cleanupProject()` releases watcher listeners, drains queued refreshes and removes
the temporary project and request cache when Vitest closes.

[createCachedModel()](cache/README.md) shares exact model answers across watch
workers; changed content or provider configuration requires a new answer.
Credentials stay inside each process and never enter Vitest's provided context.
Setup and filesystem errors propagate to Vitest; no live processes are retained.

The [preparation stage](prepare/README.md) owns generated-project creation and injection.
