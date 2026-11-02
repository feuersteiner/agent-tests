import { realpath } from 'node:fs/promises';
import { findGitRoot } from '../find-git-root.js';
import { gitPaths } from '../git-paths/index.js';
import { walkFiles } from '../walk-files.js';
import { normalizeFilters, validateScope } from './utils.js';
import type { RunScope } from '../types.js';
import type { CandidateSelection } from './types.js';

/** Validate scope, canonicalize filters, and enumerate paths before any content reads.
 * @param path Scan root; missing roots and filesystem failures propagate.
 * @param scope Requested selection; contradictory or unavailable Git scopes throw.
 * @returns Canonical context, normalized filters, and deduplicated sorted paths.
 */
export const prepareCandidates = async (
	path: string,
	scope: RunScope
): Promise<CandidateSelection> => {
	validateScope(scope);
	const root = await realpath(path);
	const gitRoot = await findGitRoot(root);
	if (!gitRoot && (scope.changed || scope.staged || scope.base))
		throw new Error('Git change scopes require a Git repository');
	const filters = await normalizeFilters(root, scope.paths);
	const paths = gitRoot ? await gitPaths(root, scope) : await walkFiles(root);
	return { root, gitRoot, scope, filters, paths: [...new Set(paths)].sort() };
};
