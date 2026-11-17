# Migrations are reversible

Every database migration has a `down` that undoes everything its `up` does, so rolling it back returns the schema to exactly where it was before.

Applies to the Knex migration files in `migrations/` folders.

Exceptions: none; seed files and other scripts outside `migrations/` are not migrations.
