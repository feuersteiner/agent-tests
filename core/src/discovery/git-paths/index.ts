import { readScopePaths } from './read-scope-paths.js';
import { splitPaths } from './utils.js';
import type { RunScope } from '../types.js';

/** Select relative Git paths for one scope, preserving NUL-delimited names.
 * @param root Working directory whose subtree bounds the selected paths.
 * @param scope One staged, changed, base, or default tracked/untracked selection.
 * @returns Sorted unique paths; invalid refs and Git execution failures propagate.
 */
export const gitPaths = async (root: string, scope: RunScope): Promise<string[]> => {
	const outputs = await readScopePaths(root, scope);
	return [...new Set(outputs.flatMap(splitPaths))].sort();
};
