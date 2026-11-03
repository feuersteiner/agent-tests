import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createFile } from './create-file.js';
import { assertLocalPath } from './utils.js';
import { vitestConfiguration } from './templates.js';
import { editVitestConfiguration } from './vitest-edit/index.js';
import type { InitResult } from './types.js';

/** Create or additively update the conventional config; preserve unsupported or changing files. */
export const installVitest = async (result: InitResult): Promise<void> => {
	const name = 'vitest.config.ts';
	const path = resolve(result.root, name);
	await assertLocalPath(result.root, path);
	let source: string;
	try {
		source = await readFile(path, 'utf8');
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
		await createFile(result, name, vitestConfiguration);
		return;
	}
	const edit = editVitestConfiguration(source);
	if (edit.reason) {
		result.skipped.push(name);
		result.warnings.push(edit.reason);
		result.exitCode = 2;
		return;
	}
	if (edit.content === undefined) {
		result.skipped.push(name);
		return;
	}
	if ((await readFile(path, 'utf8')) !== source)
		throw new Error('Vitest configuration changed during initialization; retry after saving it');
	await writeFile(path, edit.content);
	result.created.push(`${name} (agent-tests plugin)`);
};
