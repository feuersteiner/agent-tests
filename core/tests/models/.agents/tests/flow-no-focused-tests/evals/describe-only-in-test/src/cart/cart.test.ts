import { describe, expect, it } from 'vitest';
import { addLine, createCart } from './cart.ts';

describe.only('addLine', () => {
	it('adds a new product as a line', () => {
		const cart = addLine(createCart(), { sku: 'tea', quantity: 1 });
		expect(cart.lines).toHaveLength(1);
	});

	it('merges the same product into one line', () => {
		const cart = addLine(addLine(createCart(), { sku: 'tea', quantity: 1 }), { sku: 'tea', quantity: 2 });
		expect(cart.lines).toEqual([{ sku: 'tea', quantity: 3 }]);
	});
});
