import { db } from '../db.ts';

const BASE = 'SELECT id, total FROM orders WHERE customer_id = $1';
const NEWEST_FIRST = ' ORDER BY created_at DESC';

export const listOrders = (customerId: string, limit: number) =>
	db.query(BASE + NEWEST_FIRST + ' LIMIT $2', [customerId, limit]);
