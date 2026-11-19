import { logger } from '../logger.ts';
import { mailer } from '../mailer.ts';

interface Customer {
	id: string;
	name: string;
	email: string;
}

export const sendReceipt = async (customer: Customer, invoiceId: string) => {
	await mailer.send(customer.email, `Hello ${customer.name}, your receipt is attached.`);
	logger.info('receipt sent', { customerId: customer.id, invoiceId });
};
