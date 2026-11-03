import { collectSources } from './collect-sources.js';
import { prepareSearch } from './prepare-search.js';
import { selectSource } from './select-source.js';
import type { CompilationSource } from './types.js';

/**
 * Locate source without requiring an existing or valid compiled test.yaml.
 * @param root Repository or owning package directory.
 * @param id Installed kebab-case test id.
 * @returns The sole regular TEST.md and its exact content hash.
 * @throws For unsafe ids, missing/ambiguous sources, symbolic source files or read failures.
 */
export const findSource = async (root: string, id: string): Promise<CompilationSource> => {
	const base = await prepareSearch(root, id);
	const matches = await collectSources(base, id);
	return selectSource(matches, id);
};
