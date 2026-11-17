import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig, loadDefinitions, loadEvalDefinitions } from '../../src/loader/index.ts';
import { StubAgentTests } from './agent-tests.ts';
import { runCli } from './cli.ts';
import { stubEngines } from './engines.ts';
import { configFile, ENV, testFolder, toYaml, validConfig, validTest } from './fixtures.ts';
import { commitAll, git, initRepo, inTempRepo } from './git.ts';
import { inTempDir, makeTempDir, removeDir, writeFiles } from './temp.ts';

describe('temp', () => {
	test('writeFiles creates parent folders', () => {
		const dir = makeTempDir();
		try {
			writeFiles(dir, { 'a/b/c.txt': 'hi' });
			expect(readFileSync(join(dir, 'a/b/c.txt'), 'utf8')).toBe('hi');
		} finally {
			removeDir(dir);
		}
		expect(existsSync(dir)).toBe(false);
	});

	test('inTempDir runs in the directory and returns the result', async () => {
		const result = await inTempDir({ 'a.txt': 'a' }, (dir) => {
			expect(process.cwd()).toBe(dir);
			return readFileSync('a.txt', 'utf8');
		});
		expect(result).toBe('a');
	});

	test('inTempDir restores the working directory and removes the directory when the callback throws', async () => {
		const before = process.cwd();
		let seen = '';
		const run = inTempDir({}, (dir) => {
			seen = dir;
			throw new Error('boom');
		});
		await expect(run).rejects.toThrow('boom');
		expect(process.cwd()).toBe(before);
		expect(existsSync(seen)).toBe(false);
	});
});

describe('git', () => {
	test('inTempRepo commits the files with the local identity, without any global config', async () => {
		await inTempRepo({ 'a.txt': 'a' }, (dir) => {
			expect(git(dir, 'branch', '--show-current')).toBe('main');
			expect(git(dir, 'log', '--format=%an <%ae>')).toBe(
				'Agent Tests <agent-tests@example.invalid>'
			);
			expect(git(dir, 'config', '--show-origin', 'user.name')).toStartWith('file:.git/config');
			expect(git(dir, 'status', '--porcelain')).toBe('');
		});
	});

	test('initRepo and commitAll turn a plain directory into a repository', async () => {
		await inTempDir({ 'a.txt': 'a' }, (dir) => {
			initRepo(dir);
			commitAll(dir, 'first');
			expect(git(dir, 'log', '--format=%s')).toBe('first');
		});
	});
});

describe('fixtures', () => {
	test('configFile and testFolder load as validConfig, validTest, and the evals given', async () => {
		const evals = { clean: { expect: 'pass' as const, files: { 'src/a.ts': 'ok' } } };
		const files = { ...configFile(), ...testFolder(validTest(), evals, 'No TODO.') };
		expect(files['.agents/tests/no-todo/TEST.md']).toBe('No TODO.');
		expect(files['.agents/tests/no-todo/evals/clean/eval.yaml']).toBe(toYaml({ expect: 'pass' }));
		await inTempDir(files, () => {
			expect(loadConfig()).toEqual(validConfig());
			expect(loadDefinitions()).toEqual([validTest()]);
			expect(loadEvalDefinitions('no-todo')).toEqual([
				{ id: 'clean', root: '.agents/tests/no-todo/evals/clean', expect: 'pass' }
			]);
		});
	});
});

describe('stubEngines', () => {
	test('records calls in order and rejects for an engine without an implementation', async () => {
		const { engines, calls } = stubEngines({ grep: () => 2 });
		expect(await engines.grep('text', 'TODO')).toBe(2);
		await expect(engines.decide('text', 'Is it fine?')).rejects.toThrow('no implementation');
		expect(calls).toEqual([
			{ engine: 'grep', input: 'text', criteria: 'TODO' },
			{ engine: 'decide', input: 'text', criteria: 'Is it fine?' }
		]);
	});
});

describe('StubAgentTests', () => {
	const files = { ...configFile(), 'src/a.ts': 'export const a = 1;\n' };
	const modelTest = validTest({
		assert: [
			{ id: 'fine', description: 'Fine.', error: 'Not fine.', decide: 'Fine?', reason: 'Fine?' }
		]
	});

	test('rejects instead of reaching a decide or reason that is not stubbed', async () => {
		await inTempRepo({ ...files, ...testFolder(modelTest) }, async () => {
			await expect(new StubAgentTests(validConfig()).run({ kind: 'all' })).rejects.toThrow(
				'decide is not stubbed'
			);
			const tests = new StubAgentTests(validConfig(), { decide: async () => 0 });
			await expect(tests.run({ kind: 'all' })).rejects.toThrow('reason is not stubbed');
		});
	});

	test('uses the stubs given', async () => {
		await inTempRepo({ ...files, ...testFolder(modelTest) }, async () => {
			const tests = new StubAgentTests(validConfig(), {
				decide: async () => 0,
				reason: async () => 1
			});
			const [result] = await tests.run({ kind: 'all' });
			expect(result?.findings).toEqual([]);
		});
	});
});

describe('runCli', () => {
	test('strips the banner', async () => {
		await inTempDir({ ...configFile(), ...testFolder(validTest()) }, (dir) => {
			const result = runCli(['list'], { cwd: dir });
			expect(result.stdout).toContain('─');
			expect(result.output).not.toContain('─');
			expect(result.lines).toEqual(['no-todo  No TODO']);
			expect(result.exitCode).toBe(0);
		});
	});

	test('passes only the given environment to the child, never the parent one', async () => {
		const leaked = 'AGENT_TESTS_HELPER_LEAK';
		const config = configFile({ decision: { ...validConfig().decision, apiKeyEnv: leaked } });
		const files = { ...config, ...testFolder(validTest()), 'src/a.ts': '// TODO\n' };
		process.env[leaked] = 'leaked';
		try {
			await inTempRepo(files, (dir) => {
				const hidden = runCli(['run'], { cwd: dir, env: { REASONING_KEY: ENV.REASONING_KEY! } });
				expect(hidden.exitCode).toBe(2);
				expect(hidden.stderr).toContain(`Missing environment variable: ${leaked}`);
				const given = runCli(['run'], {
					cwd: dir,
					env: { [leaked]: 'fake', REASONING_KEY: 'fake' }
				});
				expect(given.lines).toContain('src/a.ts  no-todo/no-todo  Remove the TODO.');
				expect(given.exitCode).toBe(1);
			});
		} finally {
			delete process.env[leaked];
		}
	});

	test('runs in a temp directory holding a .env, whose variables the child loads', async () => {
		const files = {
			...configFile(),
			...testFolder(validTest()),
			'src/a.ts': '// TODO\n',
			'.env': 'DECISION_KEY=fake\nREASONING_KEY=fake\n'
		};
		await inTempRepo(files, (dir) => {
			const result = runCli(['run'], { cwd: dir });
			expect(result.lines).toContain('src/a.ts  no-todo/no-todo  Remove the TODO.');
			expect(result.exitCode).toBe(1);
		});
	});

	test('refuses a cwd inside the repository', () => {
		const root = fileURLToPath(new URL('../../..', import.meta.url));
		const core = fileURLToPath(new URL('../..', import.meta.url));
		expect(() => runCli(['list'], { cwd: root })).toThrow('inside the repository');
		expect(() => runCli(['list'], { cwd: core })).toThrow('inside the repository');
	});
});
