import { walkDirectories } from '../walk-directories/index.js';
import { loadPackage } from './load-package.js';
import type { TestPackage } from '../types.js';

/** Load packages from eligible descendants of a canonical root; parse/read errors propagate. */
export const loadPackages = async (root: string): Promise<TestPackage[]> => {
	const packages: TestPackage[] = [];
	for (const directory of await walkDirectories(root)) {
		const packageTests = await loadPackage(root, directory);
		if (packageTests) packages.push(packageTests);
	}
	return packages;
};
