import { describe, expect, test } from 'bun:test';
import { z } from 'zod';
import { describeIssues } from '../../../src/loader/helpers/issues.ts';

const schema = z.strictObject({
	version: z.literal(1),
	select: z.strictObject({ glob: z.array(z.string()) })
});

const issuesOf = (value: unknown): z.core.$ZodIssue[] => {
	const result = schema.safeParse(value);
	if (result.success) throw new Error('expected the value to be invalid');
	return result.error.issues;
};

describe('describeIssues', () => {
	test('returns no lines for no issues', () => {
		expect(describeIssues([])).toEqual([]);
	});

	test('joins a nested path with dots before the message', () => {
		const lines = describeIssues(issuesOf({ version: 1, select: { glob: ['a', 2] } }));
		expect(lines).toHaveLength(1);
		expect(lines[0]).toStartWith('select.glob.1: ');
		expect(lines[0]!.length).toBeGreaterThan('select.glob.1: '.length);
	});

	test('names an issue at the root "value"', () => {
		const lines = describeIssues(issuesOf('not an object'));
		expect(lines).toHaveLength(1);
		expect(lines[0]).toStartWith('value: ');
	});

	test('reports each unknown field on its own line, under its parent path', () => {
		const lines = describeIssues(
			issuesOf({ version: 1, extra: true, select: { glob: [], grep: 'x', decide: 'y' } })
		);
		expect(lines.toSorted()).toEqual([
			'extra: Unknown field',
			'select.decide: Unknown field',
			'select.grep: Unknown field'
		]);
	});
});
