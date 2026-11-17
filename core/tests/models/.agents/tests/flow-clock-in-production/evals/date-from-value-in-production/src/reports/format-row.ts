import type { OrderRow } from './types.ts';

const dateFormat = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' });

export const formatRow = (row: OrderRow): string[] => [
	row.id,
	row.customerName,
	dateFormat.format(new Date(row.createdAt)),
	(row.totalCents / 100).toFixed(2)
];
