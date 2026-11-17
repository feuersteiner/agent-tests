import { isExpired } from './expiry';

describe('isExpired', () => {
	it('is true once the expiry time has passed', () => {
		const session = { expiresAt: Date.now() - 1000, lastSeenAt: Date.now() };
		expect(isExpired(session)).toBe(true);
	});

	it('is false for a session seen just now', () => {
		const session = { expiresAt: Date.now() + 60_000, lastSeenAt: Date.now() };
		expect(isExpired(session)).toBe(false);
	});
});
