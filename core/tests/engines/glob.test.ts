import { describe, expect, test } from 'bun:test';
import { createGlobEngine } from '../../src/engines/glob.ts';
import type { AgentTestParam } from '../../src/types.ts';

/** Each case: the path, the glob criteria, and the expected score. */
type Case = [string, AgentTestParam, number];

const score = (path: string, criteria: AgentTestParam): Promise<number> =>
	createGlobEngine()(path, criteria);

describe('glob engine', () => {
	test.each<Case>([
		['src/a.ts', 'src/*.ts', 1],
		['src/a.md', 'src/*.ts', 0]
	])('returns exactly 1 or 0: %p against %p scores %p', async (path, criteria, expected) => {
		expect(await score(path, criteria)).toBe(expected);
	});

	test.each<Case>([
		['src/a.ts', 'src/*.ts', 1],
		['src/lib/a.ts', 'src/*.ts', 0],
		['src/a.ts', 'src/**/*.ts', 1],
		['src/lib/deep/a.ts', 'src/**/*.ts', 1],
		['a/b/c/d.ts', '**/*.ts', 1]
	])(
		'* stays within one segment and ** crosses segments: %p against %p scores %p',
		async (path, criteria, expected) => {
			expect(await score(path, criteria)).toBe(expected);
		}
	);

	test.each<Case>([
		['.env', '*', 1],
		['src/.eslintrc', 'src/*', 1],
		['src/.hidden/a.ts', 'src/**/*.ts', 1],
		['.github/workflows/ci.yml', '**/*.yml', 1]
	])(
		'names starting with a dot match: %p against %p scores %p',
		async (path, criteria, expected) => {
			expect(await score(path, criteria)).toBe(expected);
		}
	);

	test.each<Case>([
		['src/a.ts', 'src/*.{ts,js}', 1],
		['src/a.js', 'src/*.{ts,js}', 1],
		['src/a.md', 'src/*.{ts,js}', 0],
		['lib/a.ts', '{src,lib}/**/*.ts', 1]
	])('brace alternatives: %p against %p scores %p', async (path, criteria, expected) => {
		expect(await score(path, criteria)).toBe(expected);
	});

	test.each<Case>([
		['src/a.ts', ['docs/**', 'src/*.ts'], 1],
		['docs/a.md', ['docs/**', 'src/*.ts'], 1],
		['lib/a.ts', ['docs/**', 'src/*.ts'], 0]
	])(
		'a list matches when any glob matches: %p against %p scores %p',
		async (path, criteria, expected) => {
			expect(await score(path, criteria)).toBe(expected);
		}
	);

	test.each<Case>([
		['src/b.ts', '!src/a.ts', 0],
		['src/a.ts', '!src/a.ts', 0],
		['!src/a.ts', '!src/a.ts', 1]
	])('a leading ! is not negation: %p against %p scores %p', async (path, criteria, expected) => {
		expect(await score(path, criteria)).toBe(expected);
	});

	test.each<Case>([
		['src/a.ts', 'src/**/!(*.test).ts', 1],
		['src/lib/a.ts', 'src/**/!(*.test).ts', 1],
		['src/a.test.ts', 'src/**/!(*.test).ts', 0],
		['src/lib/a.test.ts', 'src/**/!(*.test).ts', 0]
	])('an extglob excludes names: %p against %p scores %p', async (path, criteria, expected) => {
		expect(await score(path, criteria)).toBe(expected);
	});

	test.each<Case>([
		['src/lib', 'src/lib', 1],
		['src/lib', 'src/*', 1],
		['src/lib', 'src/**', 1],
		['src/lib', '**/lib', 1],
		['src/lib', 'src/**/*.ts', 0]
	])(
		'directory paths match directory globs: %p against %p scores %p',
		async (path, criteria, expected) => {
			expect(await score(path, criteria)).toBe(expected);
		}
	);

	test.each<Case>([
		['src\\a.ts', 'src/*.ts', 0],
		['src\\a.ts', 'src/**', 0],
		['src\\a.ts', '*.ts', 1]
	])(
		'backslashes are not separators: %p against %p scores %p',
		async (path, criteria, expected) => {
			expect(await score(path, criteria)).toBe(expected);
		}
	);

	test('each engine keeps its own cache and repeated calls agree', async () => {
		const first = createGlobEngine();
		const second = createGlobEngine();
		const calls = [
			await first('src/a.ts', 'src/*.ts'),
			await second('src/a.ts', 'lib/*.ts'),
			await first('src/a.ts', 'lib/*.ts'),
			await second('src/a.ts', 'src/*.ts'),
			await first('src/a.ts', 'src/*.ts'),
			await second('src/a.ts', 'lib/*.ts'),
			await first('src/lib/a.ts', 'src/*.ts'),
			await second('src/lib/a.ts', 'src/**/*.ts')
		];
		expect(calls).toEqual([1, 0, 0, 1, 1, 0, 0, 1]);
	});
});
