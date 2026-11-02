import { readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { posixPath } from './posix-path.js';
import { walkDirectories } from './walk-directories/index.js';

/** List relative real-file paths under a canonical root; directory read failures propagate. */
export const walkFiles = async (root: string): Promise<string[]> => {
	const files: string[] = [];
	for (const directory of await walkDirectories(root))
		for (const entry of await readdir(directory, { withFileTypes: true }))
			if (entry.isFile()) files.push(posixPath(relative(root, join(directory, entry.name))));
	return files.sort();
};
