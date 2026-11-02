import { isAbsolute, relative, resolve } from 'node:path';
import { posixPath } from '../posix-path.js';
import { isCandidatePath } from '../is-candidate-path.js';
import { matchesPaths } from './utils.js';
import { readContent } from './read-content.js';
import type { CandidateFile } from '../types.js';
import type { CandidateSelection } from './types.js';

/** Read eligible text contents in selected order, rejecting filtered and escaping paths.
 * @param selection Prepared canonical scope; content read failures propagate.
 * @returns Present regular text files, excluding binary contents and symbolic links.
 */
export const readCandidates = async (selection: CandidateSelection): Promise<CandidateFile[]> => {
	const candidates: CandidateFile[] = [];
	for (const file of selection.paths) {
		if (!isCandidatePath(file) || !matchesPaths(file, selection.filters)) continue;
		const absolutePath = resolve(selection.root, file);
		const normalized = posixPath(relative(selection.root, absolutePath));
		if (normalized.startsWith('../') || isAbsolute(normalized)) continue;
		const buffer = await readContent(selection, file, absolutePath);
		if (!buffer || buffer.includes(0)) continue;
		candidates.push({ path: normalized, absolutePath, content: buffer.toString('utf8') });
	}
	return candidates;
};
