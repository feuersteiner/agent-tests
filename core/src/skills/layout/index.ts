import { walkDirectories } from '../../discovery/walk-directories/index.js';
import { collectRows } from './collect-rows.js';
import { renderRows } from './render-rows.js';

/**
 * @param root Canonical repository root.
 * @returns At most 80 outline entries plus a limit marker, or an empty-repository label.
 * @throws For filesystem read failures; file contents and hidden names are never read.
 */
export const describeLayout = async (root: string): Promise<string> => {
	const directories = await walkDirectories(root);
	const rows = await collectRows(root, root, 0, directories, []);
	return renderRows(rows);
};
