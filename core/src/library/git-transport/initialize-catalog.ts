import { readTest } from './read-test.js';
import { closeCatalog, git } from './utils.js';
import type { LibraryCatalog } from '../types.js';

/** Fetch remote/ref into an empty temporary directory and expose regular-file reads at its commit. */
export const initializeCatalog = async (
	directory: string,
	remote: string,
	ref: string
): Promise<LibraryCatalog> => {
	await git(directory, ['init', '--bare', '--quiet']);
	await git(directory, ['fetch', '--quiet', '--depth=1', '--no-tags', '--', remote, ref]);
	const commit = (await git(directory, ['rev-parse', '--verify', 'FETCH_HEAD^{commit}'])).trim();
	const entries = await git(directory, ['ls-tree', '-z', `${commit}:library`]);
	const ids = entries
		.split('\0')
		.filter(Boolean)
		.flatMap((entry) => {
			const [metadata, id = ''] = entry.split('\t');
			return metadata?.startsWith('040000 ') && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) ? [id] : [];
		})
		.sort();
	return {
		commit,
		ids,
		readTest: readTest.bind(undefined, directory, commit, ids),
		close: closeCatalog.bind(undefined, directory)
	};
};
