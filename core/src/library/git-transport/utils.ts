import { execFile } from 'node:child_process';
import { realpath, rm } from 'node:fs/promises';
import { isAbsolute } from 'node:path';
import { promisify } from 'node:util';

const execute = promisify(execFile);
/** Run read/fetch Git arguments inside root; return stdout or reject with a credential-free error. */
export const git = async (root: string, args: string[]): Promise<string> => {
	try {
		const result = await execute('git', ['-C', root, ...args], {
			maxBuffer: 4 * 1024 * 1024,
			env: { ...process.env, GIT_TERMINAL_PROMPT: '0' }
		});
		return result.stdout;
	} catch {
		throw new Error('Cannot read the library Git catalog; check repository access and ref.');
	}
};

/** Resolve a local absolute repository or GitHub identity; reject unsafe repository/ref values. */
export const remoteSource = async (repository: string, ref: string): Promise<string> => {
	if (!ref || ref.startsWith('-') || /[\0\r\n]/.test(ref))
		throw new Error('Library ref must be a Git reference or commit.');
	if (isAbsolute(repository)) return realpath(repository);
	const parts = repository.split('/');
	if (parts.length !== 2 || parts.some((part) => !/^[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(part)))
		throw new Error('Library repository must be an owner/repository GitHub identity.');
	return `https://github.com/${repository}.git`;
};

/** Remove an isolated catalog directory; failures propagate to the caller. */
export const closeCatalog = async (directory: string): Promise<void> =>
	rm(directory, { recursive: true, force: true });

/** Read a regular Git object at a pinned commit; reject symlinks, trees, and missing files. */
export const readCatalogFile = async (
	directory: string,
	commit: string,
	object: string
): Promise<string> => {
	const mode = await git(directory, ['ls-tree', commit, '--', object]);
	if (!mode.startsWith('100644 ') && !mode.startsWith('100755 '))
		throw new Error('Library tests must contain regular TEST.md and test.yaml files.');
	return git(directory, ['show', `${commit}:${object}`]);
};
