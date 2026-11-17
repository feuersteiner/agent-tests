export interface Invoice {
	id: string;
	customerId: string;
	totalCents: number;
	paidAt: string | null;
}

/** Thrown when the billing service answers with an error status. */
export class BillingError extends Error {
	constructor(public readonly status: number) {
		super(`Billing service answered ${status}`);
	}
}

/**
 * Lists a customer's invoices, newest first.
 * @throws {BillingError} when the billing service answers with an error status.
 */
export const listInvoices = async (customerId: string): Promise<Invoice[]> => {
	const response = await fetch(`/api/customers/${encodeURIComponent(customerId)}/invoices`, {
		headers: { Accept: 'application/json' }
	});
	if (!response.ok) throw new BillingError(response.status);
	return (await response.json()) as Invoice[];
};
