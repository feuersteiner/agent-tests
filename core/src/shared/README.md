# Shared

Reusable code shared by feature modules.

- [`ai/`](ai/README.md): AI scoring, explanations, and SDK implementations.
- [`sources/`](sources/index.ts): abstract `Source<Content = string>` defines readonly `path` and `kind` plus synchronous `open(): Content`. Filesystem-backed `FileSource` and `DirectorySource` extend it and use synchronous `node:fs` APIs; callers can define independent subclasses for in-memory content. Runners, results, filters, rules, and eval outcomes accept string-returning `Source` instances. Glob only reads paths; grep, ask, and reason consume source text directly.
  - `new FileSource(path).open()` lazily reads and caches UTF-8 text, including empty strings. Failed reads throw and can retry.
  - `new InMemorySource(path, content).open()` returns supplied text without filesystem reads. Evals use it for authored examples whose paths need not exist on disk.
  - `new DirectorySource(path).open()` lazily reads and caches a text listing with a directory header and one line per immediate child showing its path and kind. Files also show their line count, including zero for empty files. Immediate files are read for counts; child directories stay unopened. Symlinks follow their target's kind. Failures throw and can retry. The resulting text works with ask and reason. Grep warns that it is not designed for directory output, then continues matching.
  - Empty files have zero lines. LF, CRLF, and CR delimit lines; a terminal delimiter adds no phantom line.
- [`types.ts`](types.ts): `IdSchema`, `TextSchema`, and `ParamSchema`, plus `Result<T>`, `{ flagged, cleared }`, returned by triggers, checks, and evals.
