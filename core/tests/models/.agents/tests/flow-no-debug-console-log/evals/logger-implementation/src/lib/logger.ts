type Level = 'debug' | 'info' | 'warn' | 'error';

const ORDER: Record<Level, number> = { debug: 0, info: 1, warn: 2, error: 3 };

export const createLogger = (name: string, minLevel: Level = 'info') => {
	const write = (level: Level, message: string): void => {
		if (ORDER[level] < ORDER[minLevel]) return;
		const line = `${new Date().toISOString()} ${level.toUpperCase()} [${name}] ${message}`;
		if (level === 'error') console.error(line);
		else console.log(line);
	};
	return {
		debug: (message: string) => write('debug', message),
		info: (message: string) => write('info', message),
		warn: (message: string) => write('warn', message),
		error: (message: string) => write('error', message)
	};
};
