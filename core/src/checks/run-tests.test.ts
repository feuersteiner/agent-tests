import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { stringify } from 'yaml';
import { createMockModel } from '../models/index.js';
import { runTests } from './run-tests.js';
import { referenceTest } from './test-support/fixture.js';

let root: string;
const git = (...args: string[]) => execFileSync('git', args, { cwd: root, encoding: 'utf8' });
const installTest = async (owner = '.', smart = false) => {
	const directory = join(root, owner, '.agents/tests/no-informal-english');
	await mkdir(directory, { recursive: true });
	await writeFile(
		join(directory, 'test.yaml'),
		stringify(
			referenceTest(
				smart
					? {
							fast: undefined,
							smart: { ask: 'Find informal English.' }
						}
					: {}
			)
		)
	);
};

beforeEach(async () => {
	root = await mkdtemp(join(tmpdir(), 'agent-tests-checks-'));
	await mkdir(join(root, 'src'));
	await installTest();
	await writeFile(join(root, 'src/page.txt'), 'We will assist.');
	git('init', '--quiet', '--initial-branch=main');
	git('config', 'user.email', 'tests@example.invalid');
	git('config', 'user.name', 'Agent Tests');
	git('add', '.');
	git('commit', '--quiet', '-m', 'Initial');
});
afterEach(async () => {
	await rm(root, { recursive: true, force: true });
});

describe('runTests', () => {
	it('uses canonical owner paths when the root is a symbolic link', async () => {
		const linked = join(root, 'linked-root');
		await symlink(root, linked, 'dir');
		await writeFile(join(root, 'src/page.txt'), 'gonna');
		const result = await runTests(linked, { paths: ['src/page.txt'] });
		expect(result).toMatchObject({ checked: 1, exitCode: 1 });
		expect(result.findings[0]?.file).toBe('src/page.txt');
	});

	it('runs changed, staged and base scopes with their actual file versions', async () => {
		await writeFile(join(root, 'src/page.txt'), 'We are gonna assist.');
		expect(await runTests(root, { changed: true })).toMatchObject({ checked: 1, exitCode: 1 });
		git('add', 'src/page.txt');
		await writeFile(join(root, 'src/page.txt'), 'We will assist.');
		expect(await runTests(root, { staged: true })).toMatchObject({ checked: 1, exitCode: 1 });
		git('commit', '--quiet', '-m', 'Informal');
		git('restore', 'src/page.txt');
		expect(await runTests(root, { base: 'HEAD~1' })).toMatchObject({ checked: 1, exitCode: 1 });
	});

	it('uses owner-relative triggers while findings keep repository-relative paths', async () => {
		await installTest('packages/web');
		await mkdir(join(root, 'packages/web/src'), { recursive: true });
		await writeFile(join(root, 'packages/web/src/page.txt'), 'gonna');
		const result = await runTests(root, { paths: ['packages/web/src/page.txt'] });
		expect(result.findings).toHaveLength(1);
		expect(result.findings[0]?.file).toBe('packages/web/src/page.txt');
	});

	it('loads configured tests without changing the inspected file', async () => {
		await writeFile(join(root, 'src/page.txt'), 'gonna');
		const before = await readFile(join(root, 'src/page.txt'), 'utf8');
		expect((await runTests(root, { paths: ['src/page.txt'] })).exitCode).toBe(1);
		expect(await readFile(join(root, 'src/page.txt'), 'utf8')).toBe(before);
	});

	it('skips model-required checks with a warning when credentials are missing', async () => {
		await installTest('.', true);
		const result = await runTests(root, { paths: ['src/page.txt'] });
		expect(result).toMatchObject({ exitCode: 0, checked: 0, findings: [] });
		expect(result.skipped).toHaveLength(1);
		expect(result.warnings[0]).toContain('Model unavailable');
	});

	it('preserves runtime failure status and sanitizes model errors', async () => {
		await installTest('.', true);
		const model = createMockModel(() => {
			throw new Error('sk-example-secret');
		});
		const result = await runTests(root, { paths: ['src/page.txt'] }, model);
		expect(result.exitCode).toBe(2);
		expect(JSON.stringify(result)).not.toContain('sk-example-secret');
	});

	it('returns exit two for invalid run scopes or missing roots', async () => {
		expect((await runTests(root, { changed: true, staged: true })).exitCode).toBe(2);
		expect((await runTests(join(root, 'absent'))).exitCode).toBe(2);
	});
});
