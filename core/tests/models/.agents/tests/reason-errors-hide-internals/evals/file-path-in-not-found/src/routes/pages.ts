import { existsSync } from 'node:fs';
import { Router } from 'express';
import { render } from '../lib/templates.ts';

export const pages = Router();

const TEMPLATE_DIR = '/srv/app/current/templates';

pages.get('/pages/:name', (req, res) => {
	const file = `${TEMPLATE_DIR}/${req.params.name}.hbs`;
	if (!existsSync(file)) return res.status(404).send(`Template not found: ${file}`);
	res.send(render(file));
});
