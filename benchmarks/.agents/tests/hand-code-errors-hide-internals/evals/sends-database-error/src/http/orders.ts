import type { Request, Response } from 'express';
import { db } from '../db.ts';

export const getOrder = async (req: Request, res: Response) => {
	try {
		const rows = await db.query('SELECT id, total FROM orders WHERE id = $1', [req.params.id]);
		res.json(rows[0]);
	} catch (dbError) {
		res.status(500).send((dbError as Error).message);
	}
};
