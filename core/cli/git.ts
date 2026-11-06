import { execFileSync } from 'node:child_process';

/** Git stays in the CLI; arguments never pass through a shell. */
export const git = (root: string, args: string[]): string => {
	try {
		return execFileSync('git', ['-C', root, ...args], {
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'pipe'],
			maxBuffer: 64 * 1024 * 1024
		});
	} catch {
		throw new Error('Unable to read the requested Git snapshot');
	}
};
export const gitPaths = (value: string): string[] => value.split('\0').filter(Boolean);
export const baseCommit = (root: string, ref: string): string =>
	git(root, ['rev-parse', '--verify', '--end-of-options', `${ref}^{commit}`]).trim();
