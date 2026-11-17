import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'bun:test';
import { runCli } from '../helpers/cli.ts';
import { configFile, testFolder, toYaml, validTest } from '../helpers/fixtures.ts';
import { inTempDir } from '../helpers/temp.ts';

/** The invalid line `list` prints for a Test folder that did not load. */
const invalidLine = (folder: string): string =>
	`${folder}  invalid; run \`agent-tests validate ${folder}\``;

/** Two valid Tests, one Test whose id differs from its folder, and one folder without a test.yaml. */
const mixed = {
	...configFile(),
	...testFolder(validTest()),
	...testFolder(validTest({ id: 'no-fixme', title: 'No FIXME' })),
	'.agents/tests/renamed/test.yaml': toYaml(validTest()),
	'.agents/tests/draft/TEST.md': 'No console.log.'
};

describe('list', () => {
	test('prints the id and title of each valid Test, separated by two spaces', async () => {
		await inTempDir(mixed, (dir) => {
			const { lines } = runCli(['list'], { cwd: dir });
			expect(lines).toContain('no-todo  No TODO');
			expect(lines).toContain('no-fixme  No FIXME');
		});
	});

	test('prints the folder of each invalid Test with the command that explains it', async () => {
		await inTempDir(mixed, (dir) => {
			const { lines } = runCli(['list'], { cwd: dir });
			expect(lines).toContain(invalidLine('renamed'));
			expect(lines).toContain(invalidLine('draft'));
		});
	});

	test('prints exactly one line per Test folder', async () => {
		await inTempDir(mixed, (dir) => {
			const { lines } = runCli(['list'], { cwd: dir });
			expect(lines).toEqual([
				invalidLine('draft'),
				'no-fixme  No FIXME',
				'no-todo  No TODO',
				invalidLine('renamed')
			]);
		});
	});

	test('exits 0 even when some Tests are invalid', async () => {
		await inTempDir(mixed, (dir) => {
			const { exitCode, stderr } = runCli(['list'], { cwd: dir });
			expect(exitCode).toBe(0);
			expect(stderr).toBe('');
		});
	});

	test('needs no config and no keys', async () => {
		await inTempDir(testFolder(validTest()), (dir) => {
			const { exitCode, lines } = runCli(['list'], { cwd: dir });
			expect(lines).toEqual(['no-todo  No TODO']);
			expect(exitCode).toBe(0);
		});
	});

	test.each([
		['missing', (): void => {}, 'No .agents/tests/ folder in the current directory'],
		[
			'empty',
			(dir: string): void => {
				mkdirSync(join(dir, '.agents/tests'), { recursive: true });
			},
			'No tests found in .agents/tests/'
		]
	])('exits 2 when .agents/tests is %s', async (_, prepare, error) => {
		await inTempDir(configFile(), (dir) => {
			prepare(dir);
			const { exitCode, stderr, lines } = runCli(['list'], { cwd: dir });
			expect(exitCode).toBe(2);
			expect(stderr).toBe(`Error: ${error}\n`);
			expect(lines).toEqual([]);
		});
	});
});
