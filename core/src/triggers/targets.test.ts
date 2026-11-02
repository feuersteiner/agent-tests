import { rm, symlink } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createMockModel } from '../models/index.js';
import { createRoot, installTest, referenceDefinition, write } from '../discovery/tests/fixture.js';
import { targetFiles } from './index.js';

const roots: string[] = [];
const fixture = async () => {
	const root = await createRoot();
	roots.push(root);
	await installTest(root);
	await write(root, 'src/help/guide.md', 'We are gonna save.');
	await write(root, 'src/internal.ts', 'const value = 1;');
	return root;
};
afterEach(async () => {
	await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('installed test targets', () => {
	it('selects targets without executing failing checks', async () => {
		const root = await fixture();
		const result = await targetFiles(root, 'no-informal-english');
		expect(result.files).toEqual(['src/help/guide.md']);
		expect(result.exitCode).toBe(0);
	});

	it('selects the same owner-relative targets through a symlinked root', async () => {
		const root = await fixture();
		const links = await createRoot();
		roots.push(links);
		const alias = join(links, 'repository');
		await symlink(root, alias, 'dir');
		expect((await targetFiles(alias, 'no-informal-english')).files).toEqual(['src/help/guide.md']);
		expect(await targetFiles(alias, 'no-informal-english')).toEqual(
			await targetFiles(root, 'no-informal-english')
		);
	});

	it('respects nested inherited exemptions', async () => {
		const root = await fixture();
		await write(root, 'app/.agents/tests/config.yaml', 'disable: [no-informal-english]');
		await write(root, 'app/src/help/guide.md', 'We are gonna save.');
		expect((await targetFiles(root, 'no-informal-english')).files).toEqual(['src/help/guide.md']);
	});

	it('distinguishes missing model selections from deterministic rejections', async () => {
		const root = await fixture();
		await installTest(root, '', {
			...referenceDefinition,
			triggers: { path: { match: 'src/**/*.md' }, content: { ask: 'Is this public prose?' } }
		});
		const skipped = await targetFiles(root, 'no-informal-english');
		expect(skipped.files).toEqual([]);
		expect(skipped.skipped).toEqual(['src/help/guide.md']);
		expect(skipped.warnings).not.toEqual([]);
		const selected = await targetFiles(
			root,
			'no-informal-english',
			{},
			createMockModel([{ decision: 'pass' }])
		);
		expect(selected.files).toEqual(['src/help/guide.md']);
	});

	it('rejects unknown and ambiguous identifiers', async () => {
		const root = await fixture();
		await expect(targetFiles(root, 'missing')).rejects.toThrow('Unknown test');
		await installTest(root, 'app');
		await expect(targetFiles(root, 'no-informal-english')).rejects.toThrow('Ambiguous test');
		expect((await targetFiles(root, './no-informal-english')).files).toEqual(['src/help/guide.md']);
	});
});
