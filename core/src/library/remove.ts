import { rm } from 'node:fs/promises';
import { exists, testDirectory } from './paths.js';
import { readManagedSource } from './source.js';
import type { LibraryResult } from './types.js';

/** Remove only a selected, unmodified managed copy; preserve unknown files and local edits. */
export const removeTest = async (
	root: string,
	id: string,
	targetDir = '.'
): Promise<LibraryResult> => {
	const directory = await testDirectory(root, id, targetDir);
	if (!(await exists(directory))) throw new Error(`Test '${id}' is not installed at this target.`);
	if (!(await readManagedSource(directory)))
		return {
			id,
			directory,
			status: 'skipped',
			warnings: ['Local files are modified or not managed; kept unchanged.'],
			exitCode: 1
		};
	await rm(directory, { recursive: true });
	return { id, directory, status: 'removed', warnings: [], exitCode: 0 };
};
