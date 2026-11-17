import type { LogRecord, Transport } from './types.ts';

/** Writes each log record to stdout as one JSON line, for the log collector to pick up. */
export const consoleTransport: Transport = {
	write: (record: LogRecord): void => {
		console.log(
			JSON.stringify({
				time: record.time.toISOString(),
				level: record.level,
				msg: record.message,
				...record.fields
			})
		);
	}
};
