import type { Request, Response } from 'express';
import { db } from '../db.ts';

export const listOrders = async (req: Request, res: Response) => {
	const rows = await db.query(
		`SELECT id, total FROM orders WHERE customer_id = $1 ORDER BY ${req.query.sort}`,
		[req.params.customerId]
	);
	res.json(rows);
};
