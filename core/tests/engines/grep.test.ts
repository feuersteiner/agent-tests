import { describe, expect, test } from 'bun:test';
import { createGrepEngine } from '../../src/engines/grep.ts';
import type { AgentTestParam } from '../../src/types.ts';

type Case = [input: string, criteria: AgentTestParam, count: number];

const expectCounts = async (cases: Case[]): Promise<void> => {
	const grep = createGrepEngine();
	for (const [input, criteria, count] of cases) expect(await grep(input, criteria)).toBe(count);
};

describe('grep engine', () => {
	test('returns the number of non-overlapping matches', async () => {
		await expectCounts([
			['TODO one, TODO two', 'TODO', 2],
			['aaaa', 'aa', 2],
			['aaa', 'aa', 1],
			['ababa', 'aba', 1]
		]);
	});

	test('returns zero when nothing matches', async () => {
		await expectCounts([
			['all done', 'TODO', 0],
			['', 'TODO', 0]
		]);
	});

	test('matches case-sensitively', async () => {
		await expectCounts([
			['todo Todo', 'TODO', 0],
			['todo TODO', 'TODO', 1],
			['TODO', 'todo', 0]
		]);
	});

	test('anchors ^ and $ to the whole content, not to lines', async () => {
		await expectCounts([
			['a\nb', '^b', 0],
			['a\nb', 'a$', 0],
			['a\na', '^a', 1],
			['b\nb', 'b$', 1]
		]);
	});

	test('does not let a dot match a line break', async () => {
		await expectCounts([
			['a\nb', 'a.b', 0],
			['a\r\nb', 'a..b', 0],
			['axb', 'a.b', 1]
		]);
	});

	test('returns the highest count among a list of patterns', async () => {
		await expectCounts([
			['abb', ['a', 'b'], 2],
			['abb', ['b', 'a'], 2],
			['abb', ['x', 'a'], 1],
			['abb', ['x', 'y'], 0]
		]);
	});

	test('counts every empty match of a pattern that matches empty text', async () => {
		await expectCounts([
			['abc', '', 4],
			['axb', 'x*', 4],
			['', 'x*', 1]
		]);
	});

	test('gives correct counts on repeated calls with the same cached pattern', async () => {
		await expectCounts([
			['TODO TODO TODO', 'TODO', 3],
			['TODO', 'TODO', 1],
			['TODO', 'TODO', 1],
			['xxxxxxxxxxxxTODO', 'TODO', 1],
			['TODO', 'TODO', 1],
			['none', 'TODO', 0],
			['TODO TODO', 'TODO', 2],
			['TODO TODO', ['TODO', 'FIXME'], 2],
			['FIXME', ['TODO', 'FIXME'], 1],
			['TODO', ['TODO', 'FIXME'], 1]
		]);
	});
});
