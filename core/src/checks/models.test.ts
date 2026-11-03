import { describe, expect, it } from 'vitest';
import { createMockModel } from '../models/index.js';
import type { DecisionRequest } from '../models/index.js';
import { evaluateChecks } from './evaluate-checks.js';
import { referenceTest } from './test-support/fixture.js';

const target = { path: 'src/page.txt', content: 'Welcome.\nAn awesome service.' };
const staged = () =>
	referenceTest({
		fast: { maybe: 'awesome' },
		smart: { ask: 'Find informal English.', bounds: [0.3, 0.8] },
		deep: { ask: 'Confirm informal English.', reasoning: 'high' }
	});

describe('model escalation', () => {
	it('passes low violation confidence and stops before deep', async () => {
		const requests: DecisionRequest[] = [];
		const model = createMockModel((request) => {
			requests.push(request);
			return { decision: 'fail', confidence: 0.2 };
		});
		expect((await evaluateChecks(staged(), target, model)).outcome).toBe('pass');
		expect(requests.map((request) => request.level)).toEqual(['smart']);
		expect(requests[0]?.hints).toEqual(['awesome']);
	});

	it('confirms smart violations through deep and forwards reasoning and evidence', async () => {
		const requests: DecisionRequest[] = [];
		const model = createMockModel((request) => {
			requests.push(request);
			return request.level === 'smart'
				? { decision: 'fail', confidence: 0.9, matches: [{ text: 'awesome' }] }
				: {
						decision: 'fail',
						matches: [{ text: 'awesome', line: 2 }],
						message: 'Informal adjective.'
					};
		});
		const result = await evaluateChecks(staged(), target, model);
		expect(requests.map((request) => request.level)).toEqual(['smart', 'deep']);
		expect(requests[1]).toMatchObject({ reasoning: 'high', hints: ['awesome', 'awesome'] });
		expect(result.findings[0]).toMatchObject({
			level: 'deep',
			line: 2,
			column: 4,
			message: 'Informal adjective.'
		});
	});

	it('allows deep review to overturn a smart false positive', async () => {
		const model = createMockModel([{ decision: 'fail', confidence: 0.9 }, { decision: 'pass' }]);
		expect(await evaluateChecks(staged(), target, model)).toMatchObject({
			outcome: 'pass',
			findings: []
		});
	});

	it('escalates borderline confidence and warns on final uncertainty', async () => {
		const definition = staged();
		definition.checks[0]!['human-tiebreak'] = true;
		const model = createMockModel([{ decision: 'fail', confidence: 0.5 }, { decision: 'unsure' }]);
		const result = await evaluateChecks(definition, target, model);
		expect(result.outcome).toBe('unsure');
		expect(result.findings[0]).toMatchObject({
			level: 'deep',
			severity: 'warning',
			requiresReview: true
		});
	});

	it('settles definite fast violations without any model request', async () => {
		const model = createMockModel(() => {
			throw new Error('Must not call.');
		});
		expect(
			(
				await evaluateChecks(
					referenceTest({ smart: { ask: 'Check.' } }),
					{
						path: 'src/page.txt',
						content: 'gonna'
					},
					model
				)
			).outcome
		).toBe('fail');
	});

	it('escalates a no-hit fast result when later levels exist', async () => {
		const model = createMockModel([{ decision: 'pass' }]);
		const result = await evaluateChecks(referenceTest({ smart: { ask: 'Check.' } }), target, model);
		expect(result.outcome).toBe('pass');
	});

	it('keeps exact confidence boundaries uncertain', async () => {
		for (const confidence of [0.3, 0.8]) {
			const definition = referenceTest({
				fast: undefined,
				smart: { ask: 'Check.', bounds: [0.3, 0.8] }
			});
			const model = createMockModel([{ decision: 'fail', confidence }]);
			expect((await evaluateChecks(definition, target, model)).outcome).toBe('unsure');
		}
	});

	it('locates quoted evidence even when a model supplies an incorrect line', async () => {
		const definition = referenceTest({ fast: undefined, deep: { ask: 'Check.' } });
		const model = createMockModel([{ decision: 'fail', matches: [{ text: 'awesome', line: 3 }] }]);
		const result = await evaluateChecks(
			definition,
			{ ...target, content: target.content + '\nEnd.' },
			model
		);
		expect(result.findings[0]).toMatchObject({ line: 2, column: 4 });
	});
});
