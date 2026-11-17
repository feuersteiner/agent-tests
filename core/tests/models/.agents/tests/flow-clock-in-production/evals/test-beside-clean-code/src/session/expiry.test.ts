import { describe, expect, it } from 'vitest';
import { isExpired } from './expiry.ts';

describe('isExpired', () => {
	it('is true once the expiry time has passed', () => {
		expect(isExpired({ expiresAt: Date.now() - 1000, lastSeenAt: Date.now() })).toBe(true);
	});
});
