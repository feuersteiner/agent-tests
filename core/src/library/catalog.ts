import { createConfiguredModel, loadConfiguration } from '../configuration/index.js';
import { gitLibraryTransport } from './git-transport/index.js';
import type { CatalogContext, LibraryOptions } from './types.js';

/**
 * Load root configuration, open a pinned catalog, and call action with optional model overrides.
 * @returns The action result after closing the catalog; cleanup also runs when action rejects.
 * @throws Configuration, invalid commit, transport, action, or cleanup failures.
 */
export const withCatalog = async <T>(
	root: string,
	options: LibraryOptions,
	action: (context: CatalogContext) => Promise<T>
): Promise<T> => {
	const loaded = await loadConfiguration(root);
	const repository = loaded.config.library?.repository ?? 'feuersteiner/agent-tests';
	const ref = loaded.config.library?.ref ?? 'main';
	const catalog = await (options.transport ?? gitLibraryTransport).open(repository, ref);
	try {
		if (!/^([a-f0-9]{40}|[a-f0-9]{64})$/.test(catalog.commit))
			throw new Error('The catalog must identify an exact Git commit.');
		return await action({
			catalog,
			repository,
			ref,
			model: options.model ?? createConfiguredModel(loaded)
		});
	} finally {
		await catalog.close();
	}
};
