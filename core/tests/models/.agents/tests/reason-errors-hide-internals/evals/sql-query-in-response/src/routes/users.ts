import { Router } from 'express';
import { db } from '../lib/db.ts';

export const users = Router();

users.get('/users', async (req, res) => {
	const sql = `SELECT id, email, password_hash FROM users WHERE team_id = $1 ORDER BY created_at`;
	try {
		const { rows } = await db.query(sql, [req.query.team]);
		res.json(rows.map(({ id, email }) => ({ id, email })));
	} catch {
		res.status(500).json({ error: `Query failed: ${sql}` });
	}
});
