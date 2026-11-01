import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { rm } from 'node:fs/promises';
import { collectCandidates } from './index.js';
import { createRoot, git, initializeGit, write } from './tests/fixture.js';

let root: string;
beforeEach(async () => {
	root = await createRoot();
	await initializeGit(root);
});
afterEach(async () => {
	await rm(root, { recursive: true, force: true });
});

describe('base change scope', () => {
	it('selects committed branch changes from the merge base, including renamed paths', async () => {
		await write(root, 'copy.txt', 'going to');
		await write(root, 'deleted.txt', 'old');
		await git(root, 'add', '.');
		await git(root, 'commit', '-m', 'initial');
		await git(root, 'checkout', '-b', 'feature');
		await git(root, 'mv', 'copy.txt', 'renamed copy.txt');
		await git(root, 'rm', 'deleted.txt');
		await git(root, 'commit', '-m', 'rename and delete');
		await write(root, 'untracked.txt', 'not part of the committed diff');
		const files = await collectCandidates(root, { base: 'main' });
		expect(files.map((file) => file.path)).toEqual(['renamed copy.txt']);
		expect(files[0]?.content).toBe('going to');
		expect(await collectCandidates(root, { base: 'main', paths: ['nothing/**'] })).toEqual([]);
	});

	it('surfaces invalid base refs instead of accepting an empty scope', async () => {
		await write(root, 'copy.txt', 'going to');
		await git(root, 'add', '.');
		await git(root, 'commit', '-m', 'initial');
		await expect(collectCandidates(root, { base: 'does-not-exist' })).rejects.toThrow();
	});
});
