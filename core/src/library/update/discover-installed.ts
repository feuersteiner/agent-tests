import { basename } from 'node:path';
import { discoverTestDirectories } from '../../discovery/index.js';
import { assertId } from '../utils.js';

/** Find canonical installed directories under root; reject an absent explicit id. */
export const discoverInstalled = async (root: string, id?: string): Promise<string[]> => {
	if (id !== undefined) assertId(id);
	const directories = (await discoverTestDirectories(root)).filter(
		(path) => id === undefined || basename(path) === id
	);
	if (id !== undefined && directories.length === 0)
		throw new Error(`Test '${id}' is not installed.`);
	return directories;
};
