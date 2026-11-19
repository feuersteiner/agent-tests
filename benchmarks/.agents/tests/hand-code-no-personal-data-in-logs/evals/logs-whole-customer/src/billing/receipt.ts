import { logger } from '../logger.ts';
import { mailer } from '../mailer.ts';

interface Customer {
	id: string;
	name: string;
	email: string;
}

export const sendReceipt = async (customer: Customer, invoiceId: string) => {
	logger.debug('sending receipt', { customer, invoiceId });
	await mailer.send(customer.email, 'Your receipt is attached.');
};
