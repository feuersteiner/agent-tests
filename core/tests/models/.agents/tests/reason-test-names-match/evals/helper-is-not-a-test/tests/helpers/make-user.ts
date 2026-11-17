import type { User } from '../../src/users/types.ts';

// Builds a user that is not an admin, for tests that check permissions.
export const makeUser = (overrides: Partial<User> = {}): User => ({
	id: 'u1',
	email: 'ada@example.com',
	isAdmin: true,
	...overrides
});
