import type { Knex } from 'knex';

export const up = async (knex: Knex): Promise<void> => {
	await knex.schema.alterTable('projects', (table) => {
		table.timestamp('archived_at').nullable();
		table.integer('archived_by').nullable();
		table.index(['archived_at'], 'projects_archived_at_index');
	});
};

export const down = async (knex: Knex): Promise<void> => {
	await knex.schema.alterTable('projects', (table) => {
		table.dropIndex(['archived_at'], 'projects_archived_at_index');
		table.dropColumn('archived_by');
		table.dropColumn('archived_at');
	});
};
