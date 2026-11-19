import { db } from '../db.ts';

export const findUser = (id: string) =>
	db.query('SELECT id, plan FROM users WHERE id = $1', [id]);
