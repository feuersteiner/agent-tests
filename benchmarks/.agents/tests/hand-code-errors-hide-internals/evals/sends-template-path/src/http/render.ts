import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Request, Response } from 'express';

export const render = async (req: Request, res: Response) => {
	const file = join(import.meta.dirname, 'templates', `${req.params.name}.html`);
	try {
		res.send(await readFile(file, 'utf8'));
	} catch {
		res.status(404).json({ error: `Cannot read ${file}` });
	}
};
