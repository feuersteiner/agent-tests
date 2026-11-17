import { expect, test } from 'vitest';
import { sortPrices } from './sort.ts';

test('sorts prices from highest to lowest', () => {
	expect(sortPrices([30, 10, 20])).toEqual([10, 20, 30]);
});
