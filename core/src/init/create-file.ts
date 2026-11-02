import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { assertLocalPath } from './utils.js';
import type { InitResult } from './types.js';

/** Create one file exclusively; existing user files are never replaced. */
export const createFile = async (
	result: InitResult,
	name: string,
	content: string,
	mode?: number
): Promise<void> => {
	const path = resolve(result.root, name);
	await assertLocalPath(result.root, path);
	await mkdir(dirname(path), { recursive: true });
	try {
		await writeFile(path, content, { flag: 'wx', ...(mode === undefined ? {} : { mode }) });
		result.created.push(name);
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
		result.skipped.push(name);
	}
};
