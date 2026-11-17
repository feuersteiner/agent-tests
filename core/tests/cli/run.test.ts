import { describe, expect, test } from 'bun:test';
import { devNull } from 'node:os';
import { dirname } from 'node:path';
import type { AgentTestEnv } from '../../src/engines/types.ts';
import type { AgentTestDefinition } from '../../src/loader/types.ts';
import { runCli } from '../helpers/cli.ts';
import { configFile, ENV, testFolder, validTest } from '../helpers/fixtures.ts';
import { commitAll, git, inTempRepo } from '../helpers/git.ts';
import { inTempDir, writeFiles } from '../helpers/temp.ts';

/** The set variables of an environment map, as `runCli` takes them, plus Git without the developer's global or system config. */
const toCliEnv = (env: AgentTestEnv): Record<string, string> => ({
	...Object.fromEntries(
		Object.entries(env).filter((entry): entry is [string, string] => entry[1] !== undefined)
	),
	GIT_CONFIG_GLOBAL: devNull,
	GIT_CONFIG_NOSYSTEM: '1'
});

/** The placeholder keys the config names. */
const env = toCliEnv(ENV);

/** The finding lines of a run: progress lines never hold two spaces in a row, finding lines always do. */
const findingLines = (lines: string[]): string[] => lines.filter((line) => line.includes('  '));

/** `no-todo`, whose assertion id differs from the Test id, so the line shows which is which. */
const noTodo = validTest({
	assert: [{ id: 'todo-free', description: 'No TODO.', error: 'Remove the TODO.', grep: 'TODO' }]
});

/** `no-fixme`, a second glob and grep only Test. */
const noFixme: AgentTestDefinition = validTest({
	id: 'no-fixme',
	title: 'No FIXME',
	assert: [
		{ id: 'fixme-free', description: 'No FIXME.', error: 'Remove the FIXME.', grep: 'FIXME' }
	]
});

/** The config and both Tests. */
const setup = { ...configFile(), ...testFolder(noTodo), ...testFolder(noFixme) };

/** The finding line `no-todo` reports for `path`. */
const todoLine = (path: string): string => `${path}  no-todo/todo-free  Remove the TODO.`;

/** The finding line `no-fixme` reports for `path`. */
const fixmeLine = (path: string): string => `${path}  no-fixme/fixme-free  Remove the FIXME.`;

describe('agent-tests run', () => {
	test('exits 0 with no finding line when no source fails', async () => {
		await inTempRepo({ ...setup, 'src/a.ts': 'export const a = 1;\n' }, (dir) => {
			const result = runCli(['run'], { cwd: dir, env });
			expect(result.exitCode).toBe(0);
			expect(findingLines(result.lines)).toEqual([]);
		});
	});

	test('exits 1 with one `path  test/assertion  error` line per finding', async () => {
		const files = {
			...setup,
			'src/a.ts': '// TODO: a\n',
			'src/b.ts': '// TODO and FIXME\n',
			'src/clean.ts': 'export const c = 3;\n'
		};
		await inTempRepo(files, (dir) => {
			const result = runCli(['run'], { cwd: dir, env });
			expect(result.exitCode).toBe(1);
			expect(findingLines(result.lines).sort()).toEqual(
				[todoLine('src/a.ts'), todoLine('src/b.ts'), fixmeLine('src/b.ts')].sort()
			);
		});
	});

	test('run <id> runs only the Test with that id', async () => {
		await inTempRepo({ ...setup, 'src/a.ts': '// TODO and FIXME\n' }, (dir) => {
			const result = runCli(['run', 'no-fixme'], { cwd: dir, env });
			expect(result.exitCode).toBe(1);
			expect(findingLines(result.lines)).toEqual([fixmeLine('src/a.ts')]);
		});
	});

	test('an unknown id exits 2 with Error: on stderr', async () => {
		await inTempRepo({ ...setup, 'src/a.ts': '// TODO\n' }, (dir) => {
			const result = runCli(['run', 'no-such-test'], { cwd: dir, env });
			expect(result.exitCode).toBe(2);
			expect(result.stderr).toBe('Error: Unknown test: no-such-test\n');
			expect(findingLines(result.lines)).toEqual([]);
		});
	});

	test('--changed limits the files to uncommitted ones', async () => {
		const files = { ...setup, 'src/committed.ts': '// TODO\n', 'src/edited.ts': 'ok\n' };
		await inTempRepo(files, (dir) => {
			writeFiles(dir, { 'src/edited.ts': '// TODO\n', 'src/new.ts': '// TODO\n' });
			const result = runCli(['run', '--changed'], { cwd: dir, env });
			expect(result.exitCode).toBe(1);
			expect(findingLines(result.lines)).toEqual([
				todoLine('src/edited.ts'),
				todoLine('src/new.ts')
			]);
		});
	});

	test('--staged limits the files to staged ones', async () => {
		const files = { ...setup, 'src/committed.ts': '// TODO\n', 'src/unstaged.ts': 'ok\n' };
		await inTempRepo(files, (dir) => {
			writeFiles(dir, { 'src/staged.ts': '// TODO\n', 'src/unstaged.ts': '// TODO\n' });
			git(dir, 'add', 'src/staged.ts');
			const result = runCli(['run', '--staged'], { cwd: dir, env });
			expect(result.exitCode).toBe(1);
			expect(findingLines(result.lines)).toEqual([todoLine('src/staged.ts')]);
		});
	});

	test('--base <ref> limits the files to those changed since the ref', async () => {
		await inTempRepo({ ...setup, 'src/old.ts': '// TODO\n' }, (dir) => {
			git(dir, 'switch', '--quiet', '--create', 'feature');
			writeFiles(dir, { 'src/feature.ts': '// TODO\n' });
			commitAll(dir, 'feature work');
			writeFiles(dir, { 'src/uncommitted.ts': '// TODO\n' });
			const result = runCli(['run', '--base', 'main'], { cwd: dir, env });
			expect(result.exitCode).toBe(1);
			expect(findingLines(result.lines)).toEqual([todoLine('src/feature.ts')]);
		});
	});

	const scopePairs: [string, string[]][] = [
		['--changed and --staged', ['--changed', '--staged']],
		['--changed and --base', ['--changed', '--base', 'main']],
		['--staged and --base', ['--staged', '--base', 'main']]
	];

	test.each(scopePairs)('two scope flags together exit 2: %s', async (_name, flags) => {
		await inTempRepo({ ...setup, 'src/a.ts': '// TODO\n' }, (dir) => {
			const result = runCli(['run', ...flags], { cwd: dir, env });
			expect(result.exitCode).toBe(2);
			expect(result.stderr).toBe('Error: Use only one of --changed, --staged, and --base\n');
		});
	});

	test('a missing config exits 2 with the init hint', async () => {
		const files = { ...testFolder(noTodo), 'src/a.ts': '// TODO\n' };
		await inTempRepo(files, (dir) => {
			const result = runCli(['run'], { cwd: dir, env });
			expect(result.exitCode).toBe(2);
			expect(result.stderr).toBe(
				'Error: Missing agent-tests.config.yaml; run `agent-tests init`\n'
			);
		});
	});

	test.each(['DECISION_KEY', 'REASONING_KEY'])(
		'a missing %s exits 2 naming it, even for glob and grep only Tests',
		async (name) => {
			await inTempRepo({ ...setup, 'src/a.ts': '// TODO\n' }, (dir) => {
				const result = runCli(['run'], { cwd: dir, env: toCliEnv({ ...ENV, [name]: undefined }) });
				expect(result.exitCode).toBe(2);
				expect(result.stderr).toBe(`Error: Missing environment variable: ${name}\n`);
			});
		}
	);

	test('outside a Git repository exits 2', async () => {
		await inTempDir({ ...setup, 'src/a.ts': '// TODO\n' }, (dir) => {
			const outside = { ...env, GIT_CEILING_DIRECTORIES: dirname(dir) };
			const result = runCli(['run'], { cwd: dir, env: outside });
			expect(result.exitCode).toBe(2);
			expect(result.stderr).toStartWith('Error: ');
			expect(result.stderr).toContain('not a git repository');
			expect(findingLines(result.lines)).toEqual([]);
		});
	});

	test('findings go to stdout and errors to stderr', async () => {
		await inTempRepo({ ...setup, 'src/a.ts': '// TODO\n' }, (dir) => {
			const found = runCli(['run', 'no-todo'], { cwd: dir, env });
			expect(found.stdout).toContain(`${todoLine('src/a.ts')}\n`);
			expect(found.stderr).toBe('');
			const failed = runCli(['run', 'no-such-test'], { cwd: dir, env });
			expect(failed.stderr).toStartWith('Error: ');
			expect(failed.stdout).not.toContain('Error:');
		});
	});
});
