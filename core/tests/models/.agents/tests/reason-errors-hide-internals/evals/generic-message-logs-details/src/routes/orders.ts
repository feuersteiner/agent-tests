import { Router } from 'express';
import { logger } from '../lib/logger.ts';
import { findOrder } from '../lib/orders.ts';

export const orders = Router();

orders.get('/orders/:id', async (req, res) => {
	try {
		const order = await findOrder(req.params.id);
		if (!order) return res.status(404).json({ error: 'Order not found' });
		res.json(order);
	} catch (err) {
		logger.error({ err, orderId: req.params.id }, `findOrder failed: ${(err as Error).stack}`);
		res.status(500).json({ error: 'Something went wrong. Please try again later.' });
	}
});
