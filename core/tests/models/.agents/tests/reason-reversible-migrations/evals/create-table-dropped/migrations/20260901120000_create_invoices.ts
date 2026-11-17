import type { Knex } from 'knex';

export const up = async (knex: Knex): Promise<void> => {
	await knex.schema.createTable('invoices', (table) => {
		table.increments('id');
		table.integer('customer_id').notNullable().references('customers.id');
		table.integer('amount_cents').notNullable();
		table.timestamps(true, true);
	});
};

export const down = async (knex: Knex): Promise<void> => {
	await knex.schema.dropTable('invoices');
};
