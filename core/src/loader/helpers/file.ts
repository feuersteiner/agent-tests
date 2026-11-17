import { existsSync, readFileSync } from 'node:fs';

/** Read a UTF-8 file, or throw `missing` when it does not exist. */
export const readFile = (path: string, missing: string): string => {
	if (!existsSync(path)) throw new Error(missing);
	return readFileSync(path, 'utf8');
};
