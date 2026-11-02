import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { initializeCatalog } from './initialize-catalog.js';
import { closeCatalog, remoteSource } from './utils.js';
import type { LibraryCatalog, LibraryTransport } from '../types.js';

/**
 * Resolve repository/ref, fetch an isolated pinned snapshot, and release temporary files on failure.
 * @returns Catalog whose close callback owns cleanup after success.
 * @throws For unsafe identity/ref, inaccessible Git data, or filesystem errors.
 */
const openCatalog = async (repository: string, ref: string): Promise<LibraryCatalog> => {
	const remote = await remoteSource(repository, ref);
	const directory = await mkdtemp(join(tmpdir(), 'agent-tests-catalog-'));
	try {
		return await initializeCatalog(directory, remote, ref);
	} catch (error) {
		await closeCatalog(directory);
		throw error;
	}
};

/** Open pinned catalogs; successful callers must release them with catalog.close(). */
export const gitLibraryTransport: LibraryTransport = { open: openCatalog };
