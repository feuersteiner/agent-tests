import { createQuery } from './query.ts';
import type { User } from './types.ts';

export const page = (users: User[], index: number, size = 10): User[] =>
	createQuery(users).skip(index * size).limit(size).toArray();
