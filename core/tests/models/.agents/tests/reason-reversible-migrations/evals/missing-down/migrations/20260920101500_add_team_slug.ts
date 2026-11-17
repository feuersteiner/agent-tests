import type { Knex } from 'knex';

export const up = async (knex: Knex): Promise<void> => {
	await knex.schema.alterTable('teams', (table) => {
		table.string('slug', 64).nullable().unique();
	});
};
