import { api } from './github.js';
import type { GhRunner } from './types.js';

interface GitTree {
	truncated?: boolean;
	tree: { path: string; mode: string; type: string }[];
}

/** Refuse executable files, symlinks or incomplete Git metadata before reading an existing CSV. */
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
