import { describe, expect, test } from 'bun:test';
import { join } from 'node:path';
import { ScopeOrchestrator } from '../../src/scope/index.ts';
import { DirectorySource } from '../../src/sources/index.ts';
import { git } from '../helpers/git.ts';
import { inTempDir } from '../helpers/temp.ts';
import type { Source } from '../../src/sources/index.ts';

/** Each source as `<kind> <path>`, in the order given. */
const describeSources = (sources: Source[]): string[] =>
	sources.map((source) => `${source.kind} ${source.path}`);

describe('ScopeOrchestrator runFolder', () => {
	test('lists every file under the folder as if it were the root, by forward-slash path relative to it', async () => {
		const files = { 'eval/a.ts': 'first', 'eval/src/lib/b.ts': 'second', 'outside.ts': 'no' };
		const found = await inTempDir(files, (dir) => {
			const sources = new ScopeOrchestrator([]).runFolder(join(dir, 'eval'));
			return sources
				.filter((source) => source.kind === 'file')
				.map((source) => [source.path, source.open()]);
		});
		expect(found).toEqual([
			['a.ts', 'first'],
			['src/lib/b.ts', 'second']
		]);
	});

	test('needs no Git repository', async () => {
		const sources = await inTempDir({ 'a.ts': '' }, (dir) => {
			expect(() => git(dir, 'rev-parse', '--git-dir')).toThrow();
			return new ScopeOrchestrator([]).runFolder(dir);
		});
		expect(describeSources(sources)).toEqual(['file a.ts']);
	});

	test('applies the ignore globs', async () => {
		const files = { 'a.ts': '', 'a.log': '', 'tmp/b.ts': '' };
		const sources = await inTempDir(files, (dir) =>
			new ScopeOrchestrator(['*.log', 'tmp/']).runFolder(dir)
		);
		expect(describeSources(sources)).toEqual(['file a.ts']);
	});

	test('includes the ancestor directories of each file, read from the folder', async () => {
		const files = { 'eval/src/lib/b.ts': '' };
		const listing = await inTempDir(files, (dir) => {
			const sources = new ScopeOrchestrator([]).runFolder(join(dir, 'eval'));
			expect(describeSources(sources)).toEqual([
				'directory src',
				'directory src/lib',
				'file src/lib/b.ts'
			]);
			const [src] = sources;
			expect(src).toBeInstanceOf(DirectorySource);
			return src?.open();
		});
		expect(listing).toContain('"src/lib" of kind "directory"');
	});
});
