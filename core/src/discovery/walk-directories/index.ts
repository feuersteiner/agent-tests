import { visitDirectory } from './visit-directory.js';

/** List directories beneath root in stable order, excluding generated trees and symlinks.
 * @param root Existing canonical directory to traverse.
 * @returns Root and its eligible descendants. Filesystem read failures propagate.
 */
export const walkDirectories = async (root: string): Promise<string[]> => {
	const directories: string[] = [];
	await visitDirectory(root, directories);
	return directories;
};
