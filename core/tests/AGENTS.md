# tests agent guide

## Layout

- One folder per `src/` folder (`loader/`, `engines/`, `sources/`, `scope/`, `select/`, `assert/`, `eval/`), plus `cli/` for the commands, `agent-tests/` for `AgentTests`, `package/` for the public exports and the Node-only rule, and `helpers/` for the shared helpers below.
- `models/`: a fixture repository of real Tests for the owner's paid model runs, not a suite; see its `AGENTS.md`.
- Test files are kebab-case `*.test.ts`; no snapshot files.

## Rules

- Never reach a model or any network: stub `decide` and `reason` with `stubEngines` or `StubAgentTests`.
- Never read `process.env` or the root `.env`; pass explicit environment maps such as `ENV`.
- Temporary files and repositories live under the OS temp directory, never in the repository; clean up even on failure, through `inTempDir` and `inTempRepo`.
- Always restore the working directory after changing it.
- A source bug, or code that differs from its doc comment or a guide, is never fixed or hidden here: write the documented behavior as `test.failing` with a one-line comment, and report it.

## Running

- `bun run test` (root or `core/`) builds `dist/`, then runs `bun test ./tests`. Do not run `bun test` from the repository root: Bun loads the working directory's `.env` into `process.env`.
- `bun test` runs every file in one process, one file after another, and each file's tests in order; globals, `process.env`, and the working directory carry over between files, so leave them as you found them.
- `bun test` skips dot-folders, so nothing under `models/.agents/` runs.
- `bun run check` type-checks the tests; `tsconfig.build.json` leaves them out of `dist/` and the package.

## Helpers

`temp.ts`

- `makeTempDir = (): string` and `removeDir = (dir: string): void`: a fresh real path under the OS temp directory, and its removal.
- `writeFiles = (root: string, files: Record<string, string>): void`: relative path to content, parents created.

```ts
const dir = makeTempDir();
writeFiles(dir, { 'a/b/c.txt': 'hi' });
```

- `inTempDir = async <T>(files: Record<string, string>, run: (dir: string) => T | Promise<T>): Promise<T>`: runs inside a fresh directory holding `files`, then always restores the working directory and removes it.

```ts
const result = await inTempDir({ 'a.txt': 'a' }, (dir) => {
	return readFileSync('a.txt', 'utf8');
```

`git.ts`: Git runs without the developer's global or system config, and without inherited `GIT_*` variables, such as the author a Git hook exports.

- `git = (cwd: string, ...args: string[]): string`: trimmed stdout; throws on failure.
- `initRepo = (cwd: string): void` and `commitAll = (cwd: string, message?: string): void`: a repository on `main` with a local identity; stages everything and commits.

```ts
initRepo(dir);
commitAll(dir, 'first');
```

- `inTempRepo = async <T>(files: Record<string, string>, run: (dir: string) => T | Promise<T>): Promise<T>`: `inTempDir` plus `initRepo` and one commit of `files`.

```ts
await inTempRepo({ 'a.txt': 'a' }, (dir) => {
	expect(git(dir, 'branch', '--show-current')).toBe('main');
```

`fixtures.ts`

- `ENV: AgentTestEnv`: fake values for `DECISION_KEY` and `REASONING_KEY`, the key variables `validConfig` names.
- `validConfig = (overrides?: Partial<AgentTestConfig>): AgentTestConfig`: `.invalid` model URLs, thresholds 0.5, the loader's default `ignore`.
- `validTest = (overrides?: Partial<AgentTestDefinition>): AgentTestDefinition`: id `no-todo`, select glob `src/**/*.ts`, one assertion `no-todo` with grep `TODO` and error `Remove the TODO.`.
- `toYaml = (value: unknown): string`.
- `configFile = (overrides?: Partial<AgentTestConfig>): Record<string, string>`: the file map holding `agent-tests.config.yaml`.
- `testFolder = (test: AgentTestDefinition, evals?: Record<string, { expect: AgentTestOutcome; files: Record<string, string> }>, rule?: string): Record<string, string>`: the file map of `.agents/tests/<id>/`: `test.yaml`, `TEST.md` when `rule` is given, and each eval's `eval.yaml` and files.

```ts
const evals = { clean: { expect: 'pass' as const, files: { 'src/a.ts': 'ok' } } };
const files = { ...configFile(), ...testFolder(validTest(), evals, 'No TODO.') };
```

`engines.ts`

- `stubEngines = (implementations?: Partial<Record<keyof AgentTestEngines, (input: string, criteria: AgentTestParam) => number | Promise<number>>>): { engines: AgentTestEngines; calls: EngineCall[] }`: records every call as `{ engine, input, criteria }` in order; an engine without an implementation rejects, so `await expect(...).rejects.toThrow()`.

```ts
const { engines, calls } = stubEngines({ grep: () => 2 });
await expect(engines.decide('text', 'Is it fine?')).rejects.toThrow('no implementation');
```

`agent-tests.ts`

- `class StubAgentTests extends AgentTests`, `constructor(config: AgentTestConfig, stubs: Partial<AgentTestEngines> = {})`: the real `AgentTests` built with `ENV`, so `config` must name `DECISION_KEY` and `REASONING_KEY`; the given engines replace the real ones, `decide` and `reason` not given reject, `glob` and `grep` stay real unless given.

```ts
const tests = new StubAgentTests(validConfig(), { decide: async () => 0 });
await expect(tests.run({ kind: 'all' })).rejects.toThrow('reason is not stubbed');
```

`cli.ts`

- `runCli = (args: string[], options: { cwd: string; env?: Record<string, string> }): { exitCode: number; stdout: string; stderr: string; output: string; lines: string[] }`: runs the built `dist/cli/index.js` on Node in `cwd`, which is required; the child gets only `PATH`, `HOME`, and `env`, plus the `.env` of `cwd` the CLI loads itself; `output` is stdout without the banner, `lines` its non-empty lines. Throws when `dist/` is missing or `cwd` is the repository or inside it (compared on real paths), where a real `.env` could be loaded; a temp directory with its own placeholder `.env` is allowed.

```ts
const result = runCli(['list'], { cwd: dir });
expect(result.lines).toEqual(['no-todo  No TODO']);
```
