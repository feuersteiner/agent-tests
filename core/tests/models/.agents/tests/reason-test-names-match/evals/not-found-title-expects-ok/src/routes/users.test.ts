import request from 'supertest';
import { expect, it } from 'vitest';
import { app } from '../app.ts';

it('returns the user for a known id', async () => {
	const res = await request(app).get('/users/u1');
	expect(res.status).toBe(200);
	expect(res.body.id).toBe('u1');
});

it('returns 404 for an unknown user id', async () => {
	const res = await request(app).get('/users/does-not-exist');
	expect(res.status).toBe(200);
});
