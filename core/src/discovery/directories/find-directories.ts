import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { isDirectory } from '../is-directory.js';

/** Find real local rule folders, including uncompiled/invalid definitions for validation.
 * @param directories Eligible canonical owner directories in traversal order.
 * @returns Rule directories in stable order; filesystem failures propagate.
 */
export const findDirectories = async (directories: string[]): Promise<string[]> => {
	const found: string[] = [];
	for (const directory of directories) {
		const agents = join(directory, '.agents');
		const tests = join(agents, 'tests');
		if (!(await isDirectory(agents)) || !(await isDirectory(tests))) continue;
		for (const entry of (await readdir(tests, { withFileTypes: true })).sort((a, b) =>
			a.name.localeCompare(b.name)
		))
			if (entry.isDirectory()) found.push(join(tests, entry.name));
	}
	return found;
};
