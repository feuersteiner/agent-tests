import { git } from '../git.js';
import type { RunScope } from '../types.js';

/** Read independent Git selections without collapsing index and working-tree changes.
 * @param root Directory bounding relative Git paths.
 * @param scope Requested scope; invalid refs and Git failures propagate.
 * @returns NUL-delimited output for each selected snapshot.
 */
export const readScopePaths = async (root: string, scope: RunScope): Promise<string[]> => {
	const diff = ['diff', '--name-only', '-z', '--relative', '--diff-filter=ACMRTUXB'];
	if (scope.staged) return [await git(root, [...diff, '--cached', '--', '.'])];
	if (scope.base) return [await git(root, [...diff, `${scope.base}...HEAD`, '--', '.'])];
	if (scope.changed)
		return Promise.all([
			git(root, [...diff, '--cached', '--', '.']),
			git(root, [...diff, '--', '.']),
			git(root, ['ls-files', '--others', '--exclude-standard', '-z', '--', '.'])
		]);
	return [
		await git(root, ['ls-files', '--cached', '--others', '--exclude-standard', '-z', '--', '.'])
	];
};
