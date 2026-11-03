import { readFile } from 'node:fs/promises';
import { relative } from 'node:path';
import { git } from '../git.js';
import { posixPath } from '../posix-path.js';
import { isRegularContainedFile } from '../is-regular-contained-file.js';
import type { CandidateSelection } from './types.js';

/** Read a real working file or an exact regular-file index entry.
 * @param selection Prepared scope; staged reads never use working-copy contents.
 * @param file Relative scan-root path.
 * @param absolutePath Canonical-root absolute path.
 * @returns Contents, or undefined for missing/nonregular files; read/Git failures propagate.
 */
export const readContent = async (
	selection: CandidateSelection,
	file: string,
	absolutePath: string
): Promise<Buffer | undefined> => {
	const { root, gitRoot, scope } = selection;
	if (scope.staged && gitRoot) {
		const repositoryPath = posixPath(relative(gitRoot, absolutePath));
		const mode = await git(gitRoot, [
			'--literal-pathspecs',
			'ls-files',
			'--stage',
			'-z',
			'--',
			repositoryPath
		]);
		if (!mode.startsWith('100644 ') && !mode.startsWith('100755 ')) return;
		return Buffer.from(await git(gitRoot, ['show', `:${repositoryPath}`]));
	}
	if (!(await isRegularContainedFile(root, file))) return;
	return readFile(absolutePath);
};
