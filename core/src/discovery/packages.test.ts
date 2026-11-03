import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { rm, symlink } from 'node:fs/promises';
import { join } from 'node:path';
import { discoverTestDirectories, discoverTests, formatTestTree, testsForFile } from './index.js';
import { createRoot, installTest, referenceDefinition, write } from './tests/fixture.js';

let root: string;
beforeEach(async () => {
	root = await createRoot();
});
afterEach(async () => {
	await rm(root, { recursive: true, force: true });
});

describe('test packages', () => {
	it('compounds owners and exempts only inherited definitions sharing an id', async () => {
		await installTest(root);
		await installTest(root, 'packages/web');
		await write(root, 'packages/web/.agents/tests/config.yaml', 'disable: [no-informal-english]');
		const tests = await discoverTests(root);
		expect(tests.map((test) => test.owner)).toEqual(['.', 'packages/web']);
		expect(testsForFile(tests, 'readme.txt').map((test) => test.owner)).toEqual(['.']);
		expect(testsForFile(tests, 'packages/web/copy.txt').map((test) => test.owner)).toEqual([
			'packages/web'
		]);
		expect(testsForFile(tests, 'packages/website/copy.txt').map((test) => test.owner)).toEqual([
			'.'
		]);
		expect(formatTestTree(tests)).toBe(
			'.agents/tests/\n  └── no-informal-english\n' +
				'packages/web/.agents/tests/\n  └── no-informal-english'
		);
	});

	it('disambiguates a disabled ancestor by its owner', async () => {
		await installTest(root);
		await installTest(root, 'packages');
		await write(
			root,
			'packages/web/.agents/tests/config.yaml',
			'disable: [packages/no-informal-english]'
		);
		const tests = await discoverTests(root);
		expect(testsForFile(tests, 'packages/web/copy.txt').map((test) => test.owner)).toEqual(['.']);
		expect(testsForFile(tests, 'packages/copy.txt')).toHaveLength(2);
	});

	it('rejects unknown config keys and invalid disable values', async () => {
		await installTest(root);
		await write(root, '.agents/tests/config.yaml', 'disabled: [no-informal-english]');
		await expect(discoverTests(root)).rejects.toThrow('Unknown tests configuration key');
		await write(root, '.agents/tests/config.yaml', 'disable: no-informal-english');
		await expect(discoverTests(root)).rejects.toThrow('Expected disable');
	});

	it('makes invalid or uncompiled folders available to validation', async () => {
		await installTest(root);
		await write(root, '.agents/tests/uncompiled/TEST.md', 'A prose-only rule.');
		await write(root, '.agents/tests/broken/test.yaml', 'unknown: true');
		const directories = await discoverTestDirectories(root);
		expect(directories.map((directory) => directory.split('/').at(-1))).toEqual([
			'broken',
			'no-informal-english',
			'uncompiled'
		]);
		await expect(discoverTests(root)).rejects.toThrow();
	});

	it('rejects mismatched directory ids', async () => {
		await write(root, '.agents/tests/wrong/test.yaml', JSON.stringify(referenceDefinition));
		await expect(discoverTests(root)).rejects.toThrow('does not match its directory');
	});

	it('does not follow symlinked rule directories or metadata', async () => {
		await installTest(root, 'source');
		await symlink(join(root, 'source'), join(root, 'alias'));
		await symlink(join(root, 'source/.agents'), join(root, '.agents'));
		expect((await discoverTests(root)).map((test) => test.owner)).toEqual(['source']);
		expect(await discoverTestDirectories(root)).toEqual([
			join(root, 'source/.agents/tests/no-informal-english')
		]);
	});
});
