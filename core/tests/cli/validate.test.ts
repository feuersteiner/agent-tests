import { describe, expect, test } from 'bun:test';
import { runCli } from '../helpers/cli.ts';
import { configFile, testFolder, toYaml, validConfig, validTest } from '../helpers/fixtures.ts';
import { inTempDir } from '../helpers/temp.ts';

/** Two valid Tests. */
const twoTests = {
	...testFolder(validTest()),
	...testFolder(validTest({ id: 'no-fixme', title: 'No FIXME' }))
};

/** A Test with two problems: a duplicate assertion id and an invalid regular expression. */
const broken = testFolder(
	validTest({
		id: 'broken',
		assert: [
			{ id: 'dup', description: 'First.', error: 'First.', grep: '(' },
			{ id: 'dup', description: 'Second.', error: 'Second.', grep: 'TODO' }
		]
	})
);

/** A config whose decision URL is plain HTTP on a remote host. */
const badConfig = configFile({
	decision: { ...validConfig().decision, url: 'http://decision.invalid/v1' }
});

/** The evals folder of the Test `no-todo`. */
const EVALS = '.agents/tests/no-todo/evals';

/** Two valid evals of `no-todo`. */
const twoEvals = {
	clean: { expect: 'pass' as const, files: { 'src/a.ts': 'ok' } },
	dirty: { expect: 'fail' as const, files: { 'src/a.ts': '// TODO' } }
};

/** An eval of `no-todo` whose expect is not an outcome. */
const badEval = { [`${EVALS}/odd/eval.yaml`]: 'expect: maybe\n' };

/** An eval folder of `no-todo` with no eval.yaml. */
const bareEval = { [`${EVALS}/bare/src/a.ts`]: 'ok' };

describe('validate', () => {
	test('exits 0 and counts the Tests when the config and every Test are valid', async () => {
		await inTempDir({ ...configFile(), ...twoTests }, (dir) => {
			const { exitCode, lines, stderr } = runCli(['validate'], { cwd: dir });
			expect(lines).toEqual(['Config and 2 test(s) valid.']);
			expect(stderr).toBe('');
			expect(exitCode).toBe(0);
		});
	});

	test('validates only the Test an id names', async () => {
		await inTempDir({ ...configFile(), ...twoTests, ...broken }, (dir) => {
			const { exitCode, lines } = runCli(['validate', 'no-fixme'], { cwd: dir });
			expect(lines).toEqual(['Config and 1 test(s) valid.']);
			expect(exitCode).toBe(0);
		});
	});

	test('exits 2 listing each invalid Test file with each of its problems', async () => {
		const files = {
			...configFile(),
			...twoTests,
			...broken,
			'.agents/tests/renamed/test.yaml': toYaml(validTest())
		};
		await inTempDir(files, (dir) => {
			const { exitCode, stderr, lines } = runCli(['validate'], { cwd: dir });
			expect(exitCode).toBe(2);
			expect(lines).toEqual([]);
			expect(stderr).toStartWith('Error: 2 of 4 test(s) invalid:\n');
			expect(stderr).toContain(
				'.agents/tests/broken/test.yaml\n' +
					'  assert.1.id: Duplicate assertion id\n' +
					'  assert.0.grep: Invalid regular expression\n'
			);
			expect(stderr).toContain(
				'.agents/tests/renamed/test.yaml\n  id: Must match the folder name "renamed"\n'
			);
			expect(stderr).not.toContain('no-todo/test.yaml');
			expect(stderr).not.toContain('no-fixme/test.yaml');
		});
	});

	test.each([
		['invalid', badConfig, 'decision.url: Expected HTTPS or HTTP localhost'],
		['missing', {}, 'Missing agent-tests.config.yaml; run `agent-tests init`']
	])('reports an %s config together with the invalid Tests', async (_, config, problem) => {
		await inTempDir({ ...config, ...twoTests, ...broken }, (dir) => {
			const { exitCode, stderr } = runCli(['validate'], { cwd: dir });
			expect(exitCode).toBe(2);
			expect(stderr).toStartWith(
				`Error: config and 1 of 3 test(s) invalid:\nagent-tests.config.yaml\n  ${problem}`
			);
			expect(stderr).toContain('.agents/tests/broken/test.yaml\n');
		});
	});

	test('reports an invalid config alone when every Test is valid', async () => {
		await inTempDir({ ...badConfig, ...twoTests }, (dir) => {
			const { exitCode, stderr } = runCli(['validate'], { cwd: dir });
			expect(exitCode).toBe(2);
			expect(stderr).toBe(
				'Error: config invalid:\nagent-tests.config.yaml\n' +
					'  decision.url: Expected HTTPS or HTTP localhost without credentials, query, or fragment\n'
			);
		});
	});

	test('needs no keys in the environment', async () => {
		await inTempDir({ ...configFile(), ...testFolder(validTest()) }, (dir) => {
			const { exitCode, lines } = runCli(['validate'], { cwd: dir, env: {} });
			expect(lines).toEqual(['Config and 1 test(s) valid.']);
			expect(exitCode).toBe(0);
		});
	});

	test('exits 0 with the same success line when every eval is valid', async () => {
		await inTempDir({ ...configFile(), ...testFolder(validTest(), twoEvals) }, (dir) => {
			const { exitCode, lines, stderr } = runCli(['validate'], { cwd: dir });
			expect(lines).toEqual(['Config and 1 test(s) valid.']);
			expect(stderr).toBe('');
			expect(exitCode).toBe(0);
		});
	});

	test.each([
		[
			'an invalid eval.yaml',
			badEval,
			`${EVALS}/odd/eval.yaml\n  expect: Expected pass, fail, or skip\n`
		],
		['an eval folder with no eval.yaml', bareEval, `${EVALS}/bare/eval.yaml\n  Missing eval.yaml\n`]
	])('exits 2 listing %s with its path and problem', async (_, evalFiles, listing) => {
		const files = { ...configFile(), ...testFolder(validTest(), twoEvals), ...evalFiles };
		await inTempDir(files, (dir) => {
			const { exitCode, stderr, lines } = runCli(['validate'], { cwd: dir });
			expect(exitCode).toBe(2);
			expect(lines).toEqual([]);
			expect(stderr).toBe(`Error: 1 of 3 eval(s) invalid:\n${listing}`);
		});
	});

	test('lists an invalid Test and an invalid eval together', async () => {
		const files = {
			...configFile(),
			...testFolder(validTest(), twoEvals),
			...badEval,
			...bareEval,
			...broken
		};
		await inTempDir(files, (dir) => {
			const { exitCode, stderr } = runCli(['validate'], { cwd: dir });
			expect(exitCode).toBe(2);
			expect(stderr).toBe(
				'Error: 1 of 2 test(s) and 2 of 4 eval(s) invalid:\n' +
					'.agents/tests/broken/test.yaml\n' +
					'  assert.1.id: Duplicate assertion id\n' +
					'  assert.0.grep: Invalid regular expression\n' +
					`${EVALS}/bare/eval.yaml\n  Missing eval.yaml\n` +
					`${EVALS}/odd/eval.yaml\n  expect: Expected pass, fail, or skip\n`
			);
		});
	});

	test('does not check the evals of a Test whose test.yaml is invalid', async () => {
		const files = {
			...configFile(),
			...broken,
			'.agents/tests/broken/evals/odd/eval.yaml': 'expect: maybe\n'
		};
		await inTempDir(files, (dir) => {
			const { exitCode, stderr } = runCli(['validate'], { cwd: dir });
			expect(exitCode).toBe(2);
			expect(stderr).toStartWith('Error: 1 of 1 test(s) invalid:\n');
			expect(stderr).not.toContain('eval');
		});
	});

	test('validate <id> ignores the broken evals of another Test', async () => {
		const files = { ...configFile(), ...twoTests, ...badEval };
		await inTempDir(files, (dir) => {
			const { exitCode, lines, stderr } = runCli(['validate', 'no-fixme'], { cwd: dir });
			expect(lines).toEqual(['Config and 1 test(s) valid.']);
			expect(stderr).toBe('');
			expect(exitCode).toBe(0);
		});
	});

	test('exits 2 on an id that names no Test', async () => {
		await inTempDir({ ...configFile(), ...twoTests }, (dir) => {
			const { exitCode, stderr, lines } = runCli(['validate', 'missing'], { cwd: dir });
			expect(exitCode).toBe(2);
			expect(stderr).toBe('Error: Unknown test: missing\n');
			expect(lines).toEqual([]);
		});
	});
});
