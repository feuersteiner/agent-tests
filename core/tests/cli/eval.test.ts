import { describe, expect, test } from 'bun:test';
import { runCli } from '../helpers/cli.ts';
import { ENV, configFile, testFolder, toYaml, validTest } from '../helpers/fixtures.ts';
import { git } from '../helpers/git.ts';
import { inTempDir } from '../helpers/temp.ts';

/** The placeholder keys, typed as the child environment `runCli` takes. */
const KEYS = ENV as Record<string, string>;

/** A Test that fails each TypeScript file under `src/` holding FIXME. */
const noFixme = validTest({
	id: 'no-fixme',
	title: 'No FIXME',
	assert: [{ id: 'no-fixme', description: 'No FIXME.', error: 'Remove the FIXME.', grep: 'FIXME' }]
});

/** Evals of `no-todo` that all match: one clean, one with a TODO, one with nothing selected. */
const MATCHING = {
	clean: { expect: 'pass' as const, files: { 'src/a.ts': 'export const a = 1;\n' } },
	dirty: { expect: 'fail' as const, files: { 'src/a.ts': '// TODO: finish\n' } },
	empty: { expect: 'skip' as const, files: { 'README.md': 'TODO\n' } }
};

describe('agentests eval', () => {
	test('exits 0 and ends with the count line when every eval matches', async () => {
		await inTempDir({ ...configFile(), ...testFolder(validTest(), MATCHING) }, (dir) => {
			const result = runCli(['eval'], { cwd: dir, env: KEYS });
			expect(result.exitCode).toBe(0);
			expect(result.lines.at(-1)).toBe('3 of 3 eval(s) match.');
		});
	});

	test('exits 1 and prints each mismatching eval, then the count line', async () => {
		const evals = {
			clean: MATCHING.clean,
			dirty: { expect: 'pass' as const, files: { 'src/a.ts': '// TODO\n' } },
			empty: { expect: 'fail' as const, files: { 'README.md': 'TODO\n' } }
		};
		await inTempDir({ ...configFile(), ...testFolder(validTest(), evals) }, (dir) => {
			const result = runCli(['eval'], { cwd: dir, env: KEYS });
			expect(result.exitCode).toBe(1);
			expect(result.lines.filter((line) => line.startsWith('no-todo/'))).toEqual([
				'no-todo/dirty  expected pass, got fail',
				'no-todo/empty  expected fail, got skip'
			]);
			expect(result.lines.at(-1)).toBe('1 of 3 eval(s) match.');
		});
	});

	test('runs only the Test named by the id', async () => {
		const mismatching = { clean: { expect: 'fail' as const, files: MATCHING.clean.files } };
		const files = {
			...configFile(),
			...testFolder(validTest(), { clean: MATCHING.clean }),
			...testFolder(noFixme, mismatching)
		};
		await inTempDir(files, (dir) => {
			const result = runCli(['eval', 'no-todo'], { cwd: dir, env: KEYS });
			expect(result.exitCode).toBe(0);
			expect(result.lines).not.toContain('Test no-fixme');
			expect(result.lines.at(-1)).toBe('1 of 1 eval(s) match.');
		});
	});

	test('counts zero evals and exits 0 for a Test with no eval folders', async () => {
		await inTempDir({ ...configFile(), ...testFolder(validTest()) }, (dir) => {
			const result = runCli(['eval'], { cwd: dir, env: KEYS });
			expect(result.exitCode).toBe(0);
			expect(result.lines.at(-1)).toBe('0 of 0 eval(s) match.');
		});
	});

	const errors: {
		name: string;
		files: Record<string, string>;
		args: string[];
		env: Record<string, string>;
		message: string;
	}[] = [
		{
			name: 'an unknown id',
			files: { ...configFile(), ...testFolder(validTest(), MATCHING) },
			args: ['eval', 'nope'],
			env: KEYS,
			message: 'Unknown test: nope'
		},
		{
			name: 'an invalid eval.yaml',
			files: {
				...configFile(),
				...testFolder(validTest()),
				'.agents/tests/no-todo/evals/bad/eval.yaml': toYaml({ expect: 'maybe' })
			},
			args: ['eval'],
			env: KEYS,
			message: '1 of 1 eval(s) invalid'
		},
		{
			name: 'a missing config',
			files: testFolder(validTest(), MATCHING),
			args: ['eval'],
			env: KEYS,
			message: 'Missing agentests.config.yaml'
		},
		{
			name: 'a missing API key',
			files: { ...configFile(), ...testFolder(validTest(), MATCHING) },
			args: ['eval'],
			env: { REASONING_KEY: 'fake-reasoning-key' },
			message: 'Missing environment variable: DECISION_KEY'
		}
	];

	test.each(errors)(
		'exits 2 with Error: on stderr for $name',
		async ({ files, args, env, message }) => {
			await inTempDir(files, (dir) => {
				const result = runCli(args, { cwd: dir, env });
				expect(result.exitCode).toBe(2);
				expect(result.stderr).toStartWith('Error: ');
				expect(result.stderr).toContain(message);
			});
		}
	);

	test('works outside a Git repository', async () => {
		await inTempDir({ ...configFile(), ...testFolder(validTest(), MATCHING) }, (dir) => {
			expect(() => git(dir, 'rev-parse', '--git-dir')).toThrow();
			const result = runCli(['eval'], { cwd: dir, env: KEYS });
			expect(result.exitCode).toBe(0);
			expect(result.lines.at(-1)).toBe('3 of 3 eval(s) match.');
		});
	});
});
