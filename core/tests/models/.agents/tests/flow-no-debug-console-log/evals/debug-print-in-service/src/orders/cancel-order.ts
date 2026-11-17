import { db } from '../db.ts';
import { refund } from '../billing/refund.ts';

export const cancelOrder = async (orderId: string): Promise<void> => {
	const order = await db.orders.find(orderId);
	console.log('order before cancel', order);
	if (order.status === 'shipped') throw new Error('A shipped order cannot be cancelled');
	await db.orders.update(orderId, { status: 'cancelled' });
	await refund(order.paymentId, order.totalCents);
};
