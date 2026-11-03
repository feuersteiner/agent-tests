import { lstat } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * @param owner Real discovered repository directory.
 * @param id Validated installed test id.
 * @returns Whether every .agents/tests/id component is a real directory, never a symlink.
 * @throws For filesystem failures other than a missing component.
 */
export const isSourceDirectory = async (owner: string, id: string): Promise<boolean> => {
	let directory = owner;
	try {
		for (const segment of ['.agents', 'tests', id]) {
			directory = join(directory, segment);
			if (!(await lstat(directory)).isDirectory()) return false;
		}
		return true;
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
		throw error;
	}
};
