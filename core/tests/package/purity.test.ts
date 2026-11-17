import { describe, expect, test } from 'bun:test';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** The package folder, core/, resolved from this file. */
const CORE = fileURLToPath(new URL('../..', import.meta.url));

/** The package's public runtime entry, which nothing in src/ or cli/ may import. */
const PUBLIC_INDEX = join(CORE, 'index.ts');

/** One source file: its path relative to core/ and its text. */
interface SourceFile {
	path: string;
	text: string;
}

/** Every TypeScript or JavaScript file under a folder of core/, with its text. */
const sourcesIn = (folder: string): SourceFile[] =>
	readdirSync(join(CORE, folder), { recursive: true, withFileTypes: true })
		.filter((entry) => entry.isFile() && /\.[cm]?[jt]s$/.test(entry.name))
		.map((entry) => {
			const path = join(entry.parentPath, entry.name);
			return { path: path.slice(CORE.length), text: readFileSync(path, 'utf8') };
		});

/** Every module specifier a file imports or re-exports, statically or dynamically. */
const specifiers = (text: string): string[] =>
	[...text.matchAll(/(?:\bfrom|\bimport|\brequire)\s*\(?\s*['"]([^'"]+)['"]/g)].map(
		(match) => match[1] ?? ''
	);

/** The paths of the files whose text matches `pattern`. */
const matching = (files: SourceFile[], pattern: RegExp): string[] =>
	files.filter((file) => pattern.test(file.text)).map((file) => file.path);

const src = sourcesIn('src');
const cli = sourcesIn('cli');

describe('pure Node', () => {
	test('the scan finds the sources of src and cli', () => {
		expect(src.map((file) => file.path)).toContain(join('src', 'index.ts'));
		expect(cli.map((file) => file.path)).toContain(join('cli', 'index.ts'));
	});

	test('nothing under src reads process.env', () => {
		expect(matching(src, /\bprocess\s*\.\s*env\b/)).toEqual([]);
	});

	test('nothing under src or cli imports from bun or bun:*', () => {
		const offenders = [...src, ...cli]
			.filter((file) =>
				specifiers(file.text).some((spec) => spec === 'bun' || spec.startsWith('bun:'))
			)
			.map((file) => file.path);
		expect(offenders).toEqual([]);
	});

	test('nothing under src or cli uses the Bun global', () => {
		expect(matching([...src, ...cli], /\bBun\s*[.[]/)).toEqual([]);
	});

	test('no source under src or cli imports core/index.ts', () => {
		const offenders = [...src, ...cli]
			.filter((file) =>
				specifiers(file.text)
					.filter((spec) => spec.startsWith('.'))
					.map((spec) => resolve(CORE, dirname(file.path), spec).replace(/\.js$/, '.ts'))
					.includes(PUBLIC_INDEX)
			)
			.map((file) => file.path);
		expect(offenders).toEqual([]);
	});

	test('nothing under cli says bunx or bun run', () => {
		expect(matching(cli, /\bbunx\b|\bbun\s+run\b/)).toEqual([]);
	});
});
