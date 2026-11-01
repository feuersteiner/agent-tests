import { readdir, lstat } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const excluded = new Set([
	'.git',
	'node_modules',
	'.svelte-kit',
	'.output',
	'.next',
	'coverage',
	'dist',
	'dist-cli',
	'build'
]);

/** Convert native separators to the path notation used in test definitions. */
export const posixPath = (path: string): string => path.split(sep).join('/');

/** Whether a normalized relative file or directory belongs to an owner. */
export const isWithinOwner = (owner: string, path: string): boolean =>
	owner === '.' || path === owner || path.startsWith(`${owner}/`);

/** List directories without traversing dependency trees or symbolic links. */
export const walkDirectories = async (root: string): Promise<string[]> => {
	const directories: string[] = [];
	const visit = async (directory: string): Promise<void> => {
		directories.push(directory);
		for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) =>
			a.name.localeCompare(b.name)
		)) {
			if (!entry.isDirectory() || excluded.has(entry.name) || entry.name === '.agents') continue;
			await visit(join(directory, entry.name));
		}
	};
	await visit(root);
	return directories;
};

/** List text-file candidates; reading contents happens after scope filtering. */
export const walkFiles = async (root: string): Promise<string[]> => {
	const files: string[] = [];
	for (const directory of await walkDirectories(root))
		for (const entry of await readdir(directory, { withFileTypes: true }))
			if (entry.isFile()) files.push(posixPath(relative(root, join(directory, entry.name))));

	return files.sort();
};

/** Reject symlinks anywhere between a checkout root and an input file. */
export const isRegularContainedFile = async (root: string, path: string): Promise<boolean> => {
	const segments = posixPath(path).split('/');
	if (segments.some((part) => part === '..') || path.startsWith('/') || path.includes('\0'))
		return false;

	let current = root;
	for (const [index, segment] of segments.entries()) {
		current = join(current, segment);
		try {
			const stat = await lstat(current);
			if (stat.isSymbolicLink()) return false;
			if (index === segments.length - 1) return stat.isFile();
			if (!stat.isDirectory()) return false;
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
			throw error;
		}
	}
	return false;
};

/** Exclude generated, dependency, Git, and test-definition content. */
export const isCandidatePath = (path: string): boolean =>
	!path.split('/').some((part) => excluded.has(part) || part === '.agents');
