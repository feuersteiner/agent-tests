import { from } from '../db/query.ts';
import { db } from '../db/client.ts';
import type { UserSummary } from './types.ts';

export const listUsers = async (limit: number): Promise<UserSummary[]> => {
	const query = from('users').only('id', 'email', 'name').orderBy('name').limit(limit);
	return db.all<UserSummary>(query.toSql(), query.params());
};
