import { join } from 'node:path';
import { walkDirectories } from '../../discovery/walk.js';
import { readSource } from './read-source.js';
import { isSourceDirectory } from './utils.js';
import type { CompilationSource } from './types.js';

/**
 * @param root Canonical root searched with discovery's generated-directory exclusions.
 * @param id Validated installed rule id.
 * @returns All regular sources under real .agents/tests/id directories.
 * @throws For unreadable directories or invalid source files; missing installations are skipped.
 */
export const collectSources = async (root: string, id: string): Promise<CompilationSource[]> => {
	const matches: CompilationSource[] = [];
	for (const owner of await walkDirectories(root)) {
		const directory = join(owner, '.agents', 'tests', id);
		if (!(await isSourceDirectory(owner, id))) continue;
		const source = await readSource(directory);
		if (source) matches.push(source);
	}
	return matches;
};
