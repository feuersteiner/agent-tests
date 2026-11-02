import { lstat } from 'node:fs/promises';

/** Check for a real directory, returning false only for missing paths or non-directories.
 * @param path Directory to inspect without following symlinks; other I/O failures propagate.
 */
export const isDirectory = async (path: string): Promise<boolean> => {
	try {
		const stat = await lstat(path);
		return stat.isDirectory() && !stat.isSymbolicLink();
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
		throw error;
	}
};
