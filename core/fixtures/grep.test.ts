import { describe, expect, test } from 'bun:test';
import { createGrepEngine } from '../src/shared/engines/grep.ts';

describe('grep occurrence counting', () => {
	test.each([
		{ input: 'TODO TODO TODO', pattern: 'TODO', count: 3 },
		{ input: 'TODO\nTODO\n', pattern: 'TODO', count: 2 },
		{ input: 'finished work', pattern: 'TODO', count: 0 },
		{ input: '', pattern: 'TODO', count: 0 },
		{ input: 'aaaa', pattern: 'aa', count: 2 },
		{ input: 'aaa', pattern: 'aa', count: 1 },
		{ input: 'TODO TODO', pattern: '(TO)(DO)', count: 2 },
		{ input: 'TODO FIXME TODO', pattern: 'TODO|FIXME', count: 3 },
		{ input: 'TODO TODO', pattern: '(?=TODO)', count: 2 },
		{ input: 'ab', pattern: '(?=)', count: 3 },
		{ input: 'aaa', pattern: 'a*', count: 2 },
		{ input: '', pattern: '^|$', count: 1 }
	])('counts $pattern in $input as $count', async ({ input, pattern, count }) => {
		expect(await createGrepEngine()(input, pattern)).toBe(count);
	});

	test('returns the highest alternative count without summing alternatives', async () => {
		const grep = createGrepEngine();
		expect(await grep('TODO TODO FIXME FIXME FIXME', ['TODO', 'FIXME'])).toBe(3);
		expect(await grep('TODO TODO', ['TODO', 'TODO'])).toBe(2);
		expect(await grep('aaaa', ['a', 'aa'])).toBe(4);
		expect(await grep('finished work', ['TODO', 'FIXME'])).toBe(0);
	});

	test('supports ordinary matching with count > 0', async () => {
		const grep = createGrepEngine();
		expect((await grep('TODO TODO', 'TODO')) > 0).toBe(true);
		expect((await grep('finished work', 'TODO')) > 0).toBe(false);
	});

	test('reuses cached patterns without leaking match positions between calls', async () => {
		const grep = createGrepEngine();
		expect(await grep('TODO TODO', 'TODO')).toBe(2);
		expect(await grep('TODO', 'TODO')).toBe(1);
		expect(await grep('finished work', 'TODO')).toBe(0);
		expect(await grep('TODO TODO', 'TODO')).toBe(2);
		expect(await grep('ab', '(?=)')).toBe(3);
		expect(await grep('', '(?=)')).toBe(1);
		expect(await Promise.all([grep('TODO', 'TODO'), grep('TODO TODO', 'TODO')])).toEqual([1, 2]);
	});

	test('rejects every malformed regex even when an earlier alternative matches', async () => {
		const grep = createGrepEngine();
		await expect(grep('TODO', '[')).rejects.toThrow();
		await expect(grep('TODO', ['TODO', '['])).rejects.toThrow();
		expect(await grep('TODO TODO', 'TODO')).toBe(2);
	});

	test.each([{ criteria: '' }, { criteria: ' ' }, { criteria: [] }, { criteria: ['TODO', ''] }])(
		'rejects invalid criteria %j',
		async ({ criteria }) => {
			const param = typeof criteria === 'string' ? criteria : [...criteria];
			await expect(createGrepEngine()('TODO', param)).rejects.toThrow();
		}
	);
});
