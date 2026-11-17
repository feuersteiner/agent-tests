const request = require('supertest');
const { expect } = require('chai');
const { app } = require('../../src/app');

describe('GET /users/:id', () => {
	it.only('returns the user', async () => {
		const response = await request(app).get('/users/42');
		expect(response.status).to.equal(200);
		expect(response.body.id).to.equal('42');
	});

	it('returns 404 for an unknown user', async () => {
		const response = await request(app).get('/users/missing');
		expect(response.status).to.equal(404);
	});
});
