import { db } from '../db.ts';

export const overdueInvoices = (customerId: string, today: Date) =>
	db.query(
		`SELECT id, amount
		   FROM invoices
		  WHERE customer_id = ?
		    AND due_on < ?
		    AND paid_on IS NULL`,
		[customerId, today]
	);
