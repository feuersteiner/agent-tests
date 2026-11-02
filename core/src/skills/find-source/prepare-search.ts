import { realpath } from 'node:fs/promises';
import { resolve } from 'node:path';

/**
 * @param root Existing repository or owning package directory.
 * @param id Kebab-case installed test id, never an arbitrary path.
 * @returns Canonical absolute search root.
 * @throws For invalid ids or an inaccessible root.
 */
export const prepareSearch = async (root: string, id: string): Promise<string> => {
	if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) throw new Error('Invalid test id');
	return realpath(resolve(root));
};
