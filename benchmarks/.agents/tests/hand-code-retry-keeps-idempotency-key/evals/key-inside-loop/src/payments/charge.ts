import { randomUUID } from 'node:crypto';
import { gateway } from './gateway.ts';
import type { Order } from './types.ts';

const MAX_ATTEMPTS = 3;

export const charge = async (order: Order) => {
	for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
		const idempotencyKey = randomUUID();
		try {
			return await gateway.charge({ amount: order.total, idempotencyKey });
		} catch (error) {
			if (attempt === MAX_ATTEMPTS) throw error;
		}
	}
};
