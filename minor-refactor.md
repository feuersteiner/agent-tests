# Minor refactor

Refactor plan. Implement typed selection, directory sources, and engines.
Only directory operations remain deferred until their API is settled.

## Typed selection

- Rename `trigger` / `triggers` to `select`.
- Support two target types: `files` and `directories`.
- Every test must declare `select.type` explicitly. No inferred or default type.
- Use nested `where` statements to select sources step by step.
- Intermediate steps may select directories even when the final target type is
  `files`. The sources returned at the bottom must match the declared type.
- Stop execution when a selection step returns zero sources. Checks receive only
  the sources that reach the final step.

`select.type` declares the final target type, independently of intermediate steps:

```yaml
select:
  type: files
  glob: '**/*-ui/'
  where:
    glob: '*.svelte'
    ask: 'This file displays user-facing text rather than only defining UI structure.'
```

Here, `glob: '**/*-ui/'` first selects directories. Within each selected
directory, `where` selects immediate `*.svelte` files, then `ask` retains those
with user-facing text. Checks run on the resulting files.

Each `where` operates within the directories selected by its parent. It may
contain another `where`, allowing directory traversal in explicit steps. A glob
containing `**` can also select nested descendants within that scope.

Filters at the same level use AND. Run cheap deterministic filters before AI
filters. A file cannot have a child-selection step.

## Sources

Introduce `FileSource` and `DirectorySource` under a shared typed source contract.
Both expose their path and kind.

- `FileSource.open()` returns file content.
- `DirectorySource.open()` returns the directory name and its immediate children.
  Each child includes its name and kind; file children also include their line
  count. Directory children have no line count.
- Directory children remain traversable sources, so subsequent selection steps
  and checks can inspect them and read file contents.

A directory target reaches checks as a directory, rather than being flattened
into independent file targets. Opening one directory does not recursively open
every descendant.

## Engines

Refactor the AI-specific abstraction into a broader `Engines` layer:

- `DecisionalAiEngine`: yes/no AI decisions, including `ask` selection.
- `ReasoningAiEngine`: reasoning-based evaluation.
- `GrepEngine`: content pattern matching.
- `GlobEngine`: path matching.
- `DirectoryEngine`: directory structure predicates; deferred.

`DirectoryEngine` is the suggested name instead of `DirOpsEngine`: it describes
the target and stays consistent with `GrepEngine` and `GlobEngine`.

Engines declare which source types they accept. Selection and checks can use the
same engines where applicable; traversal and selection sequencing belong to the
runner. Unsupported source/engine combinations produce configuration errors.

## Directory predicates — deferred

Support predicates for:

- The number of immediate children.
- The number of children matching an extension or name pattern.
- The directory's own name.
- Its children's names.

Illustrative syntax only:

```yaml
dir:
  name: '*-ui'
  child-count: '>= 5'
  children:
    type: files
    glob: '*.svelte'
    count: '>= 2'
```

This would require a directory named `*-ui`, at least five immediate children,
and at least two immediate Svelte files. Name patterns reuse glob semantics.
Count comparisons support `==`, `!=`, `<`, `>`, `<=`, and `>=`.

These predicates inspect a directory; they do not change the selected target.
`where` handles traversal and changes to the selected sources. Final field names,
recursive counting, and the comparison API remain open.

## Implementation steps

Implement the specified behavior in the following order. Directory predicates
are the only deferred part of this refactor.

### 1. Replace the trigger schema

- [x] Replace `triggers` with `select` in schemas and public configuration types.
- [x] Require `select.type: files | directories`; reject a missing or invalid type.
- [x] Add recursive `where` steps containing the existing `glob`, `grep`, and
      `ask` filters. Retain AND between filters within a step.
- [x] Treat the root `type` as the final target type; allow intermediate directory
      steps when the final type is `files`.

### 2. Introduce typed sources

- [x] Refactor `core/src/shared/source.ts` into a shared source contract with
      `FileSource` and `DirectorySource` implementations.
- [x] Preserve lazy, cached file reads.
- [x] Implement directory snapshots containing the directory name, immediate
      children, and line counts for file children.
- [x] Expose child sources for traversal without eagerly opening descendants.
- [x] Update source creation and consumers to distinguish files and directories.

### 3. Extract engines

- [x] Move the existing decision and reasoning implementations from
      `core/src/shared/ai/` into `DecisionalAiEngine` and `ReasoningAiEngine` under the
      broader engine layer.
- [x] Extract content and path matching from `core/src/trigger/filters.ts` into
      `GrepEngine` and `GlobEngine`.
- [x] Implement source compatibility and result handling for each engine, preserving
      existing configuration, AI thresholds, and evaluation behavior.
- [x] Pass directory snapshots to AI engines when evaluating directory sources.
- [x] Keep traversal in the runner; leave `DirectoryEngine` unimplemented.

### 4. Implement selection steps

- [x] Replace trigger execution with the selection pipeline.
- [x] Evaluate each step within its incoming scope, applying deterministic
      filters before AI filters.
- [x] Feed selected directories into the next `where`; reject child-selection
      steps on files.
- [x] Stop an empty branch immediately. Stop the whole selection when no active
      branch has sources; do not invoke later engines or checks.
- [x] Validate final source types and return each selected target once.
- [x] Trace each step's scope, filters, and selected or skipped sources.

### 5. Integrate checks and migrate callers

- [x] Update `core/src/index.ts`, configuration validation, and public types to
      use selection results and typed sources.
- [x] Pass directory targets intact to compatible checks, allowing inspection of
      structure and child content.
- [x] Report incompatible source/engine combinations clearly during validation
      wherever they can be determined statically.
- [x] Update evals and their fixtures for typed targets and nested selection.
- [x] Migrate repository test YAML, library examples, and documentation from
      triggers to `select`; update public exports and remaining references.

### 6. Verify the refactor

- [x] Verify that missing or invalid `select.type` is rejected.
- [x] Verify existing file-only matching and checks retain their behavior.
- [x] Cover directory-to-file selection, multiple nested directory steps, and
      selection whose final target is a directory.
- [x] Cover an empty intermediate result, including confirmation that later AI
      engines and checks are not called.
- [x] Cover final-type mismatches, incompatible engines, directory snapshots,
      line counts, and duplicate targets reached through overlapping scopes.
- [x] Run the package's type checks and relevant tests.

### Deferred: directory operations

Implement `DirectoryEngine` predicates and their comparison grammar after that
API is settled. Typed directory sources, traversal, snapshots, and directory
checks are part of the refactor above and must not wait for directory operations.

## Implementation notes

The refactor is packaged as a bottom-up PR stack: typed sources, horizontal engines, nested selection, runner integration/documentation, and the community YAML migration. Separate trigger OR groups become separate tests; filter alternatives retain OR behavior. `select.type` is required on every test. Directory operations remain deferred.
