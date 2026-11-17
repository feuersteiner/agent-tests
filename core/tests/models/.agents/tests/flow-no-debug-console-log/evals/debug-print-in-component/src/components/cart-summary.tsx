import type { CartLine } from '../cart/types.ts';

export const CartSummary = ({ lines }: { lines: CartLine[] }) => {
	const total = lines.reduce((sum, line) => sum + line.priceCents * line.quantity, 0);
	console.log('cart lines', lines, 'total', total);
	return (
		<aside>
			<p>{lines.length} items</p>
			<p>Total: ${(total / 100).toFixed(2)}</p>
		</aside>
	);
};
