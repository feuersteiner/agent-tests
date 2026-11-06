import { lstat, readdir, readFile, realpath } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';
import { Source } from '../src/shared/source.ts';
import type { Options } from './args.ts';
import { baseCommit, git, gitPaths } from './git.ts';

const ignored = new Set([
	'.git',
	'node_modules',
	'dist',
	'.agents',
	'.svelte-kit',
	'build',
	'coverage'
]);
export const safePath = (path: string): boolean =>
	!path.split('/').some((part) => ignored.has(part) || part === '.env' || part.startsWith('.env.'));

export class FileSource extends Source {
	constructor(root: string, path: string, ref?: string) {
		super(path, async () => {
			if (ref) return git(root, ['show', `${ref}:${path}`]);
			const full = resolve(root, path);
			if (relative(root, full).split(sep).includes('..') || (await lstat(full)).isSymbolicLink())
				throw new Error('Unsafe source path');
			return readFile(full, 'utf8');
		});
	}
}

/** Walk real directories only; metadata and credentials never become source input. */
export const walk = async (root: string, prefix = ''): Promise<string[]> => {
	const paths: string[] = [];
	for (const entry of await readdir(join(root, prefix), { withFileTypes: true })) {
		const path = prefix ? `${prefix}/${entry.name}` : entry.name;
		if (!safePath(path) || entry.isSymbolicLink()) continue;
		if (entry.isDirectory()) paths.push(...(await walk(root, path)));
		else if (entry.isFile()) paths.push(path);
	}
	return paths;
};

export const loadSources = async (
	root: string,
	options: Options,
	filters: string[]
): Promise<Source[]> => {
	let paths: string[];
	let ref: string | undefined;
	if (options.staged) {
		paths = gitPaths(git(root, ['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z']));
		ref = ':';
	} else if (options.base) {
		const base = baseCommit(root, options.base);
		const merge = git(root, ['merge-base', base, 'HEAD']).trim();
		paths = gitPaths(git(root, ['diff', '--name-only', '--diff-filter=ACMR', '-z', merge, 'HEAD']));
		ref = 'HEAD';
	} else if (options.changed) {
		paths = [
			...gitPaths(git(root, ['diff', 'HEAD', '--name-only', '--diff-filter=ACMR', '-z'])),
			...gitPaths(git(root, ['ls-files', '--others', '--exclude-standard', '-z']))
		];
	} else {
		try {
			paths = gitPaths(git(root, ['ls-files', '--cached', '--others', '--exclude-standard', '-z']));
		} catch {
			paths = await walk(root);
		}
	}
	const selected: Source[] = [];
	for (const path of [...new Set(paths)].sort()) {
		if (
			!safePath(path) ||
			(filters.length &&
				!filters.some((filter) => {
					const local = relative(root, resolve(root, filter)).split(sep).join('/');
					return local === '' || path === local || path.startsWith(`${local}/`);
				}))
		)
			continue;
		if (ref) {
			const spec = ref === ':' ? `:${path}` : `${ref}:${path}`;
			const mode =
				ref === ':'
					? git(root, ['ls-files', '--stage', '--', path])
					: git(root, ['ls-tree', ref, '--', path]);
			if (!/^100(644|755)\b/.test(mode)) continue;
			const text = git(root, ['show', spec]);
			if (!text.includes('\0')) selected.push(new Source(path, async () => text));
		} else {
			const source = new FileSource(root, path);
			try {
				const full = resolve(root, path);
				if (
					!(await lstat(full)).isFile() ||
					(await realpath(full)) !== resolve(await realpath(root), path)
				)
					continue;
				if (!(await source.open()).includes('\0')) selected.push(source);
			} catch (error) {
				if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
			}
		}
	}
	return selected;
};
