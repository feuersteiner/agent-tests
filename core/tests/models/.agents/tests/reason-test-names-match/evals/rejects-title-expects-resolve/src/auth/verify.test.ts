import { describe, expect, it } from 'vitest';
import { signToken, verifyToken } from './tokens.ts';

describe('verifyToken', () => {
	it('accepts a fresh token', async () => {
		const token = signToken({ userId: 'u1' }, { expiresInSeconds: 60 });
		await expect(verifyToken(token)).resolves.toEqual({ userId: 'u1' });
	});

	it('rejects an expired token', async () => {
		const token = signToken({ userId: 'u1' }, { expiresInSeconds: -60 });
		await expect(verifyToken(token)).resolves.toEqual({ userId: 'u1' });
	});
});
