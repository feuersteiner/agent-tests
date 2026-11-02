import { realpath } from 'node:fs/promises';
import { withCatalog } from '../catalog.js';
import { discoverInstalled } from './discover-installed.js';
import { updateInstalled } from './update-installed.js';
import type { LibraryOptions, LibraryResult } from '../types.js';

/**
 * Refresh unmodified managed copies below root, accepting a symlink to the project root.
 * @param root Existing project directory; owners and returned paths use its canonical location.
 * @param id Optional installed id; omission updates every discovered library copy.
 * @param options Optional offline transport/model overrides.
 * @returns Per-copy status, warnings, and eval exit codes (0 expected, 1 mismatch, 2 error).
 * @throws For invalid/missing ids, unsafe paths, catalog, validation, or filesystem errors.
 */
export const updateTests = async (
	root: string,
	id?: string,
	options: LibraryOptions = {}
): Promise<LibraryResult[]> => {
	root = await realpath(root);
	const directories = await discoverInstalled(root, id);
	if (directories.length === 0) return [];
	return withCatalog(root, options, (context) => updateInstalled(root, directories, context));
};
