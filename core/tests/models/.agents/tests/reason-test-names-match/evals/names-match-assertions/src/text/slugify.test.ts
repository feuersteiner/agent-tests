import { describe, expect, it } from 'vitest';
import { slugify } from './slugify.ts';

describe('slugify', () => {
	it('lowercases the text', () => {
		expect(slugify('Hello')).toBe('hello');
	});

	it('replaces spaces with hyphens', () => {
		expect(slugify('big red dog')).toBe('big-red-dog');
	});

	it('throws on an empty string', () => {
		expect(() => slugify('')).toThrow();
	});
});
