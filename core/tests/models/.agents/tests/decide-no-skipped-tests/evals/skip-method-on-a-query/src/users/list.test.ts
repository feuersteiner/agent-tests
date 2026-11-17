import { expect, test } from 'bun:test';
import { createQuery } from './query.ts';

const users = Array.from({ length: 50 }, (_, index) => ({ id: index + 1 }));

test('pages through users', () => {
	const page = createQuery(users).skip(20).limit(10).toArray();
	expect(page.map((user) => user.id)).toEqual([21, 22, 23, 24, 25, 26, 27, 28, 29, 30]);
});
