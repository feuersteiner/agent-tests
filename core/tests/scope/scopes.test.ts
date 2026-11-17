import { describe, expect, test } from 'bun:test';
import { rmSync } from 'node:fs';
import { ScopeOrchestrator } from '../../src/scope/index.ts';
import type { AgentTestScope } from '../../src/scope/types.ts';
import { DirectorySource, FileSource } from '../../src/sources/index.ts';
import { commitAll, git, inTempRepo } from '../helpers/git.ts';
import { inTempDir, writeFiles } from '../helpers/temp.ts';

/** The file paths a run returns, in order. */
const filePaths = (scope: AgentTestScope): string[] =>
	new ScopeOrchestrator([])
		.run(scope)
		.filter((source) => source.kind === 'file')
		.map((source) => source.path);

describe('ScopeOrchestrator.run', () => {
	test('all lists tracked and untracked files that Git does not ignore', async () => {
		const files = { '.gitignore': 'secret.txt\n', 'tracked.ts': 'a', 'src/kept.ts': 'b' };
		await inTempRepo(files, (dir) => {
			writeFiles(dir, { 'untracked.ts': 'c', 'secret.txt': 'd' });
			expect(filePaths({ kind: 'all' })).toEqual([
				'.gitignore',
				'src/kept.ts',
				'tracked.ts',
				'untracked.ts'
			]);
		});
	});

	test('changed lists modified tracked and untracked files, not unchanged ones', async () => {
		await inTempRepo({ 'same.ts': 'a', 'edited.ts': 'b' }, (dir) => {
			writeFiles(dir, { 'edited.ts': 'changed', 'new.ts': 'c' });
			expect(filePaths({ kind: 'changed' })).toEqual(['edited.ts', 'new.ts']);
		});
	});

	test('staged lists only staged changes', async () => {
		await inTempRepo({ 'staged.ts': 'a', 'unstaged.ts': 'b' }, (dir) => {
			writeFiles(dir, { 'staged.ts': 'changed', 'unstaged.ts': 'changed', 'added.ts': 'c' });
			writeFiles(dir, { 'untracked.ts': 'd' });
			git(dir, 'add', 'staged.ts', 'added.ts');
			expect(filePaths({ kind: 'staged' })).toEqual(['added.ts', 'staged.ts']);
		});
	});

	test('base lists files differing between the ref and HEAD, not uncommitted work', async () => {
		await inTempRepo({ 'old.ts': 'a', 'edited.ts': 'b' }, (dir) => {
			git(dir, 'switch', '--quiet', '--create', 'feature');
			writeFiles(dir, { 'edited.ts': 'changed', 'added.ts': 'c' });
			commitAll(dir, 'feature work');
			writeFiles(dir, { 'old.ts': 'uncommitted', 'untracked.ts': 'd' });
			git(dir, 'add', 'old.ts');
			expect(filePaths({ kind: 'base', ref: 'main' })).toEqual(['added.ts', 'edited.ts']);
		});
	});

	const deletions: [string, AgentTestScope, (dir: string) => void][] = [
		['all, deleted from disk only', { kind: 'all' }, () => rmSync('gone.ts')],
		['changed, deleted from disk only', { kind: 'changed' }, () => rmSync('gone.ts')],
		[
			'staged, removed with git rm',
			{ kind: 'staged' },
			(dir) => git(dir, 'rm', '--quiet', 'gone.ts')
		],
		[
			'base, deleted in a commit',
			{ kind: 'base', ref: 'main' },
			(dir) => {
				git(dir, 'switch', '--quiet', '--create', 'feature');
				git(dir, 'rm', '--quiet', 'gone.ts');
				commitAll(dir, 'delete');
			}
		]
	];

	test.each(deletions)('deleted files are never sources: %s', async (_name, scope, remove) => {
		await inTempRepo({ 'gone.ts': 'a', 'kept.ts': 'b' }, (dir) => {
			writeFiles(dir, { 'kept.ts': 'changed' });
			git(dir, 'add', 'kept.ts');
			remove(dir);
			expect(filePaths(scope)).not.toContain('gone.ts');
		});
	});

	test('lists files with spaces or non-ASCII characters in their names', async () => {
		await inTempRepo({ 'my file.ts': 'a', 'café.ts': 'b' }, (dir) => {
			writeFiles(dir, { 'my file.ts': 'changed', 'café.ts': 'changed', 'naïve dir/ünï.ts': 'c' });
			expect(filePaths({ kind: 'changed' })).toEqual(['café.ts', 'my file.ts', 'naïve dir/ünï.ts']);
		});
	});

	test('returns files as FileSource and their ancestor directories as DirectorySource, sorted by path', async () => {
		await inTempRepo({ 'src/lib/a.ts': 'a', 'b.ts': 'b' }, () => {
			const sources = new ScopeOrchestrator([]).run({ kind: 'all' });
			expect(sources.map((source) => [source.constructor, source.kind, source.path])).toEqual([
				[FileSource, 'file', 'b.ts'],
				[DirectorySource, 'directory', 'src'],
				[DirectorySource, 'directory', 'src/lib'],
				[FileSource, 'file', 'src/lib/a.ts']
			]);
			expect(sources[0]?.open()).toBe('b');
		});
	});

	test('throws outside a Git repository', async () => {
		await inTempDir({ 'a.ts': 'a' }, () => {
			expect(() => new ScopeOrchestrator([]).run({ kind: 'all' })).toThrow(/not a git repository/);
		});
	});

	test('throws an error carrying the Git message for an unknown base ref', async () => {
		await inTempRepo({ 'a.ts': 'a' }, () => {
			expect(() => new ScopeOrchestrator([]).run({ kind: 'base', ref: 'no-such-ref' })).toThrow(
				/fatal: .*no-such-ref/
			);
		});
	});
});
