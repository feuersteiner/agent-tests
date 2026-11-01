import { execFile } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { describe, expect, it, vi } from 'vitest';
import { gitLibraryTransport } from './git-transport.js';
import { fixtureId, reference, withRoot } from './tests/fixture.js';

const execute = promisify(execFile);
const git = async (root: string, ...args: string[]): Promise<string> =>
	(
		await execute('git', [
			'-C',
			root,
			'-c',
			'user.name=Fixture',
			'-c',
			'user.email=fixture@example.test',
			...args
		])
	).stdout.trim();

describe('Git catalog transport', () => {
	it('reads regular files at the pinned commit after the remote branch advances', async () => {
		await withRoot(async (root) => {
			const repository = join(root, 'catalog');
			const directory = join(repository, 'library', fixtureId);
			await mkdir(directory, { recursive: true });
			const files = await reference();
			await writeFile(join(directory, 'TEST.md'), files.prose);
			await writeFile(join(directory, 'test.yaml'), files.yaml);
			await writeFile(join(directory, 'score.csv'), 'github_handle\nfixture\n');
			await git(repository, 'init', '-b', 'main');
			await git(repository, 'add', '.');
			await git(repository, 'commit', '-m', 'reference');
			const expected = await git(repository, 'rev-parse', 'HEAD');
			const local = await gitLibraryTransport.open(repository, 'main');
			try {
				expect(local.commit).toBe(expected);
				expect(await local.readTest(fixtureId)).toEqual(files);
			} finally {
				await local.close();
			}
			vi.stubEnv('GIT_CONFIG_COUNT', '1');
			vi.stubEnv('GIT_CONFIG_KEY_0', `url.file://${repository}.insteadOf`);
			vi.stubEnv('GIT_CONFIG_VALUE_0', 'https://github.com/fixture/catalog.git');
			vi.stubEnv('GIT_ALLOW_PROTOCOL', 'file');
			try {
				const catalog = await gitLibraryTransport.open('fixture/catalog', 'main');
				try {
					expect(catalog.commit).toBe(expected);
					expect(catalog.ids).toEqual([fixtureId]);
					await writeFile(join(directory, 'TEST.md'), 'new remote content');
					await git(repository, 'add', '.');
					await git(repository, 'commit', '-m', 'new remote version');
					expect(await catalog.readTest(fixtureId)).toEqual(files);
				} finally {
					await catalog.close();
				}
			} finally {
				vi.unstubAllEnvs();
			}
		});
	});

	it('rejects remote identities or refs that could be interpreted as options', async () => {
		await expect(
			gitLibraryTransport.open('https://github.com/fixture/catalog', 'main')
		).rejects.toThrow('identity');
		await expect(gitLibraryTransport.open('fixture/catalog', '--upload-pack=evil')).rejects.toThrow(
			'reference'
		);
	});
});
