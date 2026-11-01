import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { rm, symlink } from 'node:fs/promises';
import { join } from 'node:path';
import { collectCandidates } from './index.js';
import { createRoot, git, initializeGit, installTest, write } from './tests/fixture.js';

let root: string;
beforeEach(async () => {
	root = await createRoot();
});
afterEach(async () => {
	await rm(root, { recursive: true, force: true });
});

describe('candidate files', () => {
	it('selects text paths and globs without dependency, binary, or symlink traversal', async () => {
		await installTest(root);
		await write(root, 'src/copy.txt', 'gonna');
		await write(root, 'src/.hidden.txt', 'going to');
		await write(root, 'image.bin', 'binary\0content');
		await write(root, 'node_modules/vendor.txt', 'gonna');
		await write(root, 'dist/generated.txt', 'gonna');
		await symlink(join(root, 'src/copy.txt'), join(root, 'linked.txt'));
		await symlink(join(root, 'src'), join(root, 'shortcut'));
		expect((await collectCandidates(root)).map((file) => file.path)).toEqual([
			'src/.hidden.txt',
			'src/copy.txt'
		]);
		expect((await collectCandidates(root, { paths: ['src/*.txt'] })).length).toBe(2);
		expect((await collectCandidates(root, { paths: [join(root, 'src/copy.txt')] })).length).toBe(1);
		expect(await collectCandidates(root, { paths: ['../outside.txt'] })).toEqual([]);
	});

	it('rejects Git scopes outside a repository and contradictory scopes', async () => {
		await expect(collectCandidates(root, { staged: true })).rejects.toThrow('Git repository');
		await expect(collectCandidates(root, { changed: true, staged: true })).rejects.toThrow(
			'Choose only one'
		);
		await expect(collectCandidates(root, { base: '--output=outside' })).rejects.toThrow(
			'cannot begin'
		);
	});

	it('honors ignores and distinguishes index content from dirty working content', async () => {
		await initializeGit(root);
		await installTest(root);
		await write(root, '.gitignore', 'ignored.txt\n.env\n');
		await write(root, 'copy.txt', 'going to');
		await write(root, 'deleted.txt', 'old');
		await git(root, 'add', '.');
		await git(root, 'commit', '-m', 'initial');
		await write(root, 'copy.txt', 'gonna staged');
		await git(root, 'add', 'copy.txt');
		await write(root, 'copy.txt', 'working copy');
		await write(root, 'line\nbreak.txt', 'new file');
		await write(root, 'ignored.txt', 'ignored');
		await write(root, '.env', 'SECRET=not-a-real-secret');
		await rm(join(root, 'deleted.txt'));
		const staged = await collectCandidates(root, { staged: true });
		expect(staged.map((file) => [file.path, file.content])).toEqual([['copy.txt', 'gonna staged']]);
		const changed = await collectCandidates(root, { changed: true });
		expect(changed.map((file) => [file.path, file.content])).toEqual([
			['copy.txt', 'working copy'],
			['line\nbreak.txt', 'new file']
		]);
		expect((await collectCandidates(root)).map((file) => file.path)).toEqual([
			'.gitignore',
			'copy.txt',
			'line\nbreak.txt'
		]);
	});

	it('reads staged files even when their working copy was deleted and excludes index symlinks', async () => {
		await initializeGit(root);
		await write(root, 'copy.txt', 'gonna staged');
		await symlink('copy.txt', join(root, 'linked.txt'));
		await git(root, 'add', '.');
		await rm(join(root, 'copy.txt'));
		expect((await collectCandidates(root, { staged: true })).map((file) => file.path)).toEqual([
			'copy.txt'
		]);
	});

	it('handles unborn repositories and nested roots with literal filenames', async () => {
		await initializeGit(root);
		await write(root, 'packages/web/-copy.txt', 'gonna');
		await write(root, 'other.txt', 'outside package');
		await git(root, 'add', 'packages/web/-copy.txt');
		const nested = join(root, 'packages/web');
		expect((await collectCandidates(nested, { changed: true })).map((file) => file.path)).toEqual([
			'-copy.txt'
		]);
	});
});
