import { readFile } from 'node:fs/promises';

/** Read UTF-8 configuration; ignore missing files and wrap all other filesystem failures. */
export const readOptional = async (path: string): Promise<string | undefined> => {
	try {
		return await readFile(path, 'utf8');
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
		throw new Error('Cannot read local agent-tests configuration', { cause: error });
	}
};
