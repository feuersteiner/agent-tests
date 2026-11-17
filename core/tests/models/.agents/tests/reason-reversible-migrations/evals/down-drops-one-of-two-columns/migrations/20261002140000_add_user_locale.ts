import type { Knex } from 'knex';

export const up = async (knex: Knex): Promise<void> => {
	await knex.schema.alterTable('users', (table) => {
		table.string('locale', 10).notNullable().defaultTo('en');
		table.string('time_zone', 64).notNullable().defaultTo('UTC');
	});
};

export const down = async (knex: Knex): Promise<void> => {
	await knex.schema.alterTable('users', (table) => {
		table.dropColumn('locale');
	});
};
