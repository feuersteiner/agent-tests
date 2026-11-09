# Shared

Reusable contracts and engines used across feature modules.

- `engines/`: AI scoring and explanations, grep matching, and glob matching.
- `source.ts`: `FileSource`, `DirectorySource`, the `Source` union, and AI input serialization. Callers supply reads; sources perform no filesystem I/O themselves.
- `types.ts`: shared schemas and `Result<T>`, split into flagged and cleared entries.
