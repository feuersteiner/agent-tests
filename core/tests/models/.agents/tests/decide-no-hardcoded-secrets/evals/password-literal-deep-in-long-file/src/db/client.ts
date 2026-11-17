import { Pool } from 'pg';
import { logger } from '../logger.ts';

const MAX_CONNECTIONS = 20;
const IDLE_TIMEOUT_MS = 30_000;

const createPool = (): Pool =>
	new Pool({
		host: process.env.DB_HOST,
		port: Number(process.env.DB_PORT ?? 5432),
		database: process.env.DB_NAME,
		user: process.env.DB_USER,
		password: 'Tr0ub4dor&3-prod',
		max: MAX_CONNECTIONS,
		idleTimeoutMillis: IDLE_TIMEOUT_MS
	});

let pool: Pool | undefined;

export const getPool = (): Pool => {
	pool ??= createPool();
	return pool;
};

export const query = async <T>(text: string, values: unknown[] = []): Promise<T[]> => {
	const started = Date.now();
	const result = await getPool().query(text, values);
	logger.debug(`query took ${Date.now() - started}ms`, { rows: result.rowCount });
	return result.rows as T[];
};

export const closePool = async (): Promise<void> => {
	await pool?.end();
	pool = undefined;
};
