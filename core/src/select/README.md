# Select

`types.ts` defines the standalone selection grammar. Runtime execution and integration
with test definitions are not implemented yet.

```yaml
select:
  - id: effect-heavy-components
    from: files
    where:
      - path:
          glob: 'src/**/*.svelte'
      - content:
          grep: '\$effect'
          count:
            more-or-equals: 11
      - content:
          ask: 'This file defines a UI component.'

  - id: crowded-route-folders
    from: directories
    where:
      - path:
          glob: 'src/routes/**'
      - content:
          ask: 'This folder looks like a feature module.'
      - children:
          from: files
          where:
            - path:
                glob: '*.svelte'
            - content:
                grep: '\$effect'
          count:
            more-or-equals: 6
```

Selectors combine with OR and deduplicate targets. Conditions in `where` combine
with AND. Patterns within an engine combine with OR. Each condition contains
exactly one subject and one engine, or one `children` query.

| Subject    | From        | Engines                 | Count                        |
| ---------- | ----------- | ----------------------- | ---------------------------- |
| `path`     | Either      | `glob`, `grep`          | None                         |
| `content`  | Files       | `grep`, `ask`           | Regex occurrences, grep only |
| `content`  | Directories | `ask`                   | None                         |
| `children` | Directories | Nested `from` + `where` | Matching immediate children  |

- `from` is required. Omitted or empty `where` accepts every target of that kind.
- An empty selector list selects nothing.
- Directory content is the rendered immediate tree with child metadata.
- Every children query independently inspects the same immediate children, using
  parent-relative paths, and qualifies the parent directory. Recursion is forbidden.
- Omitted `count` means at least one match. Explicit zero comparisons are valid.
- Counts are nonnegative integers. A nonempty comparison object supports `equals`,
  `different-from`, `more-than`, `less-than`, `more-or-equals`, and `less-or-equals`.
  Multiple comparisons combine with AND.
- Counted grep accepts one regex until counting alternatives has defined semantics.
  Uncounted grep, glob, and ask accept one pattern/criterion or a nonempty OR list.
- These schemas validate structure. Regex compilation and duplicate selector IDs
  belong to configuration validation when selection is integrated.

Invalid conditions include:

```yaml
# Two engines in one condition.
path:
  glob: '*.ts'
  grep: TODO
```

```yaml
# Ask does not count occurrences.
content:
  ask: 'Contains unfinished work.'
  count:
    equals: 0
```

```yaml
# Query children instead of applying grep to a directory listing.
id: invalid-directory-grep
from: directories
where:
  - content:
      grep: TODO
```

Run the schema examples with `bun test core/fixtures/select.test.ts`.
