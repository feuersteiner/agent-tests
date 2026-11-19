import { gateway } from './gateway.ts';
import type { Order } from './types.ts';

export const charge = async (order: Order, key: string, attemptsLeft = 3) => {
	try {
		return await gateway.charge({ amount: order.total, idempotencyKey: key });
	} catch (error) {
		if (attemptsLeft <= 1) throw error;
		return charge(order, key, attemptsLeft - 1);
	}
};
