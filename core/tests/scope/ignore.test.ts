import { describe, expect, test } from 'bun:test';
import { execFileSync } from 'node:child_process';
import { symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { ScopeOrchestrator } from '../../src/scope/index.ts';
import { DirectorySource, FileSource } from '../../src/sources/index.ts';
import { commitAll, inTempRepo } from '../helpers/git.ts';
import { inTempDir, makeTempDir, removeDir, writeFiles } from '../helpers/temp.ts';
import type { Source } from '../../src/sources/index.ts';

/** Each source as `<kind> <path>`, in the order given. */
const describeSources = (sources: Source[]): string[] =>
	sources.map((source) => `${source.kind} ${source.path}`);

/** The paths of the file sources only, in the order given. */
const filePaths = (sources: Source[]): string[] =>
	sources.filter((source) => source.kind === 'file').map((source) => source.path);

/** The file paths `runFolder` keeps for `files` under `ignore`. */
const keptFiles = (ignore: string[], files: Record<string, string>): Promise<string[]> =>
	inTempDir(files, (dir) => filePaths(new ScopeOrchestrator(ignore).runFolder(dir)));

describe('ScopeOrchestrator ignore', () => {
	test.each<[string[], string[]]>([
		[[], ['a.log', 'a.ts', 'src/a.ts', 'src/lib/a.test.ts']],
		[['*.log'], ['a.ts', 'src/a.ts', 'src/lib/a.test.ts']],
		[['src/**/*.test.ts'], ['a.log', 'a.ts', 'src/a.ts']],
		[
			['*.log', 'src/a.ts'],
			['a.ts', 'src/lib/a.test.ts']
		]
	])('the ignore globs drop the files they match: %p keeps %p', async (ignore, expected) => {
		const files = { 'a.ts': '', 'a.log': '', 'src/a.ts': '', 'src/lib/a.test.ts': '' };
		expect(await keptFiles(ignore, files)).toEqual(expected);
	});

	test.each<[string[], string[]]>([
		[['dist'], ['distance.ts', 'lib/node_modules/x/i.js', 'src/a.ts']],
		[['dist/'], ['distance.ts', 'lib/node_modules/x/i.js', 'src/a.ts']],
		[['**/node_modules'], ['dist/a.js', 'dist/deep/b.js', 'distance.ts', 'src/a.ts']],
		[['**/node_modules/'], ['dist/a.js', 'dist/deep/b.js', 'distance.ts', 'src/a.ts']]
	])(
		'a glob matching a directory drops everything under it, with or without a trailing slash: %p keeps %p',
		async (ignore, expected) => {
			const files = {
				'dist/a.js': '',
				'dist/deep/b.js': '',
				'distance.ts': '',
				'lib/node_modules/x/i.js': '',
				'src/a.ts': ''
			};
			expect(await keptFiles(ignore, files)).toEqual(expected);
		}
	);

	test.each<[string[], string[]]>([
		[[], ['.cache/x.bin', '.env', '.hidden/a.ts', 'keep.md', 'src/.eslintrc']],
		[['*.env'], ['.cache/x.bin', '.hidden/a.ts', 'keep.md', 'src/.eslintrc']],
		[['src/*'], ['.cache/x.bin', '.env', '.hidden/a.ts', 'keep.md']],
		[['**/*.ts'], ['.cache/x.bin', '.env', 'keep.md', 'src/.eslintrc']],
		[['*/'], ['.env', 'keep.md']]
	])('dotfiles are matched by the ignore globs: %p keeps %p', async (ignore, expected) => {
		const files = {
			'.cache/x.bin': '',
			'.env': '',
			'.hidden/a.ts': '',
			'keep.md': '',
			'src/.eslintrc': ''
		};
		expect(await keptFiles(ignore, files)).toEqual(expected);
	});

	test('each kept file brings its ancestor directories as directory sources', async () => {
		const files = { 'a/b/c.ts': '', 'logs/old/x.log': '' };
		const sources = await inTempDir(files, (dir) =>
			new ScopeOrchestrator(['**/*.log']).runFolder(dir)
		);
		expect(describeSources(sources)).toEqual(['directory a', 'directory a/b', 'file a/b/c.ts']);
		expect(sources.map((source) => source.constructor)).toEqual([
			DirectorySource,
			DirectorySource,
			FileSource
		]);
	});

	test('the root itself is never a source', async () => {
		const sources = await inTempDir({ 'top.ts': '', 'a/b.ts': '' }, (dir) =>
			new ScopeOrchestrator([]).runFolder(dir)
		);
		expect(describeSources(sources)).toEqual(['directory a', 'file a/b.ts', 'file top.ts']);
	});

	test('a directory shared by several kept files appears once', async () => {
		const files = { 'a/b/c.ts': '', 'a/b/d.ts': '', 'a/e.ts': '' };
		const sources = await inTempDir(files, (dir) => new ScopeOrchestrator([]).runFolder(dir));
		expect(describeSources(sources)).toEqual([
			'directory a',
			'directory a/b',
			'file a/b/c.ts',
			'file a/b/d.ts',
			'file a/e.ts'
		]);
	});

	test('sources are sorted by path', async () => {
		const files = { 'z.ts': '', 'm/b.ts': '', 'a.ts': '', 'm/a/x.ts': '' };
		const sources = await inTempDir(files, (dir) => new ScopeOrchestrator([]).runFolder(dir));
		expect(sources.map((source) => source.path)).toEqual([
			'a.ts',
			'm',
			'm/a',
			'm/a/x.ts',
			'm/b.ts',
			'z.ts'
		]);
	});

	test('a symlink to a file and a named pipe on disk are not sources', async () => {
		const sources = await inTempDir({ 'a.ts': '' }, (dir) => {
			symlinkSync('a.ts', join(dir, 'link.ts'));
			execFileSync('mkfifo', [join(dir, 'pipe')]);
			return new ScopeOrchestrator([]).runFolder(dir);
		});
		expect(describeSources(sources)).toEqual(['file a.ts']);
	});

	test('a symlink Git tracks is not a source', async () => {
		const sources = await inTempRepo({ 'a.ts': '' }, (dir) => {
			symlinkSync('a.ts', join(dir, 'link.ts'));
			commitAll(dir);
			return new ScopeOrchestrator([]).run({ kind: 'all' });
		});
		expect(describeSources(sources)).toEqual(['file a.ts']);
	});

	test('a symlink to a directory is not a source, nor are the files behind it', async () => {
		const sources = await inTempDir({ 'real/a.ts': '' }, (dir) => {
			symlinkSync('real', join(dir, 'link'));
			return new ScopeOrchestrator([]).runFolder(dir);
		});
		expect(describeSources(sources)).toEqual(['directory real', 'file real/a.ts']);
	});

	test('a symlink to a directory outside the folder brings in nothing', async () => {
		const outside = makeTempDir();
		try {
			writeFiles(outside, { 'secret.ts': '', 'deep/b.ts': '' });
			const sources = await inTempDir({ 'a.ts': '' }, (dir) => {
				symlinkSync(outside, join(dir, 'link'));
				return new ScopeOrchestrator([]).runFolder(dir);
			});
			expect(describeSources(sources)).toEqual(['file a.ts']);
		} finally {
			removeDir(outside);
		}
	});
});
