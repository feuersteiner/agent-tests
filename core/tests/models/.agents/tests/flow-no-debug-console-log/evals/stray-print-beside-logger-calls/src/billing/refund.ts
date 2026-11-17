import { createLogger } from '../lib/logger.ts';
import { payments } from './payments.ts';

const log = createLogger('billing');

export const refund = async (paymentId: string, amountCents: number): Promise<void> => {
	log.info(`Refunding ${amountCents} cents on payment ${paymentId}`);
	const result = await payments.refund(paymentId, amountCents);
	console.log('refund result', result);
	if (result.status !== 'succeeded') {
		log.error(`Refund on payment ${paymentId} failed: ${result.status}`);
		throw new Error('Refund failed');
	}
	log.info(`Refunded payment ${paymentId}`);
};
