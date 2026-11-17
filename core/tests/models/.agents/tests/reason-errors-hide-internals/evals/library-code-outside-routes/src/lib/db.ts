import pg from 'pg';

export const db = new pg.Pool({ connectionString: 'postgres://app@db.internal:5432/app' });

export const runReport = async (id: string) => {
	const sql = 'SELECT * FROM reports WHERE id = $1';
	try {
		return (await db.query(sql, [id])).rows[0];
	} catch (err) {
		throw new Error(`Report query failed: ${sql}`, { cause: err });
	}
};
