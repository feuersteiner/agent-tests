import { lstat } from 'node:fs/promises';
import { join } from 'node:path';
import { posixPath } from './posix-path.js';

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
