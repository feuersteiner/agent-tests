import { gateway } from './gateway.ts';

interface Payment {
	orderId: string;
	cardNumber: string;
	amount: number;
}

export const charge = async (payment: Payment) => {
	console.log('charging', { order: payment.orderId, card: payment.cardNumber });
	return gateway.charge(payment);
};
