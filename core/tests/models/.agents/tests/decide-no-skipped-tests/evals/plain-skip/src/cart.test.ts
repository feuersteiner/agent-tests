import { describe, expect, test } from 'bun:test';
import { addItem, total } from './cart.ts';

describe('cart', () => {
	test('adds an item', () => {
		expect(addItem([], { sku: 'a1', cents: 500 })).toHaveLength(1);
	});

	test.skip('sums the prices', () => {
		expect(total([{ sku: 'a1', cents: 500 }, { sku: 'b2', cents: 250 }])).toBe(750);
	});
});
