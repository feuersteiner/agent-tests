import { db } from '../db.ts';

export const findUserByEmail = (email: string) =>
	db.query(`SELECT id, plan FROM users WHERE email = '${email}'`);
