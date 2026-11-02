import { rm } from 'node:fs/promises';
import { exists, readManagedSnapshot, testDirectory } from './utils.js';
import type { LibraryResult } from './types.js';

/**
 * Remove id from targetDir relative to root only when its managed payload remains unmodified.
 * @returns Removed/0 or preserved skipped/1 for edited, extra, or unmanaged files.
 * @throws Invalid ids, escaping/symlink targets, absent copies, or filesystem failures.
 */
export const removeTest = async (
	root: string,
	id: string,
	targetDir = '.'
): Promise<LibraryResult> => {
	const directory = await testDirectory(root, id, targetDir);
	if (!(await exists(directory))) throw new Error(`Test '${id}' is not installed at this target.`);
	if (!(await readManagedSnapshot(directory)))
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
