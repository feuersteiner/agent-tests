import { mkdir, readFile, readdir, symlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { addTest, listRemoteTests } from './index.js';
import { sourceFile } from './source.js';
import {
	fixtureCommit,
	fixtureId,
	fixtureTransport,
	reference,
	withRoot
} from './tests/fixture.js';

describe('library installs', () => {
	it('pins a commit, copies only rule files plus provenance, prints brief and runs real evals', async () => {
		await withRoot(async (root) => {
			const options = fixtureTransport(await reference());
			const result = await addTest(root, fixtureId, '.', options);
			expect(result.status).toBe('added');
			expect(result.commit).toBe(fixtureCommit);
			expect(result.exitCode).toBe(0);
			expect(result.evals?.passed).toBe(3);
			expect(result.brief).toContain('## Verification');
			expect((await readdir(result.directory)).sort()).toEqual(
				[sourceFile, 'TEST.md', 'test.yaml'].sort()
			);
			const provenance = JSON.parse(await readFile(join(result.directory, sourceFile), 'utf8'));
			expect(provenance.commit).toBe(fixtureCommit);
			expect(options.closed()).toBe(1);
		});
	});

	it('supports nested targets and never overwrites an existing test', async () => {
		await withRoot(async (root) => {
			const options = fixtureTransport(await reference());
			const installed = await addTest(root, fixtureId, 'packages/web', options);
			expect(installed.directory).toBe(join(root, 'packages/web/.agents/tests', fixtureId));
			await expect(addTest(root, fixtureId, 'packages/web', options)).rejects.toThrow(
				'already exists'
			);
			expect(await readFile(join(installed.directory, 'TEST.md'), 'utf8')).toBe(
				(await reference()).prose
			);
		});
	});

	it('rejects unsafe ids, outside targets and symlink owners before opening a catalog', async () => {
		await withRoot(async (root) => {
			const options = fixtureTransport(await reference());
			await expect(addTest(root, '../outside', '.', options)).rejects.toThrow('Invalid');
			await expect(addTest(root, fixtureId, '../outside', options)).rejects.toThrow('inside');
			await mkdir(join(root, 'real'));
			await symlink(join(root, 'real'), join(root, 'linked'));
			await expect(addTest(root, fixtureId, 'linked', options)).rejects.toThrow('symlinks');
			expect(options.closed()).toBe(0);
		});
	});

	it('rejects bad source/schema without creating installed files and closes the catalog', async () => {
		await withRoot(async (root) => {
			const files = await reference();
			const options = fixtureTransport({ ...files, prose: `${files.prose}\nChanged` });
			await expect(addTest(root, fixtureId, '.', options)).rejects.toThrow('validation');
			expect(await readdir(root)).toEqual([]);
			expect(options.closed()).toBe(1);
		});
	});

	it('lists remote ids without creating local state and honors configured repository/ref', async () => {
		await withRoot(async (root) => {
			await writeFile(
				join(root, 'agent-tests.config.yaml'),
				'library:\n  repository: fixture/catalog\n  ref: v1\n'
			);
			const seen: string[] = [];
			const files = await reference();
			const transport = {
				open: async (repository: string, ref: string) => {
					seen.push(repository, ref);
					return {
						commit: fixtureCommit,
						ids: [fixtureId],
						readTest: async () => files,
						close: async () => {}
					};
				}
			};
			expect(await listRemoteTests(root, { transport })).toEqual([
				{ id: fixtureId, commit: fixtureCommit }
			]);
			expect(seen).toEqual(['fixture/catalog', 'v1']);
			expect(await readdir(root)).toEqual(['agent-tests.config.yaml']);
		});
	});
});
