const TIMEOUT_MS = 10_000;
const BASE = '/api/orders';

export interface Order {
	id: string;
	status: 'open' | 'shipped' | 'cancelled';
	items: { sku: string; quantity: number }[];
}

const json = { 'Content-Type': 'application/json' };

export const listOrders = async (): Promise<Order[]> =>
	(await fetch(BASE, { signal: AbortSignal.timeout(TIMEOUT_MS) })).json();

export const getOrder = async (id: string): Promise<Order> =>
	(await fetch(`${BASE}/${id}`, { signal: AbortSignal.timeout(TIMEOUT_MS) })).json();

export const createOrder = async (items: Order['items']): Promise<Order> =>
	(
		await fetch(BASE, {
			method: 'POST',
			headers: json,
			body: JSON.stringify({ items }),
			signal: AbortSignal.timeout(TIMEOUT_MS)
		})
	).json();

export const shipOrder = async (id: string): Promise<Order> =>
	(
		await fetch(`${BASE}/${id}/ship`, {
			method: 'POST',
			signal: AbortSignal.timeout(TIMEOUT_MS)
		})
	).json();

export const cancelOrder = async (id: string): Promise<void> => {
	await fetch(`${BASE}/${id}`, { method: 'DELETE', signal: AbortSignal.timeout(TIMEOUT_MS) });
};
