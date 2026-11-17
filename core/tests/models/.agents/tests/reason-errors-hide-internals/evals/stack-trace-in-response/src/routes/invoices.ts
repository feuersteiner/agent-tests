import { Router } from 'express';
import { renderInvoice } from '../lib/invoices.ts';

export const invoices = Router();

invoices.get('/invoices/:id.pdf', async (req, res) => {
	try {
		res.type('pdf').send(await renderInvoice(req.params.id));
	} catch (err) {
		const error = err as Error;
		res.status(500).json({ error: 'Could not render the invoice', stack: error.stack });
	}
});
