# Prepare hosted projects

`prepareProject()` orchestrates `createProject()`, `injectProject()` and, only in
watch mode, `watchProject()`.

`createProject()` allocates a temporary directory, retains its original path for
cleanup and resolves its canonical path before deriving generated-entry, answer
cache and Vite-cache paths. It selects the file scope, collects initial targets
and writes the runner import. Source checkouts use the TypeScript runner; packed
consumers use emitted JavaScript.

`injectProject()` configures an independent Node project and supplies serializable
hosted data. `watchProject()` subscribes after successful injection. Setup errors
propagate; the plugin's cleanup hook can remove a partially prepared directory.
