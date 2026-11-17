import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { FileSource } from '../../src/sources/index.ts';
import { inTempDir, makeTempDir, removeDir, writeFiles } from '../helpers/temp.ts';

describe('FileSource', () => {
	let root = '';

	beforeEach(() => {
		root = makeTempDir();
	});

	afterEach(() => {
		removeDir(root);
	});

	test('keeps the logical path relative, without the root prefix', () => {
		const source = new FileSource('src/a.ts', root);
		expect(source.path).toBe('src/a.ts');
	});

	test('is of kind file', () => {
		expect(new FileSource('src/a.ts', root).kind).toBe('file');
	});

	test('reads the path relative to its root, not the working directory', () => {
		writeFiles(root, { 'src/a.ts': 'from the root' });
		expect(new FileSource('src/a.ts', root).open()).toBe('from the root');
	});

	test('reads relative to the working directory when no root is given', async () => {
		const content = await inTempDir({ 'src/a.ts': 'from the cwd' }, () =>
			new FileSource('src/a.ts').open()
		);
		expect(content).toBe('from the cwd');
	});

	test('reads the file as UTF-8 text', () => {
		writeFiles(root, { 'a.md': 'café ✓\n' });
		expect(new FileSource('a.md', root).open()).toBe('café ✓\n');
	});

	test('reads lazily: constructing one for a missing file does not throw', () => {
		expect(() => new FileSource('missing.ts', root)).not.toThrow();
	});

	test('throws on open when the file is missing', () => {
		expect(() => new FileSource('missing.ts', root).open()).toThrow();
	});

	test('retries a failed read: opens once the missing file exists', () => {
		const source = new FileSource('late.ts', root);
		expect(() => source.open()).toThrow();
		writeFiles(root, { 'late.ts': 'arrived' });
		expect(source.open()).toBe('arrived');
	});

	test('keeps the first content when the file changes after the first open', () => {
		writeFiles(root, { 'a.ts': 'before' });
		const source = new FileSource('a.ts', root);
		expect(source.open()).toBe('before');
		writeFileSync(join(root, 'a.ts'), 'after');
		expect(source.open()).toBe('before');
	});

	test('keeps the first content when the file disappears after the first open', () => {
		writeFiles(root, { 'a.ts': 'before' });
		const source = new FileSource('a.ts', root);
		expect(source.open()).toBe('before');
		rmSync(join(root, 'a.ts'));
		expect(source.open()).toBe('before');
	});

	test('caches empty text too: a file empty at the first open stays empty', () => {
		writeFiles(root, { 'a.ts': '' });
		const source = new FileSource('a.ts', root);
		expect(source.open()).toBe('');
		writeFileSync(join(root, 'a.ts'), 'filled later');
		expect(source.open()).toBe('');
	});
});
