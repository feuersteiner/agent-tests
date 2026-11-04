# Shared

Reusable code shared by feature modules belongs here.

- [`ai/`](ai/README.md): shared AI scoring, explanations, and SDK implementations.
- [`Source`](source.ts): extensible content source constructed with `new Source(path, getter)`.

`Source.path` identifies the source; async `open()` calls the supplied `() => Promise<string>` getter.
Sources make no filesystem assumptions; callers supply content retrieval and may extend `Source`.
