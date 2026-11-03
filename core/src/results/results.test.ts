import { describe, expect, it } from 'vitest';
import { createRunResult, formatJson, formatText } from './index.js';
import type { Finding } from './index.js';

const finding: Finding = {
	testId: 'no-informal-english',
	checkId: 'formal',
	level: 'fast',
	file: 'src/a.ts',
	line: 2,
	message: 'Informal greeting',
	fix: 'Use formal English',
	severity: 'error'
};

describe('shared results', () => {
	it('distinguishes success, findings and operational failure', () => {
		expect(createRunResult().exitCode).toBe(0);
		expect(createRunResult({ findings: [finding] }).exitCode).toBe(1);
		expect(createRunResult({ findings: [finding] }, true).exitCode).toBe(2);
	});

	it('warnings and deliberately skipped tests do not fail the process', () => {
		const result = createRunResult({
			findings: [{ ...finding, severity: 'warning', requiresReview: true }],
			warnings: ['No model credentials'],
			skipped: [{ testId: 'model-only', reason: 'Model unavailable' }]
		});
		expect(result.exitCode).toBe(0);
		expect(formatText(result)).toContain('human review requested');
		expect(formatText(result)).toContain('skip: model-only: Model unavailable');
	});

	it('explains locations, rule identifiers, levels and fixes in text and JSON', () => {
		const result = createRunResult({ findings: [finding], checked: 1 });
		const text = formatText(result);
		expect(text).toContain('src/a.ts:2:1  error  Informal greeting');
		expect(text).toContain('no-informal-english/formal (fast): Use formal English');
		expect(JSON.parse(formatJson(result))).toEqual(result);
	});
});
