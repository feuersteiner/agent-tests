import { withCatalog } from './catalog.js';
import { assertId } from './utils.js';
import type { LibraryOptions, RemoteTest } from './types.js';

export { addTest } from './add.js';
export { updateTests } from './update/index.js';
export { removeTest } from './remove.js';
export { gitLibraryTransport } from './git-transport/index.js';
export type {
	LibraryCatalog,
	LibraryFiles,
	LibraryOptions,
	LibraryResult,
	LibrarySource,
	LibraryTransport,
	RemoteTest
} from './types.js';

/**
 * List ids from the catalog configured under root, using optional transport/model overrides.
 * @returns Sorted unique identities and their exact shared commit; no local files are installed.
 * @throws Configuration, unsafe id, catalog, or cleanup failures.
 */
export const listRemoteTests = async (
	root: string,
	options: LibraryOptions = {}
): Promise<RemoteTest[]> =>
	withCatalog(root, options, async ({ catalog }) =>
		[...new Set(catalog.ids)].sort().map((id) => {
			assertId(id);
			return { id, commit: catalog.commit };
		})
	);
