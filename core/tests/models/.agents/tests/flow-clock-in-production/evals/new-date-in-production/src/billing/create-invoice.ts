import { db } from '../db.ts';
import type { Invoice, Order } from './types.ts';

export const createInvoice = async (order: Order): Promise<Invoice> => {
	const invoice: Invoice = {
		orderId: order.id,
		customerId: order.customerId,
		totalCents: order.lines.reduce((sum, line) => sum + line.priceCents * line.quantity, 0),
		issuedAt: new Date()
	};
	await db.invoices.insert(invoice);
	return invoice;
};
