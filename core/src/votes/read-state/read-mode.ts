import { api } from '../utils.js';
import type { GhRunner } from '../types.js';
import type { GitTree } from './types.js';

/**
 * Require a unique regular nonexecutable score blob before decoding existing CSV.
 * @param repository Validated owner/repository.
 * @param id Library test ID.
 * @param commit Immutable main commit.
 * @param gh Read-only GitHub transport.
 * @throws Rejects incomplete trees, missing/duplicate entries, unsafe modes or read failures.
 */
export const requireRegularScore = async (
	repository: string,
	id: string,
	commit: string,
	gh: GhRunner
): Promise<void> => {
	const tree = await api<GitTree>(gh, `repos/${repository}/git/trees/${commit}?recursive=1`);
	if (tree.truncated || !Array.isArray(tree.tree))
		throw new Error('Cannot verify score.csv mode from incomplete Git metadata.');
	const entries = tree.tree.filter((entry) => entry.path === `library/${id}/score.csv`);
	if (entries.length !== 1 || entries[0]!.mode !== '100644' || entries[0]!.type !== 'blob')
		throw new Error('score.csv must be a regular nonexecutable Git file.');
};
