import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execute = promisify(execFile);

/** Execute Git without a shell, preserving NUL-delimited filenames.
 * @param root Working directory for Git.
 * @param args Exact Git arguments; callers choose literal pathspecs where required.
 * @returns Standard output; execution errors, nonzero exits, and output overflow throw.
 */
export const git = async (root: string, args: string[]): Promise<string> => {
	const result = await execute('git', ['-C', root, ...args], { maxBuffer: 32 * 1024 * 1024 });
	return result.stdout;
};
