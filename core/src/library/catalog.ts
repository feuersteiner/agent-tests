import { createConfiguredModel, loadConfiguration } from '../configuration/index.js';
import { gitLibraryTransport } from './git-transport.js';
import type { LibraryCatalog, LibraryOptions } from './types.js';
import type { DecisionModel } from '../models/index.js';

export interface CatalogContext {
	catalog: LibraryCatalog;
	repository: string;
	ref: string;
	model?: DecisionModel;
}

/** Open one pinned catalog and always release its temporary files, including on errors. */
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
