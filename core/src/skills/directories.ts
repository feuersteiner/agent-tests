import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

const ignored = new Set([
	'.git',
	'.svelte-kit',
	'.output',
	'.cache',
	'node_modules',
	'dist',
	'dist-cli',
	'build',
	'coverage'
]);

/** Enumerate real child directories; links and generated dependency trees are excluded. */
export const childDirectories = async (directory: string): Promise<string[]> => {
	const entries = await readdir(directory, { withFileTypes: true });
	return entries
		.filter((entry) => entry.isDirectory() && !ignored.has(entry.name))
		.map((entry) => join(directory, entry.name))
		.sort();
};
