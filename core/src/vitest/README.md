# Vitest hosting

`agentTests()` adds an `agent-tests` project through Vitest 5's `configureVitest`
and `injectTestProjects`. Import it from `agent-tests/vitest` and add it to the
top-level `plugins` array in `vitest.config.ts`.

Installed definitions become suites; each applicable check and target becomes
a test. Errors fail, warnings annotate passing tests, unavailable models skip,
and definitions without targets have a skipped test.

Local runs select uncommitted files. CI compares against `origin/main` or the
GitHub pull request's base branch. Pass `scope` to override selection. Normal
Vitest commands run the generated project alongside existing projects.

The plugin retains no source changes. Its temporary project, request cache and
generated test entry are removed when Vitest closes. Exact model requests share
cached answers across watch workers; changed content or provider configuration
requires a new answer. Credentials stay inside each process and never enter
Vitest's provided context.
