import { describe, expect, it } from 'vitest';
import { createInvoice } from './create-invoice.ts';

describe('createInvoice', () => {
	it('sums the order lines', async () => {
		const invoice = await createInvoice({
			id: 'o1',
			customerId: 'c1',
			lines: [{ priceCents: 250, quantity: 2 }],
			placedAt: new Date()
		});
		expect(invoice.totalCents).toBe(500);
	});

	it('issues the invoice now', async () => {
		const before = new Date();
		const invoice = await createInvoice({ id: 'o2', customerId: 'c1', lines: [], placedAt: before });
		expect(invoice.issuedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
	});
});
