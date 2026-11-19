import type { NextFunction, Request, Response } from 'express';
import { logger } from '../logger.ts';

export const onError = (err: Error, req: Request, res: Response, _next: NextFunction) => {
	logger.error('request failed', { requestId: req.id, stack: err.stack });
	res.status(500).json({ error: 'Internal error', requestId: req.id });
};
