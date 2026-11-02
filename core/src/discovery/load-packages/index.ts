import { realpath } from 'node:fs/promises';
import { loadPackages } from './load-packages.js';
import { applyExemptions } from './apply-exemptions.js';
import type { DiscoveredTest } from '../types.js';

/** Discover compiled tests and inherited exemptions without modifying files.
 * @param path Existing scan root, canonicalized before ownership is assigned.
 * @returns Rules in stable directory order.
 * @throws For invalid definitions/configuration, mismatched ids, or filesystem failures.
 */
export const discoverTests = async (path: string): Promise<DiscoveredTest[]> => {
	const root = await realpath(path);
	const packages = await loadPackages(root);
	return applyExemptions(packages);
};
