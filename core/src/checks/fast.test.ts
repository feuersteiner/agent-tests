import { describe, expect, it } from 'vitest';
import { evaluateChecks } from './evaluate-checks.js';
import { referenceTest } from './test-support/fixture.js';

describe('fast checks', () => {
	it('reports every definite violation with its line, column and fix', async () => {
		const result = await evaluateChecks(referenceTest(), {
			path: 'src/page.txt',
			content: 'Welcome.\nWe are gonna help.\nYou wanna join.'
		});
		expect(result.outcome).toBe('fail');
		expect(result.checked).toBe(1);
		expect(result.findings).toMatchObject([
			{ testId: 'no-informal-english', checkId: 'formal-only', level: 'fast', line: 2, column: 8 },
			{ level: 'fast', line: 3, column: 5, fix: 'Use formal English.', severity: 'error' }
		]);
	});

	it('passes a formal labeled example without calling models', async () => {
		const result = await evaluateChecks(referenceTest(), {
			path: 'src/page.txt',
			content: 'We will assist.'
		});
		expect(result).toMatchObject({ outcome: 'pass', findings: [], skipped: [], checked: 1 });
	});

	it('rejects malformed regular expressions instead of silently passing', async () => {
		await expect(
			evaluateChecks(referenceTest({ fast: { match: '[' } }), {
				path: 'src/page.txt',
				content: 'Formal.'
			})
		).rejects.toThrow('Invalid regular expression');
	});

	it('reports unresolved maybe-only hints as warnings', async () => {
		const result = await evaluateChecks(referenceTest({ fast: { maybe: 'awesome' } }), {
			path: 'src/page.txt',
			content: 'An awesome service.'
		});
		expect(result.outcome).toBe('unsure');
		expect(result.findings[0]).toMatchObject({ severity: 'warning', level: 'fast', column: 4 });
	});

	it('preserves each repeated maybe hint location', async () => {
		const result = await evaluateChecks(referenceTest({ fast: { maybe: 'awesome' } }), {
			path: 'src/page.txt',
			content: 'awesome\nawesome'
		});
		expect(result.findings).toMatchObject([
			{ line: 1, column: 1, severity: 'warning' },
			{ line: 2, column: 1, severity: 'warning' }
		]);
	});

	it('handles empty matches without looping and deduplicates repeated patterns', async () => {
		const result = await evaluateChecks(referenceTest({ fast: { match: ['^', '^'] } }), {
			path: 'src/page.txt',
			content: 'Formal.'
		});
		expect(result.findings).toHaveLength(1);
		expect(result.findings[0]).toMatchObject({ line: 1, column: 1 });
	});
});
