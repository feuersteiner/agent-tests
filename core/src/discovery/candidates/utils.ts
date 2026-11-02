import { realpath } from 'node:fs/promises';
import { basename, dirname, isAbsolute, relative, resolve } from 'node:path';
import { minimatch } from 'minimatch';
import { posixPath } from '../posix-path.js';
import type { RunScope } from '../types.js';

/** Reject conflicting scopes and refs that Git could interpret as options. */
export const validateScope = (scope: RunScope): void => {
	if ([scope.changed, scope.staged, Boolean(scope.base)].filter(Boolean).length > 1)
		throw new Error('Choose only one of changed, staged, or base');
	if (scope.base?.startsWith('-')) throw new Error('A base ref cannot begin with a dash');
};

/** Resolve an absolute filter's existing ancestor while retaining missing/glob suffixes.
 * @param path Absolute file, directory, or glob filter.
 * @returns Canonical spelling; unexpected filesystem errors propagate.
 */
const canonicalFilter = async (path: string): Promise<string> => {
	try {
		return await realpath(path);
	} catch (error) {
		if (!['ENOENT', 'ENOTDIR'].includes((error as NodeJS.ErrnoException).code ?? '')) throw error;
		const parent = dirname(path);
		if (parent === path) throw error;
		return resolve(await canonicalFilter(parent), basename(path));
	}
};

/** Normalize relative filters or canonical absolute filters against the scan root.
 * @param root Canonical scan root.
 * @param filters Optional file, directory, or glob filters.
 * @returns POSIX relative filters, preserving glob syntax and outside-root rejection.
 */
export const normalizeFilters = async (root: string, filters: string[] = []): Promise<string[]> =>
	Promise.all(
		filters.map(async (filter) =>
			posixPath(isAbsolute(filter) ? relative(root, await canonicalFilter(filter)) : filter)
				.replace(/^\.\//, '')
				.replace(/\/$/, '')
		)
	);

/** Match a relative candidate against normalized filters without admitting parent traversal. */
export const matchesPaths = (path: string, filters: string[]): boolean =>
	!filters.length ||
	filters.some((filter) => {
		if (filter === '.' || filter === '') return true;
		if (filter === '..' || filter.startsWith('../')) return false;
		return (
			path === filter || path.startsWith(`${filter}/`) || minimatch(path, filter, { dot: true })
		);
	});
