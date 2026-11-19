import { expect, test } from 'bun:test';
import { compare, summarize, sweep } from '../src/metrics.ts';
import type { Decision } from '../src/types.ts';

/** One decision of contender `a` unless overridden. */
const decision = (
	id: string,
	expect: 'pass' | 'fail',
	probability: number | undefined,
	overrides: Partial<Decision> = {}
): Decision => ({
	contender: 'a',
	case: id,
	test: 'hand-x',
	tier: 'hand',
	category: 'copy',
	expect,
	repeat: 1,
	probability,
	latencyMs: 100,
	http: [],
	...overrides
});

test('accuracy weighs each case once and splits the two kinds of error', () => {
	const summary = summarize(
		[
			decision('clean', 'pass', 0.9),
			decision('clean', 'pass', 0.2),
			decision('clean-2', 'pass', 0.8),
			decision('bad', 'fail', 0.1),
			decision('bad-2', 'fail', 0.7)
		],
		0.5
	);
	expect(summary.accuracy).toBeCloseTo((0.5 + 1 + 1 + 0) / 4);
	expect(summary.falseBlockRate).toBeCloseTo(0.25);
	expect(summary.missedRate).toBeCloseTo(0.5);
});

test('a probability at the threshold passes, as in the assert orchestrator', () => {
	expect(summarize([decision('edge', 'pass', 0.5)], 0.5).accuracy).toBe(1);
});

test('the flip rate counts cases whose repeats disagree', () => {
	const summary = summarize(
		[
			decision('steady', 'pass', 0.9),
			decision('steady', 'pass', 0.8),
			decision('flips', 'pass', 0.9),
			decision('flips', 'pass', 0.1),
			decision('asked-once', 'fail', 0.1)
		],
		0.5
	);
	expect(summary.flipRate).toBeCloseTo(0.5);
});

test('a thrown call is an error, not a wrong answer', () => {
	const summary = summarize(
		[decision('ok', 'pass', 0.9), decision('threw', 'pass', undefined, { error: 'boom' })],
		0.5
	);
	expect(summary.errors).toBe(1);
	expect(summary.accuracy).toBe(1);
});

test('cost needs both usage and a price', () => {
	const http = [{ ms: 1, status: 200, inputTokens: 1000, outputTokens: 10 }];
	const decisions = [decision('ok', 'pass', 0.9, { http })];
	const price = { currency: 'USD', inputPerMillion: 2, outputPerMillion: 10, asOf: '2026-11-19' };
	expect(summarize(decisions, 0.5, price).costPer1000).toBeCloseTo(2.1);
	expect(summarize(decisions, 0.5).costPer1000).toBeUndefined();
	expect(summarize([decision('ok', 'pass', 0.9)], 0.5, price).costPer1000).toBeUndefined();
});

test('the sweep recomputes accuracy at each threshold', () => {
	const points = sweep([decision('unsure', 'pass', 0.3)]);
	expect(points).toHaveLength(19);
	expect(points.find(({ threshold }) => threshold === 0.25)?.accuracy).toBe(1);
	expect(points.find(({ threshold }) => threshold === 0.5)?.accuracy).toBe(0);
});

test('the comparison pairs the contenders case by case', () => {
	const both = (id: string, a: number, b: number): Decision[] => [
		decision(id, 'pass', a),
		decision(id, 'pass', b, { contender: 'b' })
	];
	const result = compare(
		[...both('one', 0.9, 0.9), ...both('two', 0.9, 0.1), ...both('three', 0.1, 0.1)],
		'a',
		'b',
		0.5
	);
	expect(result.both).toBe(1);
	expect(result.onlyFirst).toEqual(['two']);
	expect(result.onlySecond).toEqual([]);
	expect(result.neither).toEqual(['three']);
	expect(result.pValue).toBe(1);
});

test('the sign test is small only for a lopsided split', () => {
	const lopsided = Array.from({ length: 10 }, (_, index) => [
		decision(`case-${index}`, 'pass', 0.9),
		decision(`case-${index}`, 'pass', 0.1, { contender: 'b' })
	]).flat();
	expect(compare(lopsided, 'a', 'b', 0.5).pValue).toBeCloseTo(2 / 1024);
});
