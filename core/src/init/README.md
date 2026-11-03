# Project initialization

`initializeProject(root, options)` orchestrates `prepareInitialization(root)`,
`createDirectories(result)`, `createFile(result, ...)`, `ignoreEnvironment(result)`,
and `installIntegrations(result, options)`. Preparation creates result state without
filesystem writes. Directory creation canonicalizes the root and rejects symlinks
in the test path; file and integration stages own their respective writes.

Existing configuration, environment examples, hooks, and custom Git hook paths
are preserved. Shared path and ignore-rule helpers belong to `utils.ts`.
`hook`, `vitest`, and `github` select optional integrations. `installVitest(result)`
calls the [Vitest editor](vitest-edit/README.md) through its stage entry before any
config write. Repeated initialization preserves the generated files.

Literal Vitest configurations receive an additive plugin edit. Dynamic configs,
computed root keys (including string literals and getters), quoted root keys, and
escaped property names remain byte-for-byte unchanged with manual-integration
instructions and exit code 2. Any such key could override the effective root
plugins array; successful integration is reported only for supported shapes.

The GitHub workflow checks pull requests against `origin/main`, with full Git
history and locked npm or Bun installation when its lockfile is present. Vitest
is the supported test-suite integration; other test suites are WIP.
