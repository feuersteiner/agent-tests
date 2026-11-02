import { resolve } from 'node:path';
import { git } from './git.js';

/** Find the enclosing Git root, returning undefined only outside a repository.
 * @param root Existing working directory to inspect.
 * @returns Absolute repository root; other Git failures propagate.
 */
export const findGitRoot = async (root: string): Promise<string | undefined> => {
	try {
		return resolve((await git(root, ['rev-parse', '--show-toplevel'])).replace(/\r?\n$/, ''));
	} catch (error) {
		const failure = error as { stderr?: string; code?: number | string };
		if (failure.code === 128 && failure.stderr?.includes('not a git repository')) return;
		throw error;
	}
};
