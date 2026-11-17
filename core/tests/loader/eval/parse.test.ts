import { describe, expect, test } from 'bun:test';
import { parseEval } from '../../../src/loader/index.ts';

describe('parseEval', () => {
	test.each(['pass', 'fail', 'skip'])('parses expect: %s', (outcome) => {
		expect(parseEval(`expect: ${outcome}\n`)).toEqual({ expect: outcome });
	});

	test.each(['expect: Pass\n', 'expect: passed\n', "expect: ' pass'\n", 'expect: true\n'])(
		'rejects %p, which is not exactly pass, fail, or skip',
		(text) => {
			expect(() => parseEval(text)).toThrow('expect: Expected pass, fail, or skip');
		}
	);

	test('rejects an unknown field', () => {
		expect(() => parseEval('expect: pass\nnote: hi\n')).toThrow('note: Unknown field');
	});

	test('rejects a missing expect', () => {
		expect(() => parseEval('{}\n')).toThrow('expect: Expected pass, fail, or skip');
	});
});
