# Trigger filters

[`Filter<Params>`](filter/index.ts) is abstract; readonly `run(input, params, config): Promise<boolean>`
validates params before matching. Import concrete classes from their modules:

- [PathMatchFilter](filter/path-match.ts): POSIX path globs via `node:path.posix.matchesGlob`.
- [ContentMatchFilter](filter/content-match.ts): local, case-sensitive JavaScript regexes without flags.
- [PathAskFilter](filter/path-ask.ts): AI evaluates the supplied path against a passing condition.
- [ContentAskFilter](filter/content-ask.ts): AI evaluates supplied content against a passing condition.

Match params are a string or nonempty string array; arrays are alternatives.
Path `*` stays within a segment; `**` crosses directories; ordinary wildcards exclude leading dots.
Content filters compile every regex before matching. Validation, regex, and AI errors reject `run`.

Only ask constructors take an injected [AI](../ai/index.ts); ask params are passing-condition strings.
Every execution requires `{ threshold: number }`; ask returns `rawScore >= config.threshold`.
Match filters ignore config. Threshold validation, defaults, and provider setup belong to the caller.
Filters do not store config or threshold. The package root's `Trigger` remains the shared YAML type.

Trigger orchestration remains pending; no interface has been agreed.
