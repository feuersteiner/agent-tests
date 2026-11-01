import { withCatalog } from './catalog.js';
import { assertId } from './paths.js';
import type { LibraryOptions, RemoteTest } from './types.js';

export { addTest } from './add.js';
export { updateTests } from './update.js';
export { removeTest } from './remove.js';
export { gitLibraryTransport } from './git-transport.js';
export type {
	LibraryCatalog,
	LibraryFiles,
	LibraryOptions,
	LibraryResult,
	LibrarySource,
	LibraryTransport,
	RemoteTest
} from './types.js';

/** List catalog ids pinned to one commit without installing files. */
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
