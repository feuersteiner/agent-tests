import { readFile, realpath } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { minimatch } from 'minimatch';
import { findGitRoot, git, gitPaths } from './git-paths.js';
import { isCandidatePath, isRegularContainedFile, posixPath, walkFiles } from './walk.js';
import type { CandidateFile, RunScope } from './types.js';

const matchesPaths = (root: string, path: string, filters?: string[]): boolean =>
	!filters?.length ||
	filters.some((filter) => {
		const normalized = posixPath(isAbsolute(filter) ? relative(root, filter) : filter)
			.replace(/^\.\//, '')
			.replace(/\/$/, '');
		if (normalized === '.' || normalized === '') return true;
		if (normalized === '..' || normalized.startsWith('../')) return false;
		return (
			path === normalized ||
			path.startsWith(`${normalized}/`) ||
			minimatch(path, normalized, { dot: true })
		);
	});

/** Select text files from a repository, preserving staged contents when requested. */
export const collectCandidates = async (
	path: string,
	scope: RunScope = {}
): Promise<CandidateFile[]> => {
	if ([scope.changed, scope.staged, Boolean(scope.base)].filter(Boolean).length > 1)
		throw new Error('Choose only one of changed, staged, or base');

	if (scope.base?.startsWith('-')) throw new Error('A base ref cannot begin with a dash');
	const root = await realpath(path);
	const gitRoot = await findGitRoot(root);
	if (!gitRoot && (scope.changed || scope.staged || scope.base))
		throw new Error('Git change scopes require a Git repository');

	const paths = gitRoot ? await gitPaths(root, scope) : await walkFiles(root);
	const candidates: CandidateFile[] = [];
	for (const file of [...new Set(paths)].sort()) {
		if (!isCandidatePath(file) || !matchesPaths(root, file, scope.paths)) continue;
		const absolutePath = resolve(root, file);
		const normalized = posixPath(relative(root, absolutePath));
		if (normalized.startsWith('../') || isAbsolute(normalized)) continue;
		let buffer: Buffer;
		if (scope.staged && gitRoot) {
			const repositoryPath = posixPath(relative(gitRoot, absolutePath));
			const mode = await git(gitRoot, ['ls-files', '--stage', '-z', '--', repositoryPath]);
			if (!mode.startsWith('100644 ') && !mode.startsWith('100755 ')) continue;
			buffer = Buffer.from(await git(gitRoot, ['show', `:${repositoryPath}`]));
		} else {
			if (!(await isRegularContainedFile(root, file))) continue;
			buffer = await readFile(join(root, file));
		}
		if (buffer.includes(0)) continue;
		candidates.push({ path: normalized, absolutePath, content: buffer.toString('utf8') });
	}
	return candidates;
};
