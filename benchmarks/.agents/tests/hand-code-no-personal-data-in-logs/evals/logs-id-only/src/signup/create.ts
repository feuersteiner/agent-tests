import { logger } from '../logger.ts';
import { users } from '../store.ts';

export const createUser = async (email: string, name: string) => {
	const user = await users.insert({ email, name });
	logger.info('user created', { userId: user.id });
	return user;
};
