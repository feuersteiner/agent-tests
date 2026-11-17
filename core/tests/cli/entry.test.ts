import { describe, expect, test } from 'bun:test';
import { runCli } from '../helpers/cli.ts';
import { ENV, configFile, testFolder, validTest } from '../helpers/fixtures.ts';
import { inTempDir } from '../helpers/temp.ts';
import { inTempRepo } from '../helpers/git.ts';

/** The placeholder keys, typed as the child environment `runCli` takes. */
const KEYS = ENV as Record<string, string>;

/** A `.env` defining both key variables with placeholder values. */
const DOT_ENV = { '.env': 'DECISION_KEY=fake-decision-key\nREASONING_KEY=fake-reasoning-key\n' };

/** The config and the glob and grep only Test `no-todo`, with one source holding a TODO. */
const PROJECT = {
	...configFile(),
	...testFolder(validTest()),
	'src/a.ts': '// TODO: finish\n'
};

/** The finding `run` prints for `PROJECT`, proof that it got past building the engines. */
const FINDING = 'src/a.ts  no-todo/no-todo  Remove the TODO.';

describe('agentests entry', () => {
	test('--help exits 0 and lists the six commands', async () => {
		await inTempDir({}, (dir) => {
			const result = runCli(['--help'], { cwd: dir });
			expect(result.exitCode).toBe(0);
			for (const name of ['init', 'compile', 'list', 'validate', 'eval', 'run'])
				expect(result.stdout).toContain(`Usage: agentests ${name} `);
		});
	});

	test('prints no banner when stdout is not a terminal', async () => {
		await inTempDir({ ...configFile(), ...testFolder(validTest()) }, (dir) => {
			const result = runCli(['list'], { cwd: dir });
			expect(result.exitCode).toBe(0);
			expect(result.stdout).toBe('no-todo  No TODO\n');
		});
	});

	test.each([
		['an unknown command', ['bogus']],
		['a string flag without its value', ['run', '--base']],
		['init --decision without its value', ['init', '--decision']]
	])('%s exits non-zero with an error message', async (_, args) => {
		await inTempDir({}, (dir) => {
			const result = runCli(args, { cwd: dir });
			expect(result.exitCode).not.toBe(0);
			expect(result.stderr).toStartWith('Error: ');
		});
	});

	test('run reads the key variables from the .env of the working directory', async () => {
		await inTempRepo({ ...PROJECT, ...DOT_ENV }, (dir) => {
			const result = runCli(['run'], { cwd: dir });
			expect(result.stderr).toBe('');
			expect(result.lines).toContain(FINDING);
			expect(result.exitCode).toBe(1);
		});
	});

	test('run exits 2 naming the missing variable with no .env and no variables', async () => {
		await inTempRepo(PROJECT, (dir) => {
			const result = runCli(['run'], { cwd: dir });
			expect(result.exitCode).toBe(2);
			expect(result.stderr).toContain('Missing environment variable: DECISION_KEY');
		});
	});

	test('a variable set in the environment wins over the .env, even when blank', async () => {
		await inTempRepo({ ...PROJECT, ...DOT_ENV }, (dir) => {
			const result = runCli(['run'], { cwd: dir, env: { ...KEYS, DECISION_KEY: '' } });
			expect(result.exitCode).toBe(2);
			expect(result.stderr).toContain('Missing environment variable: DECISION_KEY');
		});
	});

	test('run proceeds without a .env when the variables are in the environment', async () => {
		await inTempRepo(PROJECT, (dir) => {
			const result = runCli(['run'], { cwd: dir, env: KEYS });
			expect(result.stderr).toBe('');
			expect(result.lines).toContain(FINDING);
			expect(result.exitCode).toBe(1);
		});
	});
});
