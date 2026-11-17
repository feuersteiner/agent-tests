import type { Knex } from 'knex';

export const up = async (knex: Knex): Promise<void> => {
	await knex.schema.alterTable('customers', (table) => {
		table.string('first_name').nullable();
		table.string('last_name').nullable();
	});
};

export const down = async (): Promise<void> => {
	throw new Error('This migration cannot be rolled back.');
};
