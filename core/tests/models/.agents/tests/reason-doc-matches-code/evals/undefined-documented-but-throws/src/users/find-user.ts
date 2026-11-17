import type { User } from './types.ts';

const users = new Map<string, User>();

/**
 * Finds a user by id.
 * @returns the user, or `undefined` when no user has that id.
 */
export const findUser = (id: string): User | undefined => {
	const user = users.get(id);
	if (!user) throw new Error(`User ${id} not found`);
	return user;
};
