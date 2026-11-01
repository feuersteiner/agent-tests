import { lstat, readdir, realpath } from 'node:fs/promises';
import { join } from 'node:path';
import { walkDirectories } from './walk.js';

const isDirectory = async (path: string): Promise<boolean> => {
	try {
		return (await lstat(path)).isDirectory();
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
		throw error;
	}
};

/** Find local test folders before parsing, so validation can report broken definitions. */
export const discoverTestDirectories = async (path: string): Promise<string[]> => {
	const root = await realpath(path);
	const found: string[] = [];
	for (const directory of await walkDirectories(root)) {
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
