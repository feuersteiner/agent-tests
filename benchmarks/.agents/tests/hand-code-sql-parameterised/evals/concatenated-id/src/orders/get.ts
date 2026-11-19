import type { Request, Response } from 'express';
import { db } from '../db.ts';

export const getOrder = async (req: Request, res: Response) => {
	const rows = await db.query('SELECT id, total FROM orders WHERE id = ' + req.params.id);
	res.json(rows[0]);
};
