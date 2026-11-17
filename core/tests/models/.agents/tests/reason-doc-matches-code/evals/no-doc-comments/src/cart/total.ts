import type { CartLine } from './types.ts';

export const cartTotal = (lines: CartLine[]): number =>
	lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
