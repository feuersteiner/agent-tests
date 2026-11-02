import { realpath } from 'node:fs/promises';
import { walkDirectories } from '../walk-directories/index.js';
import { findDirectories } from './find-directories.js';

/** Discover rule folders before parsing so validation can report broken definitions.
 * @param path Existing scan root; symbolic root spellings are canonicalized.
 * @returns Real rule directories, excluding dependency/generated trees and symlinks.
 * @throws For unreadable roots or filesystem failures.
 */
export const discoverTestDirectories = async (path: string): Promise<string[]> => {
	const root = await realpath(path);
	const directories = await walkDirectories(root);
	return findDirectories(directories);
};
