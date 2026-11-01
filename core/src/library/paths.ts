import { lstat, mkdir, realpath } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve } from 'node:path';

/** Reject traversal and ambiguous catalog/test identifiers. */
export const assertId = (id: string): void => {
	if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) throw new Error('Invalid library test id.');
};

/** Resolve an owner inside the project, rejecting symlinks in every existing component. */
export const testDirectory = async (
	root: string,
	id: string,
	targetDir: string,
	create = false
): Promise<string> => {
	assertId(id);
	const base = await realpath(root);
	const owner = resolve(base, targetDir);
	const parts = relative(base, join(owner, '.agents', 'tests', id));
	if (
		parts === '..' ||
		parts.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`) ||
		isAbsolute(parts)
	)
		throw new Error('The target directory must stay inside the project.');
	let current = base;
	for (const part of parts.split(/[\\/]/)) {
		current = join(current, part);
		try {
			const stat = await lstat(current);
			if (stat.isSymbolicLink() || !stat.isDirectory())
				throw new Error('Library paths must be real directories, not symlinks or files.');
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
			if (create && current !== join(base, parts)) await mkdir(current);
		}
	}
	return current;
};

/** Check existence without following the final symlink. */
export const exists = async (path: string): Promise<boolean> => {
	try {
		await lstat(path);
		return true;
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
		throw error;
	}
};
