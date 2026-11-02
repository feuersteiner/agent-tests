import { execFile } from 'node:child_process';
import { lstat } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { promisify } from 'node:util';

const execute = promisify(execFile);

/** Check effective Git ignore rules; use the final exact rule when Git is unavailable. */
export const environmentIgnored = async (root: string, content: string): Promise<boolean> => {
	try {
		await execute('git', ['check-ignore', '--no-index', '--quiet', '--', '.env'], { cwd: root });
		return true;
	} catch (error) {
		if ((error as { code?: number }).code === 1) return false;
		// Without usable Git, only an exact final rule is safe to reuse; append otherwise.
		const last = content
			.split(/\r?\n/)
			.filter((line) => line.trim() && !line.startsWith('#'))
			.at(-1);
		return last === '.env' || last === '/.env';
	}
};

/** Refuse traversal and symlinks in writable setup paths. */
export const assertLocalPath = async (root: string, path: string): Promise<void> => {
	const name = relative(root, path);
	if (isAbsolute(name) || name === '..' || name.startsWith(`..${sep}`))
		throw new Error('Initialization path must remain inside the project');
	let current = root;
	for (const segment of name.split(sep).filter(Boolean)) {
		current = resolve(current, segment);
		try {
			if ((await lstat(current)).isSymbolicLink())
				throw new Error('Initialization preserves symbolic links; use a regular local path');
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
		}
	}
};
