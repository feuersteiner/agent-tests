# Project initialization

`initializeProject(root, options)` creates configuration, a test directory, an
environment example, and the `.env` ignore rule without replacing existing files.

`hook`, `vitest`, and `github` select optional integrations. Existing hooks and
custom Git hook paths are preserved. Literal Vitest configurations receive an
additive plugin edit; dynamic configurations remain unchanged with instructions
and exit code 2. Repeated initialization preserves the generated files.

The GitHub workflow checks pull requests against `origin/main`, with full Git
history and locked npm or Bun installation when its lockfile is present. Vitest
is the supported test-suite integration; other test suites are WIP.
