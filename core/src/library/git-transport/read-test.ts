import { assertId } from '../utils.js';
import { readCatalogFile } from './utils.js';
import type { LibraryFiles } from '../types.js';

/** Read the two allowed rule files at commit; reject unknown ids and nonregular file objects. */
export const readTest = async (
	directory: string,
	commit: string,
	ids: string[],
	id: string
): Promise<LibraryFiles> => {
	assertId(id);
	if (!ids.includes(id)) throw new Error(`Library test '${id}' does not exist.`);
	return {
		prose: await readCatalogFile(directory, commit, `library/${id}/TEST.md`),
		yaml: await readCatalogFile(directory, commit, `library/${id}/test.yaml`)
	};
};
