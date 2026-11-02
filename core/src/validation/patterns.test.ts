import { describe, expect, it } from 'vitest';
import { isRiskyPattern } from './is-risky-pattern.js';

describe('pattern repetition guard', () => {
	it.each(['(a{1,})+$', '(a{1,3})+$', '(a{2,}){2,}$', '(a+)+$', '(a)\\1'])(
		'flags %s without executing it',
		(pattern) => expect(isRiskyPattern(pattern)).toBe(true)
	);

	it.each(['a{1,}$', '(a{2})+$', '(a{1,1})+$', '(a\\{1,})+$', '([+*{}])+$'])(
		'keeps supported pattern %s',
		(pattern) => expect(isRiskyPattern(pattern)).toBe(false)
	);
});
