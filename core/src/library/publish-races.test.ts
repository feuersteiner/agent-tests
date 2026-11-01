import { mkdir, readFile, readdir, rename, symlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { addTest, updateTests } from './index.js';
import { createSource, hash, sourceFile } from './source.js';
import { writeTest } from './write.js';
import type { LibraryFiles, LibraryOptions } from './types.js';
import { fixtureId, fixtureTransport, nextCommit, reference, withRoot } from './tests/fixture.js';

const duringFetch = (files: LibraryFiles, mutate: () => Promise<void>): LibraryOptions => ({
	transport: {
		open: async () => ({
			commit: nextCommit,
			ids: [fixtureId],
			readTest: async () => {
				await mutate();
				return files;
			},
			close: async () => undefined
		})
	}
});

describe('library publish conflict checks', () => {
	it.each(['source', 'extra', 'metadata'] as const)(
		'preserves a %s change made while an update is fetching',
		async (change) => {
			await withRoot(async (root) => {
				const files = await reference();
				const installed = await addTest(root, fixtureId, '.', fixtureTransport(files));
				const metadata = await readFile(join(installed.directory, sourceFile), 'utf8');
				const options = duringFetch(files, async () => {
					if (change === 'source')
						await writeFile(join(installed.directory, 'TEST.md'), 'USER EDIT DURING UPDATE');
					if (change === 'extra')
						await writeFile(join(installed.directory, 'notes.txt'), 'USER NOTES');
					if (change === 'metadata')
						await writeFile(join(installed.directory, sourceFile), `${metadata}\n`);
				});
				const [result] = await updateTests(root, fixtureId, options);
				expect(result?.status).toBe('skipped');
				expect(result?.warnings.join()).toContain('changed during update');
				if (change === 'source')
					expect(await readFile(join(installed.directory, 'TEST.md'), 'utf8')).toBe(
						'USER EDIT DURING UPDATE'
					);
				if (change === 'extra')
					expect(await readFile(join(installed.directory, 'notes.txt'), 'utf8')).toBe('USER NOTES');
				if (change === 'metadata')
					expect(await readFile(join(installed.directory, sourceFile), 'utf8')).toBe(
						`${metadata}\n`
					);
			});
		}
	);

	it('also preserves a self-consistent replacement of source and provenance', async () => {
		await withRoot(async (root) => {
			const files = await reference();
			const installed = await addTest(root, fixtureId, '.', fixtureTransport(files));
			const options = duringFetch(files, async () => {
				const metadata = JSON.parse(await readFile(join(installed.directory, sourceFile), 'utf8'));
				metadata.proseHash = hash('USER EDIT');
				await writeFile(join(installed.directory, 'TEST.md'), 'USER EDIT');
				await writeFile(join(installed.directory, sourceFile), JSON.stringify(metadata));
			});
			expect((await updateTests(root, fixtureId, options))[0]?.status).toBe('skipped');
			expect(await readFile(join(installed.directory, 'TEST.md'), 'utf8')).toBe('USER EDIT');
		});
	});

	it('rejects an owner symlink swapped during fetch before writing staging files', async () => {
		await withRoot(async (root) => {
			await withRoot(async (outside) => {
				const files = await reference();
				await addTest(root, fixtureId, '.', fixtureTransport(files));
				const options = duringFetch(files, async () => {
					await rename(join(root, '.agents'), join(root, '.agents-original'));
					await symlink(outside, join(root, '.agents'));
				});
				await expect(updateTests(root, fixtureId, options)).rejects.toThrow('symlinks');
				expect(await readdir(outside)).toEqual([]);
				expect(
					await readFile(join(root, '.agents-original/tests', fixtureId, 'TEST.md'), 'utf8')
				).toBe(files.prose);
			});
		});
	});

	it('does not replace an existing destination that appears after the final add check', async () => {
		await withRoot(async (root) => {
			const files = await reference();
			const directory = join(root, fixtureId);
			let checks = 0;
			const published = await writeTest(
				directory,
				files,
				createSource(files, 'fixture/catalog', 'main', nextCommit),
				false,
				async () => {
					if (++checks === 2) {
						await mkdir(directory);
						await writeFile(join(directory, 'user.txt'), 'USER FILE');
					}
					return true;
				}
			);
			expect(published).toBe(false);
			expect(await readdir(directory)).toEqual(['user.txt']);
			expect(await readFile(join(directory, 'user.txt'), 'utf8')).toBe('USER FILE');
		});
	});
});
