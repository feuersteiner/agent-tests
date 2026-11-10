# CLI

The CLI requires Bun. Run the standalone fixture workflow from the workspace:

```sh
bun run demo
```

This executes every command against a temporary copy of `core/fixtures/repository`,
which contains a real YAML config, 13 agent-test definitions, code, and business
documents. The demo injects failures, verifies their exit codes and output,
restores each change, and checks recovery. Interactive runs pause before each step.
Config loading resolves `agent-tests.config.yaml`, reads it, parses YAML, and
calls the existing `validateConfig`. Repository commands then load and validate
definitions, collect file and directory sources, and construct `AgentTests`.
Directory sources expose immediate-child listings; globs scope which source paths
each test inspects.

Source discovery uses the config's top-level `ignore` glob list:

```yaml
ignore: ['**/.git', '**/.agents', '**/node_modules']
```

These are the defaults when omitted. An explicit list replaces the defaults;
`ignore: []` disables ignoring. All other files and directories are discovered.
Paths are relative to the repository root, and patterns can match dotfiles.
Ignored directories are not traversed. Definition loading remains independent of
this list.
Selected directory listings still show their complete immediate contents.

CLI code is grouped by responsibility:

- `index.ts`: registers commands and runs Clinguini.
- `commands/`: each command owns its arguments and handler in one TypeScript file.
- `config/`: loads config and definitions, gathers sources, and constructs the runner.
- `sources/`: discovers file and directory sources.
- `config/banner.ts`: terminal banner.

Git selectors (`--staged`, `--changed`, `--base`) and propagation of descendant
changes to directory eligibility belong in `sources/`; implementation remains WIP.
Changed descendants should make a directory eligible while checks inspect its
complete current contents, including unchanged siblings.

| Command         | Current behavior                        |
| --------------- | --------------------------------------- |
| `init`          | Scaffold                                |
| `add <id>`      | Scaffold                                |
| `list`          | Load and list definitions               |
| `validate [id]` | Validate config and definitions         |
| `targets <id>`  | Load runner; action remains scaffolded  |
| `compile <id>`  | Load runner; action remains scaffolded  |
| `eval [id]`     | Execute labeled examples                |
| `run [id]`      | Execute checks on files and directories |
| `docs`          | Scaffold                                |
| `vote <id>`     | Scaffold                                |

Omitting an optional ID selects all definitions. An unknown ID fails.
`run` accepts `--changed`, `--staged`, and `--base <ref>` but reports that Git scope
selection is pending and runs the full source set. No Git or network operations
are performed by scaffold commands. Violations and eval mismatches exit 1;
configuration/read failures also fail the command. Invalid CLI arguments exit 2.

Help works without repository configuration. The executable disables automatic
dotenv loading; provider keys must be in the process environment. The demo supplies
a dummy key and a local stub model. Semantic fixture examples verify execution,
not the accuracy of an AI model. See [`../fixtures/README.md`](../fixtures/README.md)
for the scenario list and current limitations.
