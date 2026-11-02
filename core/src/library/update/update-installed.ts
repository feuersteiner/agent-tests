import { updateOne } from './update-one.js';
import type { CatalogContext, LibraryResult } from '../types.js';

/** Refresh discovered directories serially against one pinned catalog; propagate operation errors. */
export const updateInstalled = async (
	root: string,
	directories: string[],
	context: CatalogContext
): Promise<LibraryResult[]> => {
	const results: LibraryResult[] = [];
	for (const directory of directories) results.push(await updateOne(root, directory, context));
	return results;
};
