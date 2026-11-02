import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { isExcludedDirectory } from '../is-excluded-directory.js';

/** Append a directory and recursively visit eligible real child directories.
 * @param directory Directory to read; failures propagate.
 * @param directories Accumulator in deterministic depth-first order.
 */
export const visitDirectory = async (directory: string, directories: string[]): Promise<void> => {
	directories.push(directory);
	for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) =>
		a.name.localeCompare(b.name)
	)) {
		if (!entry.isDirectory() || isExcludedDirectory(entry.name)) continue;
		await visitDirectory(join(directory, entry.name), directories);
	}
};
