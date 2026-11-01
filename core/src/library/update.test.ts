import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { addTest, removeTest, updateTests } from './index.js';
import { fixtureId, fixtureTransport, nextCommit, reference, withRoot } from './tests/fixture.js';

describe('conservative library updates', () => {
	it('updates an unchanged managed copy and records the new exact commit', async () => {
		await withRoot(async (root) => {
			const files = await reference();
			const added = await addTest(root, fixtureId, '.', fixtureTransport(files));
			const yaml = files.yaml.replace('No informal English', 'Formal customer English');
			const [updated] = await updateTests(
				root,
				fixtureId,
				fixtureTransport({ ...files, yaml }, nextCommit)
			);
			expect(updated?.status).toBe('updated');
			expect(updated?.commit).toBe(nextCommit);
			expect(updated?.evals?.passed).toBe(3);
			expect(await readFile(join(added.directory, 'test.yaml'), 'utf8')).toBe(yaml);
		});
	});

	it('prints exact-owner briefs when nested packages share an id', async () => {
		await withRoot(async (root) => {
			const files = await reference();
			await addTest(root, fixtureId, 'packages/web', fixtureTransport(files));
			const added = await addTest(root, fixtureId, '.', fixtureTransport(files));
			expect(added.brief).toContain('Target: .agents/tests/no-informal-english/test.yaml');
			const results = await updateTests(root, fixtureId, fixtureTransport(files, nextCommit));
			expect(results.map((result) => result.status)).toEqual(['updated', 'updated']);
			expect(results.every((result) => result.brief?.includes('## Verification'))).toBe(true);
		});
	});

	it('keeps locally edited tests and tests removed from the remote catalog', async () => {
		await withRoot(async (root) => {
			const files = await reference();
			const added = await addTest(root, fixtureId, '.', fixtureTransport(files));
			const [missing] = await updateTests(root, fixtureId, fixtureTransport(files, nextCommit, []));
			expect(missing?.status).toBe('skipped');
			expect(missing?.warnings.join()).toContain('no longer exists');
			await writeFile(join(added.directory, 'test.yaml'), 'local invalid yaml');
			const [edited] = await updateTests(root, fixtureId, fixtureTransport(files, nextCommit));
			expect(edited?.status).toBe('skipped');
			expect(await readFile(join(added.directory, 'test.yaml'), 'utf8')).toBe('local invalid yaml');
		});
	});

	it('removes only an unchanged managed test at the selected owner', async () => {
		await withRoot(async (root) => {
			const files = await reference();
			const added = await addTest(root, fixtureId, '.', fixtureTransport(files));
			await addTest(root, fixtureId, 'packages/web', fixtureTransport(files));
			await writeFile(join(added.directory, 'notes.txt'), 'keep my work');
			expect((await removeTest(root, fixtureId)).status).toBe('skipped');
			expect((await removeTest(root, fixtureId, 'packages/web')).status).toBe('removed');
			expect(await readFile(join(added.directory, 'notes.txt'), 'utf8')).toBe('keep my work');
			expect(await readdir(join(root, 'packages/web/.agents/tests'))).toEqual([]);
		});
	});
});
