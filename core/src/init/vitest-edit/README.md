# Additive Vitest configuration editing

`editVitestConfiguration(source)` calls `inspectConfiguration(source)` then
`renderConfiguration(source, inspection)`. Both steps operate on source text;
filesystem reads and writes belong to `installVitest` in the parent stage.

Inspection masks comments and strings while retaining offsets, locates the
exported root object and plugins array, and resolves active plugin import aliases
through helpers in `utils.ts`. Computed, quoted, escaped, duplicate, spread, or
dynamic root plugin keys cannot prove a safe effective plugins array. Inspection
returns manual-integration instructions for unsupported shapes before rendering.
Nested properties do not override the root array.

Rendering preserves unsupported source and already-installed plugins, otherwise
adds one plugin invocation and an import when needed. The result contains edited
content, a manual-integration reason, or neither for an existing integration.
The calling installer maps manual integration to exit code 2 and leaves the
original file unchanged. Internal offsets and inspection state belong to `types.ts`.
