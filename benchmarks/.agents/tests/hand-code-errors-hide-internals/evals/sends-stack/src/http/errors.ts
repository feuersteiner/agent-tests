import type { NextFunction, Request, Response } from 'express';

export const onError = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
	res.status(500).json({ error: 'Internal error', stack: err.stack });
};
