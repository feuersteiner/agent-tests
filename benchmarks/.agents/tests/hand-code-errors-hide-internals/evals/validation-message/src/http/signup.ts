import type { Request, Response } from 'express';
import { users } from '../store.ts';

export const signup = async (req: Request, res: Response) => {
	if (!req.body.email) {
		res.status(400).json({ error: 'email is required' });
		return;
	}
	const user = await users.insert({ email: req.body.email });
	res.status(201).json({ id: user.id });
};
