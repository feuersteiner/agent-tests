import type { Knex } from 'knex';

export const seed = async (knex: Knex): Promise<void> => {
	await knex('users').del();
	await knex('users').insert([
		{ email: 'ada@example.com', locale: 'en' },
		{ email: 'grace@example.com', locale: 'en' }
	]);
};
