import type { Knex } from 'knex';

export const up = async (knex: Knex): Promise<void> => {
	await knex.schema.alterTable('contacts', (table) => {
		table.renameColumn('email', 'email_address');
	});
};

export const down = async (knex: Knex): Promise<void> => {
	await knex.schema.alterTable('contacts', (table) => {
		table.dropColumn('email_address');
	});
};
