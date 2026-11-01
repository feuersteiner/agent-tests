import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
import type { RunScope } from './types.js';

const execute = promisify(execFile);

/** Execute Git with literal arguments, preserving NUL-delimited filenames. */
export const git = async (root: string, args: string[]): Promise<string> => {
	const result = await execute('git', ['-C', root, ...args], { maxBuffer: 32 * 1024 * 1024 });
	return result.stdout;
};

const splitPaths = (output: string): string[] => output.split('\0').filter(Boolean);

/** Find the enclosing Git root, returning undefined only outside a repository. */
export const findGitRoot = async (root: string): Promise<string | undefined> => {
	try {
		return resolve((await git(root, ['rev-parse', '--show-toplevel'])).replace(/\r?\n$/, ''));
	} catch (error) {
		const failure = error as { stderr?: string; code?: number | string };
		if (failure.code === 128 && failure.stderr?.includes('not a git repository')) return;
		throw error;
	}
};

const hasHead = async (root: string): Promise<boolean> => {
	try {
		await git(root, ['rev-parse', '--verify', 'HEAD']);
		return true;
	} catch (error) {
		const failure = error as { code?: number };
		if (failure.code === 1 || failure.code === 128) {
			const branch = (await git(root, ['symbolic-ref', '--quiet', 'HEAD'])).trim();
			try {
				await git(root, ['show-ref', '--verify', '--quiet', branch]);
			} catch (missing) {
				if ((missing as { code?: number }).code === 1) return false;
				throw missing;
			}
		}
		throw error;
	}
};

/** Select present paths for a scope, with staged and working copies kept distinct. */
export const gitPaths = async (root: string, scope: RunScope): Promise<string[]> => {
	const diff = ['diff', '--name-only', '-z', '--relative', '--diff-filter=ACMRTUXB'];
	if (scope.staged) return splitPaths(await git(root, [...diff, '--cached', '--', '.']));
	if (scope.base) return splitPaths(await git(root, [...diff, `${scope.base}...HEAD`, '--', '.']));

	if (scope.changed) {
		const tracked = (await hasHead(root))
			? await git(root, [...diff, 'HEAD', '--', '.'])
			: await git(root, [...diff, '--cached', '--', '.']);
		const untracked = await git(root, [
			'ls-files',
			'--others',
			'--exclude-standard',
			'-z',
			'--',
			'.'
		]);
		return [...splitPaths(tracked), ...splitPaths(untracked)];
	}
	return splitPaths(
		await git(root, ['ls-files', '--cached', '--others', '--exclude-standard', '-z', '--', '.'])
	);
};
