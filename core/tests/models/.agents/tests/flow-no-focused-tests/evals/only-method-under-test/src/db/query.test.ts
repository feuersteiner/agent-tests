import { describe, expect, it } from 'vitest';
import { from } from './query.ts';

describe('only', () => {
	it('selects just the given columns', () => {
		expect(from('users').only('id', 'email').toSql()).toBe('SELECT id, email FROM users');
	});

	it('selects every column when not called', () => {
		expect(from('users').toSql()).toBe('SELECT * FROM users');
	});
});
