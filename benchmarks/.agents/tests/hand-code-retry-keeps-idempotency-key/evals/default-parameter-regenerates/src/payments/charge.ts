import { randomUUID } from 'node:crypto';
import { gateway } from './gateway.ts';
import type { Order } from './types.ts';

export const charge = async (order: Order, attemptsLeft = 3, key = randomUUID()) => {
	try {
		return await gateway.charge({ amount: order.total, idempotencyKey: key });
	} catch (error) {
		if (attemptsLeft <= 1) throw error;
		return charge(order, attemptsLeft - 1);
	}
};
