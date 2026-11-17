import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { DirectorySource } from '../../src/sources/index.ts';
import { makeTempDir, removeDir, writeFiles } from '../helpers/temp.ts';

/** The listing's header line and its child lines, in the listing's order. */
const parseListing = (content: string): { header: string; children: string[] } => {
	const [header = '', ...children] = content.split('\n');
	return { header, children };
};

describe('DirectorySource', () => {
	let root = '';

	beforeEach(() => {
		root = makeTempDir();
	});

	afterEach(() => {
		removeDir(root);
	});

	test('keeps the logical path relative, without the root prefix', () => {
		expect(new DirectorySource('src/lib', root).path).toBe('src/lib');
	});

	test('is of kind directory', () => {
		expect(new DirectorySource('src', root).kind).toBe('directory');
	});

	test('reads lazily: constructing one for a missing directory does not throw', () => {
		expect(() => new DirectorySource('missing', root)).not.toThrow();
	});

	test('opens to a header naming the directory and its path, then one line per child', () => {
		writeFiles(root, { 'src/lib/a.ts': 'one\ntwo\n', 'src/lib/util/b.ts': 'x' });
		const listing = parseListing(new DirectorySource('src/lib', root).open());
		expect(listing.header).toBe('Directory "lib" at "src/lib":');
		expect(listing.children).toEqual([
			'\t- "src/lib/a.ts" of kind "file" with line count: 2.',
			'\t- "src/lib/util" of kind "directory".'
		]);
	});

	test.each<[string, string, number]>([
		['empty', '', 0],
		['one line without a final newline', 'a', 1],
		['one line with a final newline', 'a\n', 1],
		['only a newline', '\n', 1],
		['two lines without a final newline', 'a\nb', 2],
		['two lines with a final newline', 'a\nb\n', 2],
		['CRLF line endings', 'a\r\nb\r\n', 2],
		['CR line endings', 'a\rb\r', 2],
		['a blank line in the middle', 'a\n\nb\n', 3]
	])('counts the lines of a %s file', (_, content, expected) => {
		writeFiles(root, { 'src/a.txt': content });
		const listing = parseListing(new DirectorySource('src', root).open());
		expect(listing.children).toEqual([
			`\t- "src/a.txt" of kind "file" with line count: ${expected}.`
		]);
	});

	test('lists only immediate children, not nested ones', () => {
		writeFiles(root, {
			'src/a.ts': 'a',
			'src/lib/b.ts': 'b',
			'src/lib/deep/c.ts': 'c'
		});
		const content = new DirectorySource('src', root).open();
		expect(content).toContain('"src/lib" of kind "directory".');
		expect(content).not.toContain('src/lib/b.ts');
		expect(content).not.toContain('src/lib/deep');
	});

	test('lists the children sorted by name in code-point order, not locale order', () => {
		writeFiles(root, { 'src/b.ts': 'b', 'src/9.ts': '9', 'src/B/x.ts': 'x', 'src/10.ts': '1' });
		const listing = parseListing(new DirectorySource('src', root).open());
		expect(listing.children).toEqual([
			'\t- "src/10.ts" of kind "file" with line count: 1.',
			'\t- "src/9.ts" of kind "file" with line count: 1.',
			'\t- "src/B" of kind "directory".',
			'\t- "src/b.ts" of kind "file" with line count: 1.'
		]);
	});

	test('lists the children in the same order on every read of the same directory', () => {
		writeFiles(root, { 'src/b.ts': 'b', 'src/a.ts': 'a', 'src/C/x.ts': 'x', 'src/10.ts': '1' });
		const first = new DirectorySource('src', root).open();
		const second = new DirectorySource('src', root).open();
		expect(second).toBe(first);
	});
});
