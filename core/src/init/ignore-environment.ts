import { appendFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createFile } from './create-file.js';
import { assertLocalPath, environmentIgnored } from './utils.js';
import type { InitResult } from './types.js';

/** Add the exact .env ignore without replacing any existing ignore rules. */
export const ignoreEnvironment = async (result: InitResult): Promise<void> => {
	const path = resolve(result.root, '.gitignore');
	await assertLocalPath(result.root, path);
	let content: string;
	try {
		content = await readFile(path, 'utf8');
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
		await createFile(result, '.gitignore', '.env\n');
		return;
	}
	if (await environmentIgnored(result.root, content)) return;
	await appendFile(path, `${content.length > 0 && !content.endsWith('\n') ? '\n' : ''}.env\n`);
	result.created.push('.gitignore (.env rule)');
};
