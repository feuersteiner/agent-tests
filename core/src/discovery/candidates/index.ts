import { prepareCandidates } from './prepare-candidates.js';
import { readCandidates } from './read-candidates.js';
import type { CandidateFile, RunScope } from '../types.js';

/** Select text files from a root, preserving staged contents when requested.
 * @param path Existing root directory; symlinked root spellings are canonicalized.
 * @param scope Optional file/directory/glob filters and one changed, staged, or base scope.
 * @returns Sorted text candidates with canonical absolute paths; no files are written.
 * @throws For incompatible scopes, dash-prefixed/invalid base refs, Git scopes outside
 * repositories, unreadable roots, or filesystem/Git execution failures.
 */
export const collectCandidates = async (
	path: string,
	scope: RunScope = {}
): Promise<CandidateFile[]> => {
	const selection = await prepareCandidates(path, scope);
	return readCandidates(selection);
};
