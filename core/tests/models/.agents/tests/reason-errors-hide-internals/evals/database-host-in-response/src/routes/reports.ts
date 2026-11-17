import { Router } from 'express';
import { config } from '../config.ts';
import { db, runReport } from '../lib/db.ts';

export const reports = Router();

reports.get('/reports/:id', async (req, res) => {
	if (!(await db.isConnected())) {
		return res.status(503).json({
			error: `Cannot reach postgres at ${config.db.host}:${config.db.port} as user ${config.db.user}`
		});
	}
	res.json(await runReport(req.params.id));
});
