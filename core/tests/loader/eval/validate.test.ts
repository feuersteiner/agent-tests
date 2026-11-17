import { describe, expect, test } from 'bun:test';
import { validateEval } from '../../../src/loader/index.ts';

describe('validateEval', () => {
	test.each(['pass', 'fail', 'skip'])('accepts expect %p', (outcome) => {
		expect(validateEval({ expect: outcome })).toEqual({ expect: outcome });
	});

	test.each([['Pass'], ['passed'], [' pass'], [''], [true], [null], [1]])(
		'rejects expect %p, which is not exactly pass, fail, or skip',
		(outcome) => {
			expect(() => validateEval({ expect: outcome })).toThrow(
				'expect: Expected pass, fail, or skip'
			);
		}
	);

	test('rejects every unknown field, naming each one', () => {
		expect(() => validateEval({ expect: 'pass', note: 'hi', root: 'src' })).toThrow(
			'note: Unknown field\nroot: Unknown field'
		);
	});

	test('rejects a missing expect', () => {
		expect(() => validateEval({})).toThrow('expect: Expected pass, fail, or skip');
	});
});
